import json
from os.path import dirname, abspath, join
from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for
from flask_httpauth import HTTPBasicAuth

# AccessDB
from accessdb.host_manager import HostManager, HostSettingError

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_interviews = Blueprint('interviews', __name__)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'DEFAULT_LANG',
    'LOCALES_ROOT',
    'FIRST_MONTH_FREE_CREDIT',
    'UNIT_PRICE_USD',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
    "REDIS_INTERACTION_MODEL_HOST",
    "REDIS_INTERACTION_MODEL_PORT",
    "REDIS_INTERACTION_MODEL_DB_NUMBER",
    "REDIS_INTERACTION_MODEL_LOGLEVEL",
    "REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC",
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

DEFAULT_LANG = Config.DEFAULT_LANG
FIRST_MONTH_FREE_CREDIT = Config.FIRST_MONTH_FREE_CREDIT
UNIT_PRICE_USD = Config.UNIT_PRICE_USD
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER
REDIS_INTERACTION_MODEL_HOST = Config.REDIS_INTERACTION_MODEL_HOST
REDIS_INTERACTION_MODEL_PORT = Config.REDIS_INTERACTION_MODEL_PORT
REDIS_INTERACTION_MODEL_DB_NUMBER = Config.REDIS_INTERACTION_MODEL_DB_NUMBER
REDIS_INTERACTION_MODEL_LOGLEVEL = Config.REDIS_INTERACTION_MODEL_LOGLEVEL
REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC = Config.REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC

# Set logger
from libcommon.logger import Logger
logger = Logger('interviews')
logger.setLevel(logger.DEBUG)
from libcommon.color import *
from libcommon.validator import Validator, ValidationType

# Web API tools
from libcommon.web.session import RedisSessionInterface, Session
from libcommon.web.http_response_formatter import ValidationErrorsFormat
from libcommon.web.http_successes import OKAPISuccessFormat, CreatedAPISuccessFormat, \
    AcceptedAPISuccessFormat, PartialSuccessFormat
from libcommon.web.http_errors import InvalidContentTypeAPIErrorFormat, \
    UnexpectedAPIErrorFormat, ForbiddenAPIErrorFormat, ResourceNotFoundAPIErrorFormat, \
    BadRequestAPIErrorFormat, UnauthorizedAPIErrorFormat, RateLimitExceededAPIErrorFormat
from libcommon.web.validation_errors import RequiredFieldsNotSatisfiedFormat
from libcommon.web.flask_helpers import language_wrapper, content_type_check_json, \
    required_fields_check, validate_request, handle_error, session_helper

# Language
from libcommon.language import Language

# Local files
from libcommon.locale import Locale, COMMON_LOCALES_FILE_PATHS
LOCALES_ROOT = Config.LOCALES_ROOT
INTERVIEW_TOP_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/interview_top.json'
METADATA_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/metadata.json'
CORPORATE_FOOTER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/corporate_footer.json'
INTERVIEWS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/interviews.json'
INTERVIEW_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/interviews_responses.json'
HEADER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/header.json'
locale = Locale([
    METADATA_LOCALE_FILE_PATH,
    HEADER_LOCALE_FILE_PATH,
    INTERVIEW_RESPONSES_LOCALE_FILE_PATH] + COMMON_LOCALES_FILE_PATHS
)

# MongoDB
from init_mongodb import connect
from models.data.user import (
    User,
    UnauthorizedAccessError,
    UserNotFoundError,
    UserQueryError
)

# Redis InteractionModel
from llm.models.interaction_model import (
    InteractionModel,
    InteractionModelStep,
    InteractionModelDB,
    InteractionModelSaveError,
    InteractionModelNotFoundError,
    InteractionModelQueryError,
    InteractionModelUpdateError,
    InteractionModelDeleteError,
    NoUpdateFieldError
)
interaction_model_db = InteractionModelDB(
    host=REDIS_INTERACTION_MODEL_HOST,
    port=REDIS_INTERACTION_MODEL_PORT,
    db_number=REDIS_INTERACTION_MODEL_DB_NUMBER
)

# Redis ChatDB
from llm.chat_db import ChatData, ChatDB, ChatDataNotFoundError
from llm.init_chatdb import chat_db_remote

# Email
from mails.send_mail import (
    send_interview_result_email,
    MailSendError
)


# interview top
@blueprint_interviews.route('/interview', methods=['GET'])
@blueprint_interviews.route('/<lang>/interview', methods=['GET'])
@language_wrapper
def interview_top(lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/interviews'))
    locale.add_locale_file(INTERVIEW_TOP_LOCALE_FILE_PATH)
    locale.add_locale_file(INTERVIEWS_LOCALE_FILE_PATH)
    locale.add_locale_file(CORPORATE_FOOTER_LOCALE_FILE_PATH)
    return render_template(
        'interview_top.html',
        lang=lang,
        lang_name=lang_name,
        free_call=FIRST_MONTH_FREE_CREDIT,
        unit_price=UNIT_PRICE_USD,
        locale_json=locale.to_json_string(),
        locale_dict=locale.dict(),
        metadata=locale.dict()["metadata_interview_top"][lang])
 
@blueprint_interviews.route('/<lang>/interview/demo', methods=['GET'])
@language_wrapper
def interview_demo(lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/interview/demo'))

    # 0. Get parameters
    try:
        logger.info(cyan("Attempting to retrieve parameters from the request"))
        title = request.args.get('title', '').strip()
        opening_remark = request.args.get('opening_remark', '').strip()
        end = request.args.get('end', '').strip()
        steps = request.args.get('steps', '[]')  # Default to empty list if not provided
        steps = json.loads(steps)  # Parse the steps JSON string into a Python list
        logger.info(yellow(f"Parameters received - Title: {title}, Introduction: {opening_remark}, End: {end}, Steps: {steps}"))
    except Exception as e:
        logger.error(red(f"Failed to parse parameters: {e}"))
        message = f"{locale.get('interview_demo_create_error', lang)}: {e}"
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Check if empty
    if not title:
        key = 'title'
        message = locale.get('interview_demo_input_error', lang, [key])
        logger.error(red(f"Validation error: Title is empty"))
        return UnexpectedAPIErrorFormat(lang=lang, field_name=key, message=message).http_response()

    if not opening_remark:
        key = 'opening_remark'
        message = locale.get('interview_demo_input_error', lang, [key])
        logger.error(red(f"Validation error: Introduction is empty"))
        return UnexpectedAPIErrorFormat(lang=lang, field_name=key, message=message).http_response()

    if not end:
        key = 'end'
        message = locale.get('interview_demo_input_error', lang, [key])
        logger.error(red(f"Validation error: End is empty"))
        return UnexpectedAPIErrorFormat(lang=lang, field_name=key, message=message).http_response()

    for i, step in enumerate(steps):
        remark = step.get('remark', '').strip()
        if not remark:
            key = f'step.remark[{i}]'  # Indicate which step caused the issue
            message = locale.get('interview_demo_input_error', lang, [key])
            logger.error(red(f"Validation error: Step remark at index {i} is empty"))
            return UnexpectedAPIErrorFormat(lang=lang, field_name=key, message=message).http_response()

    # 1. Create interview
    user_id = "66961e8cdb50d5d0004bd6e3"  # support@quantz.thinkxinc.com
    try:
        logger.info(cyan(f"Creating interview for user_id: {user_id}"))
        interview = InteractionModel(
            title=title,
            opening_remark=opening_remark,
            end=end,
            user_id=user_id,
            steps=[InteractionModelStep(**step) for step in steps if step['remark'].strip() != '']
        )
        interview = interaction_model_db.create(interview)
        if not interview:
            raise InteractionModelSaveError("Failed to create interview")
        logger.info(cyan(f"Interview created successfully: {interview}"))

        # Host manager setup
        logger.info(yellow("Setting interview ID in host manager"))
        host_manager = HostManager(
            host=REDIS_ACCESS_HOST,
            port=REDIS_ACCESS_PORT,
            db_number=REDIS_ACCESS_DB_NUMBER)
        host_manager.set_id_in_service_with_host_id("interviews", str(interview.id), user_id)
        logger.info(cyan("Host manager updated successfully"))
    except HostSettingError as e:
        message = str(e)
        logger.error(red(f"Host manager error: {message}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except InteractionModelSaveError as e:
        message = locale.get('interview_save_error', lang)
        logger.error(red(f"Failed to save interaction model: {message}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Prepare response
    response_data = {
        'interview': interview
    }
    logger.debug(yellow(f"Response data prepared: {response_data}"))
    return OKAPISuccessFormat(
        message=locale.get('interview_created', lang, [interview.id]),
        data=response_data).http_response()

# main page
@blueprint_interviews.route('/v1/<lang>/interviews', methods=['GET'])
@session_helper
@language_wrapper
def interview_home(user, lang, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/interviews'))

    locale.add_locale_file(INTERVIEWS_LOCALE_FILE_PATH)

    return render_template(
        'main/interviews.html',
        lang=lang,
        lang_name=lang_name,
        locale_json=locale.to_json_string(),
        header_create_button_title=locale.get('header_create_button_title', lang),
        header_meetings_menu_title=locale.get('header_meetings_menu_title', lang),
        header_interaction_menu_title=locale.get('header_interaction_menu_title', lang),
        header_knowledge_menu_title=locale.get('header_knowledge_menu_title', lang),
        header_settings_menu_title=locale.get('header_settings_menu_title', lang),
        header_customize_menu_title=locale.get('header_customize_menu_title', lang),
        header_interviews_menu_title=locale.get('header_interviews_menu_title', lang),
        header_logout_menu_title=locale.get('header_logout_menu_title', lang),
        metadata=locale.dict()["metadata_home"][lang])

# interview page
@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>', methods=['GET'])
@language_wrapper
def interview_window(lang, interview_id, lang_name):
    logger.info(magenta(f'[GET] /{lang}/interviews/{interview_id}'))

    locale.add_locale_file(INTERVIEWS_LOCALE_FILE_PATH)

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')
    try:
        interview = interaction_model_db.get_one(interview_id)
        #interview = Interview.get_one(interview_id)
        logger.info(f'interview found: {interview}')
    except InteractionModelNotFoundError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interview_not_found', lang)
        ).http_response()

    return render_template(
        'main/interview.html',
        lang=lang,
        lang_name=lang_name,
        host_id=str(interview.user_id),  # NOTE: Be careful this instance is of InteractionModel (not Interview model)
        interview_id=interview_id,
        interview_title=interview.title,
        locale_json=locale.to_json_string(),
        metadata=locale.dict()["metadata_home"][lang])

# Interview list
@blueprint_interviews.route('/v1/<lang>/interviews/list', methods=['GET'])
@language_wrapper
@session_helper
def interviews_list(user, lang, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/interviews/list'))

    # List interviews
    try:
        interviews = interaction_model_db.get_many(str(user.id), limit=100)
        count = len(interviews)
        logger.debug(f'fetched {count} interviews => {interviews}')
    except InteractionModelQueryError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interviews_list_failed', lang)
        ).http_response()

    response_data = {
        'interviews': interviews,
        'count': count
    }
    logger.debug(f'response data: {response_data}')
    return OKAPISuccessFormat(
        message=locale.get('interviews_list_success', lang),
        data=response_data).http_response()


@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>/results/list', methods=['GET'])
@language_wrapper
@session_helper
def interview_results_list(user, lang, interview_id, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/interviews/{interview_id}/results/list'))

    # Extract 'limit' from query parameters, default to None if not provided
    limit = request.args.get('limit', type=int, default=None)
    logger.info(f'Limit parameter received: {limit}')

    try:
        interview = interaction_model_db.get_one(interview_id)
        logger.info(f'interview found: {interview}')
    except InteractionModelNotFoundError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interview_not_found', lang)
        ).http_response()

    results = []
    count = 0
    for client_id in set(interview.client_ids):
        if limit is not None and count >= limit:
            break
        try:
            logger.info(f'get ChatData by client_id: {client_id}')
            chatdata = chat_db_remote.get_chat_data(client_id)
            if not len(chatdata.client_id):
                message = f'ChatData not found by client_id: "{client_id}"'
                logger.error(red(message))
                raise ChatDataNotFoundError(message)
            else:
                logger.info(bold(f'ChatData found by client_id: {client_id} => {chatdata.name} {chatdata.start_time}'))
                results.append(chatdata.response_json(include_date_str=True, lang=lang))
                count += 1
        except Exception as e:
            logger.warning(yellow(str(e)))

    response_data = {
        'interview_results': results,
        'count': count
    }
    logger.debug(f'response data: {response_data}')
    return OKAPISuccessFormat(
        message=locale.get('interviews_results_success', lang),
        data=response_data).http_response()


# New interview create
@blueprint_interviews.route('/v1/<lang>/interviews/create', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['title', 'steps'])
@session_helper
def interviews_create(user, lang, lang_name):
    
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    title = request.json.get('title')
    steps = request.json.get('steps')
    logger.info(magenta(f'[POST] interviews/create => \n'+'-'*100+f'\n{title}'+'-'*100))

    # Save results in the database using the create_new method
    try:
        interview = InteractionModel(
            title=title,
            user_id=str(user.id),
            steps=[InteractionModelStep(**step) for step in steps if step['topic'].strip() != '']
        )
        interview = interaction_model_db.create(interview)
        if not interview:
            raise InteractionModelSaveError("Failed to create interview")
        logger.info(cyan(f"Interview created successfully {interview}"))
        host_manager = HostManager(
            host=REDIS_ACCESS_HOST,
            port=REDIS_ACCESS_PORT,
            db_number=REDIS_ACCESS_DB_NUMBER)
        host_manager.set_id_in_service_with_host_id("interviews", str(interview.id), str(user.id))
    except HostSettingError as e:
        message = str(e)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except InteractionModelSaveError as e:
        message = locale.get('interview_save_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    
    # Return Response
    return AcceptedAPISuccessFormat(
        message=locale.get('interview_created', lang, [str(interview.title)]),
        data=interview.response_json()).http_response()


# Interview update
@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>/update', methods=['POST'])
@language_wrapper
@content_type_check_json
@session_helper
@required_fields_check([])
def interviews_update(user, lang, lang_name, interview_id):
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    # Gather updates from the request, including handling steps if they are part of the update
    updates = {key: request.json[key] for key in ['title', 'opening_remark', 'end', 'steps'] if key in request.json}
    if not updates:
        return BadRequestAPIErrorFormat(lang).http_response()

    logger.info(magenta(f'[POST] interviews/{interview_id}/update => \n'+'-'*100+f'\n{updates}'+'-'*100))

    # Update interaction model in Redis
    try:
        interview = interaction_model_db.update(interview_id, updates)
        logger.info(light_green(f'updated interview {interview}'))
    except InteractionModelNotFoundError:
        return ResourceNotFoundAPIErrorFormat(
            lang=lang, message=locale.get('interview_not_found', lang)).http_response()
    except InteractionModelUpdateError:
        return UnexpectedAPIErrorFormat(
            lang=lang, message=locale.get('interview_update_error', lang)).http_response()

    return OKAPISuccessFormat(
        message=locale.get('interview_updated', lang, [interview.title]),
        data=interview.response_json()
    ).http_response()

@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>/delete', methods=['GET'])
@language_wrapper
@session_helper
def delete_interview(user, lang, interview_id, lang_name):
    logger.info(magenta(f'[DELETE] /v1/{lang}/interviews/{interview_id}/delete'))

    # Attempt to retrieve the interaction model
    try:
        interaction_model = interaction_model_db.get_one(interview_id)
        logger.info(f'Interaction model found: {interaction_model}')
    except InteractionModelNotFoundError:
        message = locale.get('interview_not_found', lang)
        logger.error(red(f"No interaction model found with ID: {interview_id}"))
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except Exception as e:
        logger.error(red(f"Error retrieving interaction model with ID: {interview_id}: {e}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=locale.get('interviews_delete_failed', lang)).http_response()

    # Check if the user has permission to delete the interaction model
    if str(interaction_model.user_id) != str(user.id):
        message = locale.get('interview_delete_not_allowed', lang)
        logger.warning(yellow(f"User {user.id} is not authorized to delete interview {interview_id}"))
        return UnauthorizedAPIErrorFormat(lang=lang, message=message).http_response()

    # Proceed to delete the interaction model
    try:
        interaction_model_db.delete(interview_id)
        return OKAPISuccessFormat(
            message=locale.get('interview_delete_success', lang, [interaction_model.title]),
            data={'interview_id': interview_id}
        ).http_response()
    except InteractionModelDeleteError as e:
        logger.error(red(f"Error while deleting interview {interview_id}: {e}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=locale.get('interviews_delete_failed', lang)).http_response()


@blueprint_interviews.route('/v1/<lang>/interviews/deleteall', methods=['GET'])
@language_wrapper
@session_helper
def delete_all_interviews(user, lang, lang_name):
    logger.info(magenta(f'[DELETE] /v1/{lang}/interviews/{user.id}/deleteall'))

    try:
        count = interaction_model_db.delete_all_for_user(str(user.id))
        message = f'Successfully deleted {count} interviews for user ID: {user.id}'
        logger.info(green(message))
        return OKAPISuccessFormat(message=locale.get('interviews_delete_success', lang, [count]), data={'deleted_count': count}).http_response()
    except InteractionModelDeleteError as e:
        logger.error(red(f"Error while deleting interviews: {e}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=locale.get('interviews_delete_failed', lang)).http_response()


# Add this new endpoint to update is_result_checked
@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>/results/<client_id>/check', methods=['POST'])
@language_wrapper
@session_helper
def set_result_checked(user, lang, interview_id, client_id, lang_name):
    logger.info(f"Setting is_result_checked to True for client_id: {client_id}")
    try:
        chatdata = chat_db_remote.get_chat_data(client_id)
        if chatdata:
            chatdata.is_result_checked = True
            chat_db_remote.set_chat_data(client_id, chatdata)
            return OKAPISuccessFormat(
                message=locale.get('interview_result_checked', lang),
                data={}
            ).http_response()
        else:
            return ResourceNotFoundAPIErrorFormat(
                lang=lang, message=locale.get('chatdata_not_found', lang)
            ).http_response()
    except Exception as e:
        logger.error(str(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()

# Endpoint for email tracking image
@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>/results/<client_id>/check.gif', methods=['GET'])
@language_wrapper
def image_result_checked(lang, interview_id, client_id, lang_name):
    logger.info(f"Email opened, setting is_result_checked to True for client_id: {client_id}")
    try:
        chatdata = chat_db_remote.get_chat_data(client_id)
        if chatdata:
            chatdata.is_result_checked = True
            chat_db_remote.set_chat_data(client_id, chatdata)
            # Return 1x1 transparent GIF
            transparent_gif = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04' \
                              b'\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02' \
                              b'D\x01\x00;'
            response = make_response(transparent_gif)
            response.headers['Content-Type'] = 'image/gif'
            response.headers['Content-Length'] = len(transparent_gif)
            return response
        else:
            return ResourceNotFoundAPIErrorFormat(
                lang=lang, message=locale.get('chatdata_not_found', lang)
            ).http_response()
    except Exception as e:
        logger.error(str(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()


# Abstracted method to process metadata
def process_metadata(metadata, lang):
    try:
        # Extract required fields
        client_id = metadata["clientId"]
        host_id = metadata["hostId"]
        identifier = metadata["identifier"]

        logger.info(f'get ids from metadata: [host_id] {host_id} [client_id] {client_id} [identifier] {identifier}')

        # Fetch and update chat data
        chatdata = chat_db_remote.get_chat_data(client_id)
        if not chatdata or not len(chatdata.client_id):
            message = f'Chat data not found by client_id: "{client_id}"'
            logger.error(red(message))
            raise ChatDataNotFoundError(message)

        chatdata.metadata = json.dumps(metadata)  # Convert to string
        chatdata.is_video_saved = True

        # Check if email has already been sent
        if chatdata.is_email_sent:
            logger.info(light_green(f'Email already sent for client_id: {client_id}. Skipping email sending.'))
        else:
            # Fetch interview data
            interview = interaction_model_db.get_one(identifier)
            logger.info(f'Interview found: {interview}')

            # Fetch user data and send email
            user = User.find_user_by_id(host_id)
            lang_in_chat = chatdata.lang if chatdata.lang else lang
            send_interview_result_email(user, metadata, interview, lang_in_chat)
            logger.info(light_green(f'Interview result email successfully sent to {user.email}.'))

            # Mark email as sent
            chatdata.is_email_sent = True

        # Save the updated chat data
        chat_db_remote.set_chat_data(client_id, chatdata)
        logger.info(light_green(f'Chat data successfully updated.'))

        return True  # Indicate successful processing

    except (ChatDataNotFoundError, InteractionModelNotFoundError, UserNotFoundError, UserQueryError) as e:
        message = f'Failed to process metadata with error: {e}'
        logger.error(red(message))
        return message  # Return error message

    except Exception as e:
        message = f'Failed to deliver interview result with error: {e}'
        logger.error(red(message))
        return message  # Return error message

@blueprint_interviews.route('/v1/webhook/files/uploaded', methods=['POST'])
@content_type_check_json
def webhook_files_uploaded():
    logger.info(cyan(f'request: {request.url} => request.json: {request.json}'))

    payload = request.json
    lang = DEFAULT_LANG

    logger.info(magenta(f'[POST] /v1/webhook/files/uploaded => \n' + '-'*100 + f'\n{payload}' + '-'*100))

    # Validate payload keys
    if "event" not in payload:
        message = 'Missing "event" key in payload.'
        logger.error(red(message))
        return 'Invalid payload', 400

    event = payload["event"]
    logger.info(bold(f'webhook event: {event}'))

    metadata_processed = False
    metadata_error = None

    # Process metadata if present
    if "metadata" in payload and payload["metadata"]:
        result = process_metadata(payload["metadata"], lang)
        if result is True:
            metadata_processed = True
        else:
            metadata_error = result

    # Handle event-specific logic
    if event == "save.success":
        message = f'Successfully processed {event} event for webhook {request.url}.'
        if metadata_processed:
            message += " Metadata processed successfully."
        elif metadata_error:
            message += f" Metadata processing failed with error: {metadata_error}"
        logger.info(green(message))
        return OKAPISuccessFormat(message=message).http_response()

    elif event == "save.fail.diskfull" or event == "save.fail.unknownerror":
        # Distinguish cases based on metadata processing success
        base_message = f'Failed to save interview result data due to {("disk full" if event == "save.fail.diskfull" else "an unknown error")}.'
        if metadata_processed:
            message = base_message + " However, metadata was processed successfully."
            logger.warning(yellow(message))
            return PartialSuccessFormat(message=message, error_detail=base_message).http_response()
        elif metadata_error:
            message = base_message + f" Additionally, metadata processing failed with error: {metadata_error}"
            logger.error(red(message))
            return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    else:
        message = f'Event "{event}" is unknown.'
        if metadata_processed:
            message += " However, metadata was processed successfully."
        elif metadata_error:
            message += f" Additionally, metadata processing failed with error: {metadata_error}"
        logger.error(red(message))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()


@blueprint_interviews.route('/interviews/mailsample/send', methods=['GET'])
def mailsample_send():
    logger.info(magenta(f'[GET] /interviews/mailsample/send'))

    # Prepare the recipient email address
    sendto = "kaz@thinkxinc.com"

    # Create a user object with the recipient's email
    user = User(email=sendto)

    # Prepare the metadata from the expected sample mail
    metadata = {
        'startDatetime': '2024-11-08T12:31:00',
        'userInfo': {
            'name': 'Lara',
            'email': 'laraland@mail.com'
        },
        'videoPathAll': '',  # No video links
        'screenShotPathAll': '/img/interviews/samplemail/full.png',
        'events': [
            {
                'speaker': 'system',
                'message': 'Hello, Lara. I would like to conduct a simple interview with you now. Are you ready?',
                'videoPath': '',
                'screenShotPath': None
            },
            {
                'speaker': 'user',
                'message': "Yes, I'm ready.",
                'videoPath': '/img/interviews/samplemail/video/user_0.mov',
                'screenShotPath': '/img/interviews/samplemail/user_0.png'
            },
            {
                'speaker': 'system',
                'message': 'Okay. Could you briefly introduce yourself?',
                'videoPath': '',
                'screenShotPath': None
            },
            {
                'speaker': 'user',
                'message': (
                    "Okay, my name is Lara. I'm a second-year master's student at the University of Tokyo studying new media design. "
                    "Specifically, I'm developing devices that enhance human creativity using sensory feedback. "
                    "For example, this project combines visual, auditory, and tactile inputs to support diverse creative tasks."
                ),
                'videoPath': '/img/interviews/samplemail/video/user_1.mov',
                'screenShotPath': '/img/interviews/samplemail/user_1.png'
            },
            {
                'speaker': 'system',
                'message': (
                    "Okay. This company provides next-generation communication services using LLM technology. "
                    "What skills do you think you can contribute?"
                ),
                'videoPath': None,
                'screenShotPath': None
            },
            {
                'speaker': 'user',
                'message': (
                    "Since I studied at the design school in Shanghai, I'm skilled with contemporary graphic and video editing tools. "
                    "With over four years of experience and a following of 5,000 on social media, "
                    "I can contribute to creative growth, especially in marketing and design."
                ),
                'videoPath': '/img/interviews/samplemail/video/user_3.mov',
                'screenShotPath': '/img/interviews/samplemail/user_3.png'
            },
            {
                'speaker': 'system',
                'message': (
                    "Okay, thank you. Finally, could you tell us what aspects of our company interested you the most?"
                )
            },
            {
                'speaker': 'user',
                'message': (
                    "ThinkX is challenging new things and developing future possibilities, and I thought that the company's attitude of following creative people suited me."
                ),
                'videoPath': '/img/interviews/samplemail/video/user_3.mov',
                'screenShotPath': '/img/interviews/samplemail/user_3.png'
            },
            {
                'speaker': 'system',
                'message': (
                    "Operator: Thank you, Lara. This is the end. Please feel free to write any follow-up information. Goodbye."
                ),
                'videoPath': '',
                'screenShotPath': None
            }
        ]
    }

    # Prepare the interview object with the title
    interview = InteractionModel(title="Interview A")

    # Set the language
    lang = 'ja'

    # Send the email using the existing send_interview_result_email function
    try:
        send_interview_result_email(user, metadata, interview, lang)
        logger.info(light_green(f'Sample email sent to {user.email}'))
        return jsonify({'status': 'success', 'message': 'Sample email sent'}), 200
    except MailSendError as e:
        logger.error(f"Failed to send sample email: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to send sample email'}), 500


# Interview add client_id
@blueprint_interviews.route('/interviews/<interview_id>/add/<client_id>', methods=['GET'])
def interview_add_client_id(interview_id, client_id):

    logger.info(magenta(f'[GET] /interviews/{interview_id}/add/{client_id}'))

    lang = 'en'

    try:
        interview = interaction_model_db.get_one(interview_id)
        #interview = Interview.get_one(interview_id)
        logger.info(f'interview found: {interview}')
    except InteractionModelNotFoundError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interview_not_found', lang)
        ).http_response()

    interview.client_ids += [client_id]

    # Update interaction model in Redis
    try:
        interaction_model_db.set_interaction_model(interview)
        logger.info(light_green(f'updated interview {interview}'))
    except InteractionModelNotFoundError:
        return ResourceNotFoundAPIErrorFormat(
            lang=lang, message=locale.get('interview_not_found', lang)).http_response()
    except InteractionModelUpdateError:
        return UnexpectedAPIErrorFormat(
            lang=lang, message=locale.get('interview_update_error', lang)).http_response()

    return OKAPISuccessFormat(
        message=locale.get('interview_updated', lang, [interview_id]),
        data=interview.response_json()
    ).http_response()