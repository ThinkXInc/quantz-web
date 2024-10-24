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
    'LOCALES_ROOT',
    'UNIT_PRICE_USD',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

UNIT_PRICE_USD = Config.UNIT_PRICE_USD
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER

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

# interview page
@blueprint_interviews.route('/v1/<lang>/interviews/<interview_id>', methods=['GET'])
@language_wrapper
def interview_window(lang, interview_id, lang_name):
    logger.info(magenta(f'[GET] /{lang}/interviews/{interview_id}'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')
    try:
        interview = Interview.get_one(interview_id)
        logger.info(f'interview found: {interview.response_json()}')
    except InterviewNotFoundError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('interview_not_found', lang)
        ).http_response()

    return render_template(
        'main/interview.html',
        lang=lang,
        lang_name=lang_name,
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

# New interview create
@blueprint_interviews.route('/v1/<lang>/interviews/create', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['title', 'introduction', 'steps'])
@session_helper
def interviews_create(user, lang, lang_name):
    
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    title = request.json.get('title')
    introduction = request.json.get('introduction')
    steps = request.json.get('steps')
    logger.info(magenta(f'[POST] interviews/create => \n'+'-'*100+f'\n{title}'+'-'*100))

    # Save results in the database using the create_new method
    try:
        interview = Interview.create_new(
            title=title, introduction=introduction, steps=steps, user=user)
        if not interview:
            raise InterviewSaveError("Failed to create interview")
        host_manager = HostManager(
            host=REDIS_ACCESS_HOST,
            port=REDIS_ACCESS_PORT,
            db_number=REDIS_ACCESS_DB_NUMBER)
        host_manager.set_id_in_service_with_host_id("interviews", str(interview.id), str(user.id))
    except HostSettingError as e:
        message = str(e)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except InterviewSaveError as e:
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

    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    # Gather updates from the request
    updates = {}
    for field in ['title', 'text', 'lang', 'keywords', 'question', 'review', 'answer']:
        if field in request.json:
            updates[field] = request.json[field]

    if not updates:
        return BadRequestAPIErrorFormat(lang).http_response()

    logger.info(magenta(f'[POST] interviews/{interview_id}/update => \n'+'-'*100+f'\n{updates}'+'-'*100))

    # Update interview 
    try:
        interview = Interview.update(
            user, interview_id, updates)
    except InterviewNotFoundError:
        return ResourceNotFoundError(
            lang=lang, message=locale.get('interview_not_found', lang)).http_response()
    except InterviewUpdateError:
        return UnexpectedAPIErrorFormat(
            lang=lang, message=locale.get('interview_update_error', lang)).http_response()

    return OKAPISuccessFormat(
        message=locale.get('interview_updated', lang, [interview_id]),
        data={'interview_id': interview_id, 'updates': updates}
    ).http_response()

