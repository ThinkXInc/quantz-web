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
    AcceptedAPISuccessFormat
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
METADATA_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/metadata.json'
INVERVIEWS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/interviews.json'
INVERVIEW_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/interviews_responses.json'
locale = Locale([
    METADATA_LOCALE_FILE_PATH,
    INVERVIEWS_LOCALE_FILE_PATH,
    INVERVIEW_RESPONSES_LOCALE_FILE_PATH] + COMMON_LOCALES_FILE_PATHS
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

# main page
@blueprint_interviews.route('/v1/<lang>/interviews', methods=['GET'])
@session_helper
@language_wrapper
def interview_home(user, lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/interviews'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')
 
    return render_template(
        'main/interviews.html',
        lang=lang,
        lang_name=lang_name,
        locale_json=locale.to_json_string(),
        metadata=locale.dict()["metadata_home"][lang])

# interview page
@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>', methods=['GET'])
@language_wrapper
def interview_window(lang, interview_id, lang_name):
    logger.info(magenta(f'[GET] /{lang}/interviews/{interview_id}'))

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

# New interview create
@blueprint_interviews.route('/v1/<lang>/interviews/create', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['title', 'introduction', 'steps', 'end'])
@session_helper
def interviews_create(user, lang, lang_name):
    
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    title = request.json.get('title')
    introduction = request.json.get('introduction')
    end = request.json.get('end')
    steps = request.json.get('steps')
    logger.info(magenta(f'[POST] interviews/create => \n'+'-'*100+f'\n{title}'+'-'*100))

    # Save results in the database using the create_new method
    try:
        interview = InteractionModel(
            title=title,
            introduction=introduction,
            end=end,
            user_id=str(user.id),
            steps=[InteractionModelStep(**step) for step in steps if step['question'].strip() != '']
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
        message=locale.get('interview_created', lang, [str(interview.id)]),
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
    updates = {key: request.json[key] for key in ['title', 'introduction', 'end', 'steps'] if key in request.json}
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
        message=locale.get('interview_updated', lang, [interview_id]),
        data=interview.response_json()
    ).http_response()

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


# webhook from fileserver
@blueprint_interviews.route('/v1/webhook/files/uploaded', methods=['POST'])
@content_type_check_json
def webhook_files_uploaded():
    logger.info(cyan(f'request: {request.url} => request.json: {request.json}'))

    payload = request.json
    lang = DEFAULT_LANG

    logger.info(magenta(f'[POST] /v1/webhook/files/uploaded => \n'+'-'*100+f'\n{payload}'+'-'*100))

    # Validate payload keys
    if "event" not in payload:
        message = 'Missing "event" key in payload.'
        logger.error(red(message))
        return 'Invalid payload', 400
    
    event = payload["event"]

    logger.info(bold(f'webhook event: {event}'))

    if event == "save.success":

        try:
            # update chatdata
            if "metadata" not in payload:
                raise ValueError("Missing 'metadata' in payload")

            metadata = payload["metadata"]

            if "clientId" not in metadata:
                raise ValueError("Missing 'clientId' in payload")

            if "identifier" not in metadata:
                raise ValueError("Missing 'identifier' in payload")

            if "hostId" not in metadata:
                raise ValueError("Missing 'hostId' in payload")

            client_id = metadata["clientId"]
            host_id = metadata["hostId"]
            identifier = metadata["identifier"]

            logger.info(f'get ids from metadata: [host_id] {host_id} [client_id] {client_id} [identifier] {identifier}')

            chatdata = chat_db_remote.get_chat_data(client_id)
            if not len(chatdata.client_id):
                message = f'chat data not found by client_id: "{client_id}"'
                logger.error(red(message))
                raise ChatDataNotFoundError(message)

            chatdata.metadata = json.dumps(metadata)  # to string
            chatdata.is_video_saved = True

            # retrieve chatdata from local redis
            chat_db_remote.set_chat_data(client_id, chatdata)
            logger.info(light_green(f'chatdata successfully updated with uploaded metadata.'))
        except Exception as e:
            message = f'Failed to save metadata with error: {e}'
            logger.error(red(message))
            return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

        ### DEBUG
        chatdata = chat_db_remote.get_chat_data(client_id)
        logger.info(cyan(f'updated chatdata. {chatdata}'))
        ###

        try:
            interview = interaction_model_db.get_one(identifier)
            logger.info(f'interview found: {interview}')
        except InteractionModelNotFoundError:
            return UnexpectedAPIErrorFormat(
                lang=lang,
                message=locale.get('interview_not_found', lang)
            ).http_response()

        try:
            # Fetch the user from the database
            user = User.find_user_by_id(host_id)
            lang_in_chat = chatdata.lang if chatdata.lang else lang
            send_interview_result_email(user, metadata, interview, lang_in_chat)
            logger.info(light_green(f'interview result mail successfully sent to {user.email}.'))
        except UserNotFoundError:
            message = locale.get('user_not_found', lang)
            return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
        except UserQueryError:
            message = locale.get('user_find_single_failed', lang)
            return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
        except Exception as e:
            message = f'Failed to deliver interview result with error: {e}'
            logger.error(red(message))
            return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

        message = f'Successfully processed {event} event for webhook {request.url}.'
        logger.info(green(message))
        return OKAPISuccessFormat(message=message).http_response()

    elif event == "save.fail.diskfull":
        message = f'Failed to save interview result data because of disk full.'
        logger.error(red(message))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    elif event == "save.fail.unknownerror":
        message = f'Failed to save interview result data with unknown error'
        logger.error(red(message))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    else:
        message = f'{event} is unknown event.'
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