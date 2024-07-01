import sys
print(f"Python Executable: {sys.executable} (be sure if web-server/venv/bin/python is used)")

from os.path import abspath, join
from urllib.parse import quote
import atexit
from flask import Flask, render_template, request, g, jsonify, url_for, redirect
from jinja2 import ChoiceLoader, FileSystemLoader

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'FIRST_MONTH_FREE_CALL',
    'UNIT_PRICE_USD',
    'DEFAULT_LANG',
    'MAIL_SUPPORT',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)
ENV = Config.ENV 
FIRST_MONTH_FREE_CALL = Config.FIRST_MONTH_FREE_CALL
UNIT_PRICE_USD = Config.UNIT_PRICE_USD
MAIL_SUPPORT = Config.MAIL_SUPPORT

# Locale
from libcommon.language import Language
from libcommon.locale import Locale, COMMON_LOCALES_FILE_PATHS

# Set logger
from libcommon.logger import Logger
logger = Logger('main.py')
logger.setLevel(logger.DEBUG)
from libcommon.color import *
from libcommon.validator import Validator, ValidationType

# Web API tools
from libcommon.web.validation_errors import RequiredFieldsNotSatisfiedFormat
from libcommon.web.http_errors import InvalidContentTypeAPIErrorFormat, \
    UnexpectedAPIErrorFormat, ForbiddenAPIErrorFormat, ResourceNotFoundAPIErrorFormat, \
    BadRequestAPIErrorFormat, UnauthorizedAPIErrorFormat, RateLimitExceededAPIErrorFormat
from libcommon.web.http_successes import OKAPISuccessFormat, CreatedAPISuccessFormat, \
    AcceptedAPISuccessFormat
from libcommon.web.flask_helpers import language_wrapper, content_type_check_json, \
    required_fields_check, validate_request, handle_error, session_helper

# Local files
COMMON_LOCALES_ROOT = join(abspath(__file__), 'libcommon/locales')
LOCALES_ROOT = Config.LOCALES_ROOT
TOP_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/top.json'
FOOTER_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/footer.json'
ERROR_PAGES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/error_pages.json'
SETTINGS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/settings.json'
MATERIALS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/materials.json'
MATERIALS_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/materials_responses.json'
locale = Locale([
    ERROR_PAGES_LOCALE_FILE_PATH,
    FOOTER_LOCALE_FILE_PATH,
    ] + COMMON_LOCALES_FILE_PATHS
)

# MongoDB
from init_mongodb import connect
from models.data.user import (
    User,
    UnauthorizedAccessError,
    UserNotFoundError
)

# Initialize flask app
from init_flask_app import app

# Register API blueprints
from accounts import blueprint_accounts
from materials import blueprint_materials
from payments import blueprint_payments
from sample_sites import blueprint_sample_sites  # NOTE: needs consideration to be in this app
for blueprint in [blueprint_accounts, blueprint_materials, blueprint_payments, blueprint_sample_sites]:
    app.register_blueprint(blueprint)

# Check initialization
from initialization import check_initialization
if ENV != 'local':
    if check_initialization():
        logger.info(light_green('Server ready.'))
    else:
        logger.error(red('Server could not start.'))

DEFAULT_LANG = Config.DEFAULT_LANG

# basic handlers
@app.route('/')
@app.route('/<lang>/')
@language_wrapper
def top_handler(lang, lang_name):
    logger.info(magenta(f'[GET] top'))
    locale.add_locale_file(TOP_LOCALE_FILE_PATH)
    locale.add_locale_file(SETTINGS_LOCALE_FILE_PATH)  # for demo
    return render_template(
        'index.html',
        lang=lang,
        lang_name=lang_name,
        free_call=FIRST_MONTH_FREE_CALL,
        unit_price=UNIT_PRICE_USD,
        locale_json=locale.to_json_string(),
        locale_dict=locale.dict())

# get started
@app.route('/<lang>/getstarted')
@language_wrapper
def getstarted_handler(lang, lang_name):
    return render_template('test/get_started.html', lang=lang, lang_name=lang_name)

# test
@app.route('/test')
def test_handler():
    return render_template('test/test.html')

# Terms
@app.route('/terms')
@app.route('/<lang>/terms')
@language_wrapper
def terms(lang, lang_name):
    template_file_name = f'terms/terms_{lang}.html'
    return render_template(
        template_file_name,
        locale_dict=locale.dict())

# Privacy Policy
@app.route('/privacy')
@app.route('/<lang>/privacy')
@language_wrapper
def privacy(lang, lang_name):
    template_file_name = f'privacy/privacy_{lang}.html'
    return render_template(
        template_file_name,
        mail_support=MAIL_SUPPORT,
        lang=lang,
        lang_name=lang_name,
        locale_dict=locale.dict())

# Commercial transactions info
@app.route('/transaction_info')
@app.route('/<lang>/transaction_info')
@language_wrapper
def transaction_info(lang, lang_name):
    template_file_name = f'others/commercial_transactions_info.html'
    return render_template(
        template_file_name,
        mail_support=MAIL_SUPPORT,
        lang=lang,
        lang_name=lang_name,
        locale_dict=locale.dict())


# User
@app.route('/v1/<lang>/user')
@language_wrapper
@session_helper
def user_get(user, lang, lang_name):
    # if not exist, UnauthorizedAccessError or UserNotFoundError is returned as follows.
    logger.debug(f'user: {user.response_json()}')
    return OKAPISuccessFormat(
        message=locale.get('user_found', lang),
        #data={'user': user.response_json(), 'locale': locale.json()}).http_response()
        data={'user': user.response_json()}).http_response()

# special handlers
@app.route('/healthcheck')
def healthcheck():
    return 'Health Check OK!!'

# Generic Errors
@app.errorhandler(UnauthorizedAccessError)
@language_wrapper
def handle_unauthorized_access(error, lang, lang_name):
    logger.error(red(f"No session. Lang: {lang}, Error: {str(error)}"))
    if request.path.endswith('/materials/list') or request.path.endswith('/user'):
        return UnauthorizedAPIErrorFormat(lang=lang, message=str(error)).http_response()
    else:
        original_url = quote(request.url)
        logger.info(f"redirect url is set to {original_url}")
        return redirect(url_for('accounts.signin', lang=lang, redirect=original_url))

@app.errorhandler(UserNotFoundError)
@language_wrapper
def handle_user_not_found(error, lang, lang_name):
    logger.error(red(f"User not found. Lang: {lang}, Error: {str(error)}"))

    if request.path.endswith('/materials/list') or request.path.endswith('/user'):
        return UnauthorizedAPIErrorFormat(lang=lang, message=str(error)).http_response()
    else:
        original_url = quote(request.url)
        logger.info(f"redirect url is set to {original_url}")
        return redirect(url_for('accounts.signin', lang=lang, redirect=original_url))

@app.errorhandler(400)
@language_wrapper
def bad_request(error, lang, lang_name):
    return handle_error(error, BadRequestAPIErrorFormat, lang)

@app.errorhandler(404)
@language_wrapper
def page_not_found(error, lang, lang_name):
    logger.error(red(f"404 Page Not Found: {request.url}"))
    return render_template(
        '/errors/404.html',
        message=locale.get("404", lang)), 404

@app.errorhandler(500)
@language_wrapper
def internal_server_error(error, lang, lang_name):
    return handle_error(error, UnexpectedAPIErrorFormat, lang)

@app.errorhandler(502)
@language_wrapper
def bad_gateway(error, lang, lang_name):
    return handle_error(error, RateLimitExceededAPIErrorFormat, lang)

# Register a function to run after the app closes
@atexit.register
def cleanup():
    print("Cleaning up resources...")
    #if connection_pool:
    #    connection_pool.close_all()

if __name__ == '__main__':
    app.run(
        debug=True,
    )