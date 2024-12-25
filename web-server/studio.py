from os.path import dirname, abspath, join
from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_studio = Blueprint('studio', __name__)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'LOCALES_ROOT',
    'UNIT_PRICE_USD'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

UNIT_PRICE_USD = Config.UNIT_PRICE_USD
GENERAL_CREDIT_PER_RESPONSE = Config.GENERAL_CREDIT_PER_RESPONSE
INTERVIEW_CREDIT_PER_RESPONSE = Config.INTERVIEW_CREDIT_PER_RESPONSE

# Set logger
from libcommon.logger import Logger
logger = Logger('studio')
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
BASIC_CONFIGS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/basic_configs.json'
METADATA_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/metadata.json'
SETTINGS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/settings.json'
HEADER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/header.json'
MATERIALS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/materials.json'
MATERIALS_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/materials_responses.json'
BASIC_CONFIGS_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/basic_configs_responses.json'
locale = Locale([
    METADATA_LOCALE_FILE_PATH,
    SETTINGS_LOCALE_FILE_PATH,
    MATERIALS_LOCALE_FILE_PATH,
    HEADER_LOCALE_FILE_PATH,
    BASIC_CONFIGS_LOCALE_FILE_PATH,
    BASIC_CONFIGS_RESPONSES_LOCALE_FILE_PATH,
    MATERIALS_RESPONSES_LOCALE_FILE_PATH] + COMMON_LOCALES_FILE_PATHS
)

# MongoDB
from init_mongodb import connect
from models.data.user import (
    User,
    UnauthorizedAccessError,
    UserNotFoundError
)

#from models.data.material import (
#    Material,
#    MaterialSaveError,
#    MaterialNotFoundError,
#    MaterialQueryError,
#    MaterialUpdateError,
#    MaterialDeleteError,
#    NoUpdateFieldError
#)
#
## VectorDB
#from models.data.material_vectordb import (
#    MaterialVectorDB,
#    MaterialVectorDBSaveError,
#    MaterialVectorDBUpdateError,
#    MaterialVectorDBDeleteError,
#)

# main page
@blueprint_studio.route('/v1/<lang>/studio', methods=['GET'])
@session_helper
@language_wrapper
def studio_home(user, lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/studio'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')

    return render_template(
        'main/studio.html',
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



# main page
@blueprint_studio.route('/v1/<lang>/create', methods=['GET'])
@session_helper
@language_wrapper
def studio_create(user, lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/create'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')

    return render_template(
        'main/studio.html',
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


