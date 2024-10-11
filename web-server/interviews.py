from os.path import dirname, abspath, join
from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_interviews = Blueprint('interviews', __name__)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'LOCALES_ROOT',
    'UNIT_PRICE_USD'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

UNIT_PRICE_USD = Config.UNIT_PRICE_USD

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
    UserNotFoundError
)

from models.data.interview import (
    Interview,
    InterviewStep,
    InterviewSaveError,
    InterviewNotFoundError,
    InterviewQueryError,
    InterviewUpdateError,
    InterviewDeleteError,
    NoUpdateFieldError
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

# Interview list
@blueprint_interviews.route('/v1/<lang>/interviews/list', methods=['GET'])
@language_wrapper
@session_helper
def interviews_list(user, lang, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/interviews/list'))

    # List interviews
    try:
        interviews, count = Interview.get_many(user, limit=100)
        logger.debug(f'fetched {count} interviews => {interviews}')
    except InterviewQueryError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interviews_list_failed', lang)
        ).http_response()

    response_data = {
        'interviews': [interview.response_json() for interview in interviews],
        'count': count
    }
    logger.debug(f'response data: {response_data}')
    return OKAPISuccessFormat(
        message=locale.get('interviews_list_success', lang),
        data=response_data).http_response()

