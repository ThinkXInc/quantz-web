from os.path import dirname, abspath, join
from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_materials = Blueprint('materials', __name__)

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
logger = Logger('materials')
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

from models.data.material import (
    Material,
    MaterialSaveError,
    MaterialNotFoundError,
    MaterialQueryError,
    MaterialUpdateError,
    MaterialDeleteError,
    NoUpdateFieldError
)

# VectorDB
from models.data.material_vectordb import (
    MaterialVectorDB,
    MaterialVectorDBSaveError,
    MaterialVectorDBUpdateError,
    MaterialVectorDBDeleteError,
)

# main page
@blueprint_materials.route('/v1/<lang>/home', methods=['GET'])
@session_helper
@language_wrapper
def home(user, lang, lang_name):
    logger.info(magenta(f'[GET] /{lang}/home'))

    # DEBUG
    #Session.start('6608eee0010a17bff9abcd0c')
    #Session.start('660fb470cdab5917fb9023e6')

    return render_template(
        'main/materials.html',
        lang=lang,
        lang_name=lang_name,
        locale_json=locale.to_json_string(),
        unit_price=UNIT_PRICE_USD,
        general_credit_per_response=GENERAL_CREDIT_PER_RESPONSE,
        interview_credit_per_response=INTERVIEW_CREDIT_PER_RESPONSE,
        header_create_button_title=locale.get('header_create_button_title', lang),
        header_meetings_menu_title=locale.get('header_meetings_menu_title', lang),
        header_interaction_menu_title=locale.get('header_interaction_menu_title', lang),
        header_knowledge_menu_title=locale.get('header_knowledge_menu_title', lang),
        header_settings_menu_title=locale.get('header_settings_menu_title', lang),
        header_customize_menu_title=locale.get('header_customize_menu_title', lang),
        header_interviews_menu_title=locale.get('header_interviews_menu_title', lang),
        header_logout_menu_title=locale.get('header_logout_menu_title', lang),
        metadata=locale.dict()["metadata_home"][lang])

# Material list
@blueprint_materials.route('/v1/<lang>/materials/list', methods=['GET'])
@language_wrapper
@session_helper
def materials_list(user, lang, lang_name):
    logger.info(magenta(f'[GET] /v1/{lang}/materials/list'))

    # List materials
    try:
        materials, count = Material.get_many(user, limit=100)
        logger.debug(f'fetched {count} materials => {materials}')
    except MaterialQueryError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('material_list_failed', lang)
        ).http_response()

    response_data = {
        'materials': [material.response_json() for material in materials],
        'count': count
    }
    logger.debug(f'response data: {response_data}')
    return OKAPISuccessFormat(
        message=locale.get('material_list_success', lang),
        data=response_data).http_response()

# Material single
@blueprint_materials.route('/v1/<lang>/materials/<material_id>', methods=['GET'])
@language_wrapper
@session_helper
def materials_single(user, lang, lang_name, material_id):
    logger.info(magenta(f'[GET] /v1/{lang}/materials/{material_id}')) 

    logger.debug(f'sigle material page requested by lang: {lang} [{lang_name}], material_id: {material_id}')
    # Get material
    try:
        material = Material.get_one(user, material_id)
        logger.info(f'material found: {material.response_json()}')
    except MaterialNotFoundError:
        return UnexpectedAPIErrorFormat(
            lang=lang,
            message=locale.get('material_single_failed', lang)
        ).http_response()
    
    return OKAPISuccessFormat(
        data={'material': material.response_json()},
        message=locale.get('material_single_success', lang),
        ).http_response()

# Material create
@blueprint_materials.route('/v1/<lang>/materials/create', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['text'])
@session_helper
def materials_create(user, lang, lang_name):
    
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    text = request.json.get('text')
    logger.info(magenta(f'[POST] materials/create => \n'+'-'*100+f'\n{text}'+'-'*100))

    # Save results in the database using the create_new method
    try:
        material = Material.create_new(text=text, user=user)
        if not material:
            raise MaterialSaveError("Failed to create material")
    except MaterialSaveError:
        message = locale.get('material_save_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    
    # Register VectorDB Celery task using the MaterialVectorDB class
    try:
        MaterialVectorDB.save(material, user)
    except MaterialVectorDBSaveError as ve:
        message = locale.get('material_vectordb_save_error', lang)
        logger.error(red(message))
        material = Material.delete_one(material.id)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

   # Return Response
    return AcceptedAPISuccessFormat(
        message=locale.get('material_created', lang, [str(material.id)]),
        data=material.response_json()).http_response()

# Material update
@blueprint_materials.route('/v1/<lang>/materials/<material_id>/update', methods=['POST'])
@language_wrapper
@content_type_check_json
@session_helper
@required_fields_check([])
def materials_update(user, lang, lang_name, material_id):

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

    logger.info(magenta(f'[POST] materials/{material_id}/update => \n'+'-'*100+f'\n{updates}'+'-'*100))

    # Update material
    try:
        material = Material.update(
            user, material_id, updates)
    except MaterialNotFoundError:
        return ResourceNotFoundError(
            lang=lang, message=locale.get('material_not_found', lang)).http_response()
    except MaterialUpdateError:
        return UnexpectedAPIErrorFormat(
            lang=lang, message=locale.get('material_update_error', lang)).http_response()

    # Register VectorDB Celery task using the MaterialVectorDB class
    try:
        MaterialVectorDB.update(material, user)
    except MaterialVectorDBUpdateError as ve:
        message = locale.get('material_vectordb_update_error', lang)
        logger.error(f"{red(message)}: {ve}")
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    return OKAPISuccessFormat(
        message=locale.get('material_updated', lang, [material_id]),
        data={'material_id': material_id, 'updates': updates}
    ).http_response()

# Material delete
@blueprint_materials.route('/v1/<lang>/materials/<material_id>/delete', methods=['POST'])
@language_wrapper
@content_type_check_json
@session_helper
def materials_delete(user, lang, lang_name, material_id):

    logger.info(cyan(f'request: {request.url} => {request.json}'))

    # Validate request
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    logger.info(magenta(f'[POST] materials/{material_id}/delete'))

    # Delete material in MongoDB
    try:
        material = Material.delete_one(material_id)
        if not material:
            message = locale.get('material_not_found', lang, [material_id])
            return ResourceNotFoundError(lang=lang, message=message).http_response()
        else:
            logger.info(cyan(f'material {material_id} deleted from mongodb'))
    except MaterialDeleteError as e:
        message = locale.get('material_delete_failed', lang, [material_id])
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Delete material in VectorDB
    try:
        MaterialVectorDB.delete(material, user)
    except MaterialVectorDBDeleteError as ve:
        message = locale.get('material_vectordb_delete_failed', lang, [material_id])
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    return OKAPISuccessFormat(
        message=locale.get('material_delete_success', lang),
        data={}
    ).http_response()