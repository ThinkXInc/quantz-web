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
blueprint_deploy = Blueprint('deploy', __name__)

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
logger = Logger('deploy')
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

LOCALES_ROOT = Config.LOCALES_ROOT
BASIC_CONFIGS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/basic_configs.json'
METADATA_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/metadata.json'
CUSTOMIZE_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/customize.json'
CORPORATE_FOOTER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/corporate_footer.json'
HEADER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/header.json'
locale = Locale(
    [METADATA_LOCALE_FILE_PATH,
    HEADER_LOCALE_FILE_PATH,
    BASIC_CONFIGS_LOCALE_FILE_PATH,
    CUSTOMIZE_LOCALE_FILE_PATH] + COMMON_LOCALES_FILE_PATHS
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
# deploy page
@blueprint_deploy.route('/<lang>/deploy', methods=['GET'])
@session_helper
@language_wrapper
def deploy_view(user, lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/deploy'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')

    return render_template(
        'main/deploy.html',
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

