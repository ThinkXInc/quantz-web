from os.path import dirname, abspath, join
from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for, make_response
from flask_httpauth import HTTPBasicAuth
import json

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

# Create a new blueprint or use the existing one
# If you prefer the name blueprint_interaction_model, rename accordingly:
blueprint_create = Blueprint('interaction_model', __name__)

# --------------------------------------------------------------------
#  Bring in all necessary imports from your original code
# --------------------------------------------------------------------
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'LOCALES_ROOT',
    'UNIT_PRICE_USD',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
    'REDIS_INTERACTION_MODEL_HOST',
    'REDIS_INTERACTION_MODEL_PORT',
    'REDIS_INTERACTION_MODEL_DB_NUMBER',
    'REDIS_INTERACTION_MODEL_LOGLEVEL',
    'REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

LOCALES_ROOT = Config.LOCALES_ROOT
UNIT_PRICE_USD = Config.UNIT_PRICE_USD
GENERAL_CREDIT_PER_RESPONSE = Config.GENERAL_CREDIT_PER_RESPONSE
INTERVIEW_CREDIT_PER_RESPONSE = Config.INTERVIEW_CREDIT_PER_RESPONSE
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER
REDIS_INTERACTION_MODEL_HOST = Config.REDIS_INTERACTION_MODEL_HOST
REDIS_INTERACTION_MODEL_PORT = Config.REDIS_INTERACTION_MODEL_PORT
REDIS_INTERACTION_MODEL_DB_NUMBER = Config.REDIS_INTERACTION_MODEL_DB_NUMBER
REDIS_INTERACTION_MODEL_LOGLEVEL = Config.REDIS_INTERACTION_MODEL_LOGLEVEL
REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC = Config.REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC

from libcommon.logger import Logger
logger = Logger('interaction_model')
logger.setLevel(logger.DEBUG)
from libcommon.color import *
from libcommon.validator import Validator, ValidationType
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


# Basic Config
from llm.models.basic_config import ResponseMode, ReferenceType

# Language
from libcommon.language import Language

# Locale
from libcommon.locale import Locale, COMMON_LOCALES_FILE_PATHS

# Datetime
from libcommon.dateutils import timestamp_to_time_ago_text

# Here we load from create_responses.json (which replaces interviews_responses.json)
# Make sure the "create_responses.json" file has the updated keys, such as:
#  "interaction_model_not_found", "interaction_model_update_error", etc.
CREATE_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/create_responses.json'
CREATE_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/create.json'
LOCALES_ROOT = Config.LOCALES_ROOT
BASIC_CONFIGS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/basic_configs.json'
INTERVIEW_TOP_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/interview_top.json'
METADATA_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/metadata.json'
CORPORATE_FOOTER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/corporate_footer.json'
HEADER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/header.json'
locale = Locale(
    [METADATA_LOCALE_FILE_PATH,
    HEADER_LOCALE_FILE_PATH,
    BASIC_CONFIGS_LOCALE_FILE_PATH,
    CREATE_LOCALE_FILE_PATH,
    CREATE_RESPONSES_LOCALE_FILE_PATH] + COMMON_LOCALES_FILE_PATHS
)

# AccessDB
from accessdb.host_manager import HostManager, HostSettingError

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


# TODO: remove this. single page
# create page
@blueprint_create.route('/<lang>/create', methods=['GET'])
@session_helper
@language_wrapper
def studio_create(user, lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/create'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')

    return render_template(
        'main/create.html',
        lang=lang,
        lang_name=lang_name,
        locale_json=locale.to_json_string(),
        unit_price=UNIT_PRICE_USD,
        general_credit_per_response=GENERAL_CREDIT_PER_RESPONSE,
        interview_credit_per_response=INTERVIEW_CREDIT_PER_RESPONSE,
        header_create_button_title=locale.get('header_create_button_title', lang),
        header_meetings_menu_title=locale.get('header_meetings_menu_title', lang),
        header_create_menu_title=locale.get('header_create_menu_title', lang),
        header_knowledge_menu_title=locale.get('header_knowledge_menu_title', lang),
        header_settings_menu_title=locale.get('header_settings_menu_title', lang),
        header_customize_menu_title=locale.get('header_customize_menu_title', lang),
        header_interviews_menu_title=locale.get('header_interviews_menu_title', lang),
        header_logout_menu_title=locale.get('header_logout_menu_title', lang),

        studio_header_menu_open=locale.get('studio_header_menu_open', lang),
        studio_header_menu_close=locale.get('studio_header_menu_close', lang),
        studio_header_tooltip_logo=locale.get('studio_header_tooltip_logo', lang),
        studio_header_create_new_label=locale.get('studio_header_create_new_label', lang),
        studio_header_tooltip_create_new=locale.get('studio_header_tooltip_create_new', lang),
        studio_header_deploy_label=locale.get('studio_header_deploy_label', lang),
        studio_header_tooltip_deploy=locale.get('studio_header_tooltip_deploy', lang),

        metadata=locale.dict()["metadata_home"][lang])


# create page
@blueprint_create.route('/test/load_message', methods=['GET'])
def test_load_message():
    logger.info(magenta(f'[GET] /test/load_message'))

    return render_template(
        'main/test_load_message.html')
 

# --------------------------------------------------------------------
#  Interaction Model CRUD endpoints
# --------------------------------------------------------------------

@blueprint_create.route('/v1/<lang>/interaction_model/list', methods=['GET'])
@language_wrapper
@session_helper
def interaction_model_list(user, lang, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/interaction_model/list'))

    try:
        interaction_models = interaction_model_db.get_many(str(user.id), limit=100)
        count = len(interaction_models)
        logger.debug(f'fetched {count} interaction_models => {interaction_models}')
    except InteractionModelQueryError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interaction_model_list_failed', lang)
        ).http_response()

    models_json = []
    for model in interaction_models:
        if model.created:
            model.created_str = timestamp_to_time_ago_text(model.created, lang)
        else:
            model.created_str = "(unknown)"

        model_dict = model.response_json()
        model_dict['created_str'] = model.created_str  # explicitly add it
        models_json.append(model_dict)

    response_data = {
        'interaction_models': models_json,
        'count': count
    }
    logger.debug(f'response data: {response_data}')

    return OKAPISuccessFormat(
        message=locale.get('interaction_model_list_success', lang),
        data=response_data
    ).http_response()


#
# CREATE
#
@blueprint_create.route('/v1/<lang>/interaction_model/create', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check([])
@session_helper
def interaction_model_create(user, lang, lang_name):
    """
    Create a new InteractionModel
    """
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    title = request.json.get('title', "")
    steps = request.json.get('steps', [])
    voiceset = request.json.get('voiceset', None)
    if voiceset is not None and not isinstance(voiceset, dict):
        # If voiceset is provided but not a dict, return a 400-type error
        message = locale.get('interaction_model_invalid_voiceset', lang, ["voiceset"])
        logger.error(red(f"voiceset must be a dictionary, got {type(voiceset)}"))
        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()

    logger.info(magenta(f'[POST] interaction_model/create => \n{"-"*100}\n{title}\n{steps}\n{voiceset}\n{"-"*100}'))

    # Attempt to save into DB
    try:
        new_model = InteractionModel(
            title=title,
            user_id=str(user.id),
            steps=[InteractionModelStep(**step) for step in steps if step.get('topic','').strip() != ''],
            voiceset=voiceset or {}  # store voiceset if given, else empty dict
        )
        new_model = interaction_model_db.create(new_model)
        if not new_model:
            raise InteractionModelSaveError("Failed to create interaction_model")

        # Register the newly created ID to AccessDB
        host_manager = HostManager(
            host=REDIS_ACCESS_HOST,
            port=REDIS_ACCESS_PORT,
            db_number=REDIS_ACCESS_DB_NUMBER
        )
        host_manager.set_id_in_service_with_host_id("interaction_model", str(new_model.id), str(user.id))

    except HostSettingError as e:
        message = str(e)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except InteractionModelSaveError as e:
        message = locale.get('interaction_model_save_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    return AcceptedAPISuccessFormat(
        message=locale.get('interaction_model_created', lang, [str(new_model.title)]),
        data=new_model.response_json()
    ).http_response()


#
# UPDATE
#
@blueprint_create.route('/v1/<lang>/interaction_model/<interaction_model_id>/update', methods=['POST'])
@language_wrapper
@content_type_check_json
@session_helper
@required_fields_check([])
def interaction_model_update(user, lang, lang_name, interaction_model_id):
    """
    Update an existing InteractionModel using set_interaction_model, 
    ignoring unknown keys in the request JSON.
    """
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    # Possible fields allowed for updates
    allowed_update_keys = ['title', 'steps', 'voiceset']

    # Filter out any unknown keys from request.json
    updates = {}
    for key in allowed_update_keys:
        if key in request.json:
            # If the key is voiceset, validate that it must be a dict
            if key == 'voiceset':
                if not isinstance(request.json['voiceset'], dict):
                    message = locale.get('interaction_model_invalid_voiceset', lang, ["voiceset"])
                    logger.error(red(f"voiceset must be a dict, got {type(request.json['voiceset'])}"))
                    return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()
            updates[key] = request.json[key]

    if not updates:
        # If no valid fields to update
        return BadRequestAPIErrorFormat(lang=lang).http_response()

    logger.info(magenta(f'[POST] interaction_model/{interaction_model_id}/update => \n{"-"*100}\n{updates}\n{"-"*100}'))

    try:
        # 1) Retrieve the existing model
        existing_model = interaction_model_db.get_one(interaction_model_id)

        # 2) Apply updates safely
        if 'title' in updates:
            existing_model.title = updates['title']

        if 'voiceset' in updates:
            existing_model.voiceset = updates['voiceset']

        # If steps are included in the update
        if 'steps' in updates:
            new_steps = []
            for step_dict in updates['steps']:
                # Remove any old or unknown keys such as 'question' 
                # (or anything else not used by InteractionModelStep)
                safe_step_data = {
                    # Use only the known InteractionModelStep fields
                    "topic": step_dict.get("topic", ""),
                    "remark": step_dict.get("remark", ""),
                    "goal": step_dict.get("goal", ""),
                    "max_turns": step_dict.get("max_turns", 3),
                    "guidelines": step_dict.get("guidelines", []),
                    "response_mode": step_dict.get("response_mode", ResponseMode.TEMPO_ORIENTED),
                    "reference_type": step_dict.get("reference_type", ReferenceType.ALL),
                    "references": step_dict.get("references", []),
                    "left": step_dict.get("left", 0.0),
                    "top": step_dict.get("top", 0.0),
                }
                # Construct each step as an InteractionModelStep
                new_steps.append(InteractionModelStep(**safe_step_data))

            existing_model.steps = new_steps

        # 3) Use set_interaction_model to store updates (instead of update)
        interaction_model_db.set_interaction_model(existing_model)

        logger.info(light_green(f'updated interaction_model {interaction_model_id}'))
        return existing_model.response_json()

    except InteractionModelNotFoundError:
        return ResourceNotFoundAPIErrorFormat(
            lang=lang, 
            message=locale.get('interaction_model_not_found', lang)
        ).http_response()
    except Exception as e:
        logger.error(red(f"Unexpected error updating InteractionModel: {e}"))
        return UnexpectedAPIErrorFormat(
            lang=lang, 
            message=locale.get('interaction_model_update_error', lang)
        ).http_response()

#
# DELETE one
#
@blueprint_create.route('/v1/<lang>/interaction_model/<interaction_model_id>/delete', methods=['GET'])
@language_wrapper
@session_helper
def delete_interaction_model(user, lang, interaction_model_id, lang_name):
    """
    Delete a single InteractionModel by ID
    """
    logger.info(magenta(f'[DELETE] /v1/{lang}/interaction_model/{interaction_model_id}/delete'))

    try:
        model_to_delete = interaction_model_db.get_one(interaction_model_id)
        logger.info(f'InteractionModel found: {model_to_delete}')
    except InteractionModelNotFoundError:
        message = locale.get('interaction_model_not_found', lang)
        logger.error(red(f"No interaction model found with ID: {interaction_model_id}"))
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except Exception as e:
        logger.error(red(f"Error retrieving interaction model with ID: {interaction_model_id}: {e}"))
        return UnexpectedAPIErrorFormat(
            lang=lang, 
            message=locale.get('interaction_model_delete_failed', lang)
        ).http_response()

    # Check ownership
    if str(model_to_delete.user_id) != str(user.id):
        message = locale.get('interaction_model_delete_not_allowed', lang)
        logger.warning(yellow(f"User {user.id} is not authorized to delete ID {interaction_model_id}"))
        return UnauthorizedAPIErrorFormat(lang=lang, message=message).http_response()

    try:
        interaction_model_db.delete(interaction_model_id)
        return OKAPISuccessFormat(
            message=locale.get('interaction_model_delete_success', lang, [model_to_delete.title]),
            data={'interaction_model_id': interaction_model_id}
        ).http_response()
    except InteractionModelDeleteError as e:
        logger.error(red(f"Error while deleting interaction_model {interaction_model_id}: {e}"))
        return UnexpectedAPIErrorFormat(
            lang=lang, 
            message=locale.get('interaction_model_delete_failed', lang)
        ).http_response()


#
# DELETE ALL (for a user)
#
@blueprint_create.route('/v1/<lang>/interaction_model/deleteall', methods=['GET'])
@language_wrapper
@session_helper
def delete_all_interaction_models(user, lang, lang_name):
    """
    Delete all InteractionModels for a given user
    """
    logger.info(magenta(f'[DELETE] /v1/{lang}/interaction_model/{user.id}/deleteall'))

    try:
        count = interaction_model_db.delete_all_for_user(str(user.id))
        message = f'Successfully deleted {count} interaction_model(s) for user ID: {user.id}'
        logger.info(green(message))
        return OKAPISuccessFormat(
            message=locale.get('interaction_model_delete_success', lang, [count]),
            data={'deleted_count': count}
        ).http_response()
    except InteractionModelDeleteError as e:
        logger.error(red(f"Error while deleting interaction models: {e}"))
        return UnexpectedAPIErrorFormat(
            lang=lang, 
            message=locale.get('interaction_model_delete_failed', lang)
        ).http_response()

