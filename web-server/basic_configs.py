from os.path import dirname, abspath, join
from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_basic_configs = Blueprint('basic_configs', __name__)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'LOCALES_ROOT',
    "REDIS_BASIC_CONFIG_HOST",
    "REDIS_BASIC_CONFIG_PORT",
    "REDIS_BASIC_CONFIG_DB_NUMBER",
    "REDIS_BASIC_CONFIG_LOGLEVEL",
    "REDIS_BASIC_CONFIG_EXPIRATION_TIME_SEC",
    "REDIS_INTERACTION_MODEL_HOST",
    "REDIS_INTERACTION_MODEL_PORT",
    "REDIS_INTERACTION_MODEL_DB_NUMBER",
    "REDIS_INTERACTION_MODEL_LOGLEVEL",
    "REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC",
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)
REDIS_BASIC_CONFIG_HOST = Config.REDIS_BASIC_CONFIG_HOST
REDIS_BASIC_CONFIG_PORT = Config.REDIS_BASIC_CONFIG_PORT
REDIS_BASIC_CONFIG_DB_NUMBER = Config.REDIS_BASIC_CONFIG_DB_NUMBER
REDIS_BASIC_CONFIG_LOGLEVEL = Config.REDIS_BASIC_CONFIG_LOGLEVEL
REDIS_BASIC_CONFIG_EXPIRATION_TIME_SEC = Config.REDIS_BASIC_CONFIG_EXPIRATION_TIME_SEC
REDIS_INTERACTION_MODEL_HOST = Config.REDIS_INTERACTION_MODEL_HOST
REDIS_INTERACTION_MODEL_PORT = Config.REDIS_INTERACTION_MODEL_PORT
REDIS_INTERACTION_MODEL_DB_NUMBER = Config.REDIS_INTERACTION_MODEL_DB_NUMBER
REDIS_INTERACTION_MODEL_LOGLEVEL = Config.REDIS_INTERACTION_MODEL_LOGLEVEL
REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC = Config.REDIS_INTERACTION_MODEL_EXPIRATION_TIME_SEC

# Set logger
from libcommon.logger import Logger
logger = Logger('basic_configs')
logger.setLevel(logger.DEBUG)
from libcommon.color import *
from libcommon.validator import Validator, ValidationType

# Web API tools
from libcommon.web.session import RedisSessionInterface, Session
#from libcommon.web.http_response_formatter import ValidationErrorsFormat
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
BASIC_CONFIGS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/basic_configs.json'
BASIC_CONFIGS_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/basic_configs_responses.json'
locale = Locale([
    BASIC_CONFIGS_LOCALE_FILE_PATH,
    BASIC_CONFIGS_RESPONSES_LOCALE_FILE_PATH] + COMMON_LOCALES_FILE_PATHS
)

# Redis BasicConfig
from llm.models.basic_config import (
    BasicConfig,
    BasicConfigDB,
    BasicConfigNotFoundError
)
basic_config_db = BasicConfigDB(
    host=REDIS_BASIC_CONFIG_HOST,
    port=REDIS_BASIC_CONFIG_PORT,
    db_number=REDIS_BASIC_CONFIG_DB_NUMBER
)

# InteractionModelDB
from llm.models.interaction_model import (
    InteractionModel,
    InteractionModelStep,
    InteractionModelDB,
    InteractionModelNotFoundError,
    InteractionModelQueryError,
    NoUpdateFieldError
)
interaction_model_db = InteractionModelDB(
    host=REDIS_INTERACTION_MODEL_HOST,
    port=REDIS_INTERACTION_MODEL_PORT,
    db_number=REDIS_INTERACTION_MODEL_DB_NUMBER
)

@blueprint_basic_configs.route('/v1/<lang>/basic_config', methods=['GET'])
@language_wrapper
@session_helper
def basic_config_get(user, lang, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/basic_config'))

    host_id = str(user.id)  # adapt as appropriate

    try:
        basic_config = basic_config_db.get_one(host_id)
        interaction_models = interaction_model_db.get_many(host_id, limit=100)
        message = locale.get('basic_configs_get_success', lang)
        return OKAPISuccessFormat(
            message=message,
            data={
                'basic_config': basic_config.response_json(),
                'interaction_models': interaction_models
            }
        ).http_response()

    except BasicConfigNotFoundError:
        message = locale.get('basic_configs_get_fail', lang)
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except Exception as e:
        logger.error(red(f"Error retrieving BasicConfig: {e}"))
        message = locale.get('basic_configs_get_fail', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()


@blueprint_basic_configs.route('/v1/<lang>/basic_config/update', methods=['POST'])
@language_wrapper
@content_type_check_json
@session_helper
@required_fields_check([])  # no required fields, updates can be partial
def basic_config_update(user, lang, lang_name):
    logger.info(cyan(f'request: {request.url} => {request.json}'))

    host_id = str(user.id)  # adapt as appropriate

    updates = {}
    allowed_fields = ['languages', 'speaker_dict', 'interaction_model_id', 'response_mode', 'max_turns_default']
    for field in allowed_fields:
        if field in request.json:
            updates[field] = request.json[field]

    logger.info(magenta(f'[POST] /v1/{lang}/basic_config/update => \n'+'-'*100+f'\n{updates}'+'-'*100))

    if not updates:
        return BadRequestAPIErrorFormat(lang).http_response()

    try:
        updated_basic_config = basic_config_db.update(host_id, updates)
    except Exception as e:
        logger.error(red(f"Error updating BasicConfig: {e}"))
        message = locale.get('basic_configs_update_fail', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    return OKAPISuccessFormat(
        message=locale.get('basic_configs_update_success', lang),
        data=updated_basic_config.response_json()
    ).http_response()