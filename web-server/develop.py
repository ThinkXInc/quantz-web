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
blueprint_develop = Blueprint('develop', __name__)

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
logger = Logger('develop')
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
    required_fields_check, validate_request, handle_error
from app_session import session_helper  # Q-4: 依存注入版


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
# develop page
@blueprint_develop.route('/build-type-c', methods=['GET'])
def develop_type_c_view():
    logger.info(magenta(f'[GET] /build-type-c'))
    return render_template(
        'develop/build-type-c.html',
    )

