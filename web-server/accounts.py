from flask import Flask, render_template, request, g, jsonify, Blueprint, url_for, redirect
from flask_httpauth import HTTPBasicAuth
from celery.exceptions import CeleryError

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    'HOST_URL',
    'LOCALES_ROOT',
    'FIRST_MONTH_FREE_CALL',
    'UNIT_PRICE_USD',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

ENV = Config.ENV
HOST_URL = Config.HOST_URL
FIRST_MONTH_FREE_CALL = Config.FIRST_MONTH_FREE_CALL
UNIT_PRICE_USD = Config.UNIT_PRICE_USD
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Language
from libcommon.language import Language

# Cipher
from libcommon.cipher import Cipher

# Web API Tools
from libcommon.web.session import Session
from libcommon.web.http_response_formatter import ValidationErrorsFormat
from libcommon.web.http_successes import OKAPISuccessFormat, CreatedAPISuccessFormat, \
    AcceptedAPISuccessFormat
from libcommon.web.http_errors import InvalidContentTypeAPIErrorFormat, \
    UnexpectedAPIErrorFormat, ForbiddenAPIErrorFormat, ResourceNotFoundAPIErrorFormat, \
    BadRequestAPIErrorFormat, UnauthorizedAPIErrorFormat, RateLimitExceededAPIErrorFormat, \
    UserAlreadyExistsErrorFormat, IncorrectPasswordAPIErrorFormat
from libcommon.web.flask_helpers import language_wrapper, content_type_check_json, \
    required_fields_check, required_query_params, validate_request, \
    format_check, length_check, regex_check, \
    handle_error, session_helper, google_oauth_token_check, requires_auth
from libcommon.web.regex_patterns import EMAIL_REGEX, PASSWORD_AT_LEAST_ONE_UPPER_AND_NUMERIC_REGEX

# Locale
from libcommon.locale import Locale, COMMON_LOCALES_FILE_PATHS
LOCALES_ROOT = Config.LOCALES_ROOT
ACCOUNTS_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/accounts_responses.json'
ACCOUNTS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/accounts.json'
EMAILS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/emails.json'
locale = Locale([
    EMAILS_LOCALE_FILE_PATH,
    ACCOUNTS_RESPONSES_LOCALE_FILE_PATH,
    ACCOUNTS_LOCALE_FILE_PATH,
    ] + COMMON_LOCALES_FILE_PATHS
)

# User
from models.data.user import (
    User,
    UserSaveError,
    UserAlreadyExistsError,
    UserNotFoundError,
    UserUpdateError,
    UserQueryError,
    InvalidFQDNError,
    OriginIsNeitherSameAsEmailNorIncludingUrlError,
    InvalidPasswordResetCodeError,
    PasswordResetCodeExpiredError,
    VerificationCodeExpiredError,
    VerificationCodeMismatchError,
    ValidationError
)

# Material
from models.data.material_vectordb import (
    MaterialVectorDB,
    MaterialVectorDBCreateCollectionError
)

# Email
from mails.send_mail import (
    send_welcome_email,
    send_verification_email,
    send_password_reset_email,
    MailSendError
)

# AccessDB
from accessdb.host_manager import HostManager, HostSettingError

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_accounts = Blueprint('accounts', __name__)

ENABLE_INITIALIZE_ALL_USERS = (ENV == 'develop' and True)

@blueprint_accounts.route('/v1/signup', methods=['GET'])
@blueprint_accounts.route('/v1/<lang>/signup', methods=['GET'])
@language_wrapper
def signup(lang, lang_name):
    logger.info(magenta(f'[GET] signup'))
    return render_template(
        'main/signup.html',
        lang=lang,
        lang_name=lang_name,
        free_call=FIRST_MONTH_FREE_CALL,
        unit_price=UNIT_PRICE_USD,
        locale_json=locale.to_json_string())

@blueprint_accounts.route('/v1/signin', methods=['GET'])
@blueprint_accounts.route('/v1/<lang>/signin', methods=['GET'])
@language_wrapper
def signin(lang, lang_name):
    logger.info(magenta(f'[GET] signin'))
    redirect_url = f"{HOST_URL}{request.args.get('redirect', url_for('materials.home', lang=lang))}"
    return render_template(
        'main/signin.html',
        lang=lang,
        lang_name=lang_name,
        locale_json=locale.to_json_string(),
        redirect_url=redirect_url)

@blueprint_accounts.route('/v1/logout', methods=['GET'])
@blueprint_accounts.route('/v1/<lang>/logout', methods=['GET'])
@language_wrapper
def logout(lang, lang_name):
    Session.clear()
    return redirect(url_for('materials.home', lang=lang))

@blueprint_accounts.route('/v1/terms', methods=['GET'])
@blueprint_accounts.route('/v1/<lang>/terms', methods=['GET'])
@language_wrapper
def terms(lang, lang_name):
    logger.info(magenta(f'[GET] terms ({lang})'))
    return render_template(
        f'terms/terms_{lang}.html',
        lang=lang,
        lang_name=lang_name,
        locale_json=locale.to_json_string())

@blueprint_accounts.route('/users/flush', methods=['GET'])
@requires_auth
def users_flush():
    if not ENABLE_INITIALIZE_ALL_USERS:
        logger.info(yellow('User flush attempt blocked because feature is disabled.'))
        return jsonify({'error': 'Flushing users is disabled'}), 403  # Or another appropriate status code

    try:
        if ENABLE_INITIALIZE_ALL_USERS:
            from manage_mongodb import delete_all_users
            delete_all_users()
            logger.info(magenta('[IMPORTANT] all user flushed'))
            return AcceptedAPISuccessFormat(message="user flushed", data={}).http_response()
    except Exception as e:
        logger.info(red('failed to flush {e}'))
        return UnexpectedAPIErrorFormat(lang="en", message=f"{e}").http_response()


# User create
@blueprint_accounts.route('/v1/users/create', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/create', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['email', 'password'])
@regex_check('email', EMAIL_REGEX, 'email_format')
@regex_check('password', PASSWORD_AT_LEAST_ONE_UPPER_AND_NUMERIC_REGEX, 'invalid_password_format')
def users_create(lang, lang_name):
    # DEBUG
    if ENABLE_INITIALIZE_ALL_USERS:
        from manage_mongodb import delete_all_users
        delete_all_users()
    # DEBUG

    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json["email"]}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    email = request.json.get('email')
    password = request.json.get('password')

    logger.info(magenta(f'[POST] users/create => \n'+'-'*100+f'\nemal: {email} password: **** '+'-'*100))

    # Save results in the database using the create_new method
    try:
        start_billing, next_billing = User.get_billing_dates()
        user = User.create_new(
            suspended_email=email, password=password,
            free_call=FIRST_MONTH_FREE_CALL,
            lang=lang,
            start_billing=start_billing, next_billing=next_billing)
        if not user:
            return UserSaveError("Failed to create user").http_response()
        task_id = user.schedule_payment(lang)
        if not task_id:
            return UnexpectedAPIErrorFormat(lang=lang, message="task schedule faild").http_response()
        MaterialVectorDB.create_collection(user)
    except UserAlreadyExistsError:
        return UserAlreadyExistsErrorFormat(lang=lang).http_response()
    except (UserSaveError, MaterialVectorDBCreateCollectionError):
        message = locale.get('user_save_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Send verification mail
    try:
        verification_code = user.update_verification_code()
        send_welcome_email(
            lang, user, verification_code
        )
    except UserUpdateError as ue:
        message = locale.get('verification_code_generate_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except MailSendError as e:
        message = locale.get('mail_send_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Return Response
    Session.start(str(user.id))
    return AcceptedAPISuccessFormat(
        message=locale.get('verification_code_send_success', lang),
        data=user.response_json()).http_response()

# User create (Google OAuth)
@blueprint_accounts.route('/v1/users/create/googleoauth', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/create/googleoauth', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['token'])
@google_oauth_token_check(field_name='token')
def users_create_googleoauth(email, google_id, lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    logger.info(magenta(f'[POST] users/create/googleoauth => \n'+'-'*100+f'\n{email}\n{google_id}'+'-'*100))

    # DEBUG
    if ENABLE_INITIALIZE_ALL_USERS:
        from manage_mongodb import delete_all_users
        delete_all_users()
    # DEBUG

    # Save results in the database using the create_new method
    try:
        start_billing, next_billing = User.get_billing_dates()
        user = User.create_new_google_oauth(
            email=email, google_id=google_id,
            free_call=FIRST_MONTH_FREE_CALL,
            lang=lang,
            start_billing=start_billing, next_billing=next_billing)
        if not user:
            return UserSaveError("Failed to create user").http_response()
        task_id = user.schedule_payment(lang)
        if not task_id:
            return UnexpectedAPIErrorFormat(lang=lang, message="task schedule faild").http_response()
        MaterialVectorDB.create_collection(user)
    except UserAlreadyExistsError:
        return UserAlreadyExistsErrorFormat(lang=lang).http_response()
    except CeleryError as e:
        logger.error(red({str(e)}))
        message = locale.get('user_save_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except (UserSaveError, MaterialVectorDBCreateCollectionError):
        message = locale.get('user_save_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Send verification mail
    try:
        verification_code = user.update_verification_code()
        send_welcome_email(
            lang, user, verification_code
        )
    except UserUpdateError as ue:
        message = locale.get('verification_code_generate_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except MailSendError as e:
        message = locale.get('mail_send_error', lang)
        logger.error(red({message}))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Return Response
    Session.start(str(user.id))
    return AcceptedAPISuccessFormat(
        message=locale.get('verification_code_send_success', lang),
        data=user.response_json()).http_response()

# Verify code
@blueprint_accounts.route('/v1/users/verify_code', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/verify_code', methods=['POST'])
@language_wrapper
@session_helper
@content_type_check_json
@required_fields_check(['code'])
def users_verify_code(user, lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    submitted_code = request.json.get('code')
    logger.info(magenta(f'[POST] users/verify_code => \n'+'-'*100+f'\n{submitted_code}'+'-'*100))

    try:
        if ENV == "develop":
            # Skip verification if in development environment
            message = locale.get('code_verification_success', lang)  # Assuming you have such a localization key
            user = user.email_to_verified()  # Assuming this updates the user's verification status
            return OKAPISuccessFormat(message=message, data=user.response_json()).http_response()

        if user.check_verification_code(submitted_code):
            user.email_to_verified()  # Update email verification status if the code is correct
            message = locale.get('code_verification_success', lang)  # Assuming you have such a localization key
            return OKAPISuccessFormat(message=message, data=user.response_json()).http_response()
    except UserAlreadyExistsError as e:
        return UserAlreadyExistsErrorFormat(lang=lang).http_response()
    except VerificationCodeExpiredError as ve:
        logger.error(red(f"Verification code expired: {ve}"))
        message = locale.get('code_verification_expired', lang)
        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()
    except VerificationCodeMismatchError as vm:
        logger.error(red(f"Verification code mismatch: {vm}"))
        message = locale.get('code_verification_mismatch', lang)
        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()
    except Exception as e:
        logger.error(red(f"Unexpected error during code verification: {e}"))
        message = locale.get('code_verification_failed', lang)  # Define this localization key
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # If no exceptions were raised but verification failed
    message = locale.get('code_verification_failed', lang)
    return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()

# Verification mail resend
@blueprint_accounts.route('/v1/users/verification/resend', methods=['GET'])
@blueprint_accounts.route('/v1/<lang>/users/verification/resend', methods=['GET'])
@language_wrapper
@session_helper
@content_type_check_json
def users_verification_resend(user, lang, lang_name):
    logger.info(magenta(magenta(f'[GET] users/verification/resend')))

    # Send verification mail
    try:
        verification_code = user.update_verification_code()
        send_verification_email(
            lang, user, verification_code
        )
    except UserUpdateError as ue:
        message = locale.get('verification_code_update_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except MailSendError as e:
        message = locale.get('mail_send_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Return Response
    return AcceptedAPISuccessFormat(
        message=locale.get('verification_mail_send_success', lang),
        data=user.response_json()).http_response()
# Signin
@blueprint_accounts.route('/v1/users/signin', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/signin', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['email', 'password'])
def users_signin(lang, lang_name):
    # Validate request
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    email = request.json.get('email')
    password = request.json.get('password')

    logger.info(cyan(f'request: {request.url} => email:{email} password: ***** '))

    # Find user
    try:
        user = User.find_user_by_email(email)
    except UserNotFoundError:
        message = locale.get('user_not_found_with_email', lang, [email])
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except UserQueryError:
        message = locale.get('user_find_single_failed', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Check password
    try:
        if not Cipher.compare(password, user.password):
            logger.info(red(f"Password doesn't match."))
            return IncorrectPasswordAPIErrorFormat(lang=lang).http_response()
    except Exception as e:
        logger.error(red(f"Error during password comparison: {str(e)}"))
        return UnexpectedAPIErrorFormat(lang=lang, message="An error occurred during processing.").http_response()

    # Return Response
    Session.start(str(user.id))
    return OKAPISuccessFormat(
        message=locale.get('signin_success', lang),
        data=user.response_json()).http_response()

# User signin (Google OAuth)
@blueprint_accounts.route('/v1/users/signin/googleoauth', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/signin/googleoauth', methods=['POST'])
@language_wrapper
@content_type_check_json
@required_fields_check(['token'])
@google_oauth_token_check(field_name='token')
def users_signin_googleoauth(email, google_id, lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    logger.info(magenta(f'[POST] users/signin/googleoauth => \n'+'-'*100+f'\n{email}\n{google_id}'+'-'*100))

    # Find user
    try:
        user = User.find_user_by_email(email)
    except UserNotFoundError:
        message = locale.get('user_not_found_with_email', lang, [email])
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except UserQueryError:
        message = locale.get('user_find_single_failed', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Return Response
    Session.start(str(user.id))
    return OKAPISuccessFormat(
        message=locale.get('signin_success', lang),
        data=user.response_json()).http_response()


# Verify link clicked
@blueprint_accounts.route('/v1/users/verify_link', methods=['GET'])
@blueprint_accounts.route('/v1/<lang>/users/verify_link', methods=['GET'])
@language_wrapper
@required_query_params(['user_id', 'code'])
def users_verify_link(lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.args}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    user_id = request.args.get('user_id')
    code = request.args.get('code')

    logger.info(magenta(f'[POST] users/verify_link => \n'+'-'*100+f'\n{user_id}\n{code}'+'-'*100))

    try:
        # Fetch the user from the database
        user = User.find_user_by_id(user_id)
    except UserNotFoundError:
        message = locale.get('user_not_found', lang)
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except UserQueryError:
        message = locale.get('user_find_single_failed', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Check if the provided code matches the stored verification code
    if user.verification_code == code:
        try:
            user.email_to_verified()  # Update email verification status
            message = locale.get('code_verification_success', lang)  # Assuming you have such a localization key
            return OKAPISuccessFormat(message=message, data=user.response_json()).http_response()
        except UserUpdateError as ue:
            message = locale.get('code_verification_failed', lang)  # Define this localization key
            return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    else:
        message = locale.get('code_verification_failed', lang)
        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()

# Email update
@blueprint_accounts.route('/v1/users/email/update', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/email/update', methods=['POST'])
@language_wrapper
@session_helper
@content_type_check_json
@required_fields_check(['email'])
@regex_check('email', EMAIL_REGEX, 'email_format')
def users_email_update(user, lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    new_email = request.json.get('email')
    logger.info(magenta(f'[POST] users/email/update => \n'+'-'*100+f'\n{new_email}'+'-'*100))

    if User.objects(email=new_email).first():
        return UserAlreadyExistsErrorFormat(lang=lang).http_response()

    try:
        user = User.update_user(user.id, suspended_email=new_email)
    except UserUpdateError as e:
        message = str(e)
        logger.error(red(message))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Send verification mail
    try:
        verification_code = user.update_verification_code()
        send_verification_email(
            lang, user, verification_code
        )
    except UserUpdateError as ue:
        message = locale.get('verification_code_update_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except MailSendError as e:
        message = locale.get('mail_send_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except Exception as e:
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()

    # Return Response
    return AcceptedAPISuccessFormat(
        message=locale.get('verification_mail_send_success', lang),
        data=user.response_json()).http_response()

# Update origin
@blueprint_accounts.route('/v1/users/update/origin', methods=['POST'])
@blueprint_accounts.route('/v1/users/create/origin', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/update/origin', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/create/origin', methods=['POST'])
@language_wrapper
@session_helper
@content_type_check_json
@required_fields_check(['origin'])
def users_update_origin(user, lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    new_origin = request.json.get('origin')

    logger.info(magenta(f'[POST] {request.path} => \n'+'-'*100+f'\n{new_origin}'+'-'*100))

    # Check origin
    try:
        user.check_origin(new_origin)
    except InvalidFQDNError as e:
        message = locale.get('invalid_fqdn', lang)
        logger.error(red(message))
        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()
    except OriginIsNeitherSameAsEmailNorIncludingUrlError as oe:
        message = locale.get('origin_is_neither_same_as_email_nor_including_url', lang)
        logger.error(red(message))
        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()

    # Update user
    try:
        User.update_origin(user.id, new_origin)
        return OKAPISuccessFormat(
            message=locale.get('origin_update_success', lang),
            data=user.response_json()).http_response()
    except UserNotFoundError:
        message = locale.get('user_not_found', lang)
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except UserUpdateError as e:
        logger.error(red(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()
    except HostSettingError as he:
        logger.error(red(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()
    except Exception as e:
        logger.error(red(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()


# Update usage limit
@blueprint_accounts.route('/v1/users/update/usage_limit', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/update/usage_limit', methods=['POST'])
@language_wrapper
@session_helper
@content_type_check_json
@required_fields_check(['usage_limit'])
def users_update_limit(user, lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    new_limit = int(request.json.get('usage_limit'))
    logger.info(magenta(f'[POST] users/update/usage_limit => \n'+'-'*100+f'\n{new_limit}'+'-'*100))

    try:
        User.update_user(user.id, usage_limit=new_limit)
        host_manager = HostManager(
            host=REDIS_ACCESS_HOST,
            port=REDIS_ACCESS_PORT,
            db_number=REDIS_ACCESS_DB_NUMBER)
        host_manager.set_host(
            user.origin, str(user.id), new_limit, user.start_billing, user.next_billing)
        return OKAPISuccessFormat(
            message=locale.get('usage_limit_update_success', lang),
            data=user.response_json()).http_response()
    except UserUpdateError as e:
        logger.error(red(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()
    except HostSettingError as he:
        logger.error(red(e))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()

# Update customize
@blueprint_accounts.route('/v1/users/update/customize', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/update/customize', methods=['POST'])
@language_wrapper
@session_helper
@content_type_check_json
@format_check('button_type', str)
@format_check('button_width', int)
@format_check('button_height', int)
@format_check('font_color', str)
@format_check('font_size', float)
@format_check('blloon_width', int)
@format_check('blloon_height', int)
def users_update_customize(user, lang, lang_name):
    # Log the incoming request
    logger.info(cyan(f'request: {request.url} => {request.json}'))

    # Validate request
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    # Fetch updates from the request JSON
    updates = request.json
    logger.info(magenta(f'[POST] users/update/customize => \n' + '-'*100 + f'\n{updates}' + '-'*100))

    try:
        # Update the customization settings of the user
        if not hasattr(user, 'customize'):
            user.customize = Customize()  # Ensure there is a Customize instance

        for key, value in updates.items():
            if hasattr(user.customize, key):
                setattr(user.customize, key, value)
            else:
                logger.warning(yellow(f"Invalid customization field: {key}"))

        user.save()  # Save the user with the updated customization settings
        return OKAPISuccessFormat(
            message=locale.get('customization_update_success', lang),
            data=user.response_json()).http_response()

    except ValidationError as ve:
        logger.error(red(f"Validation Error: {ve}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(ve)).http_response()

    except UserSaveError as e:
        logger.error(red(f"Error updating user customization: {e}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()

# Send password reset url
@blueprint_accounts.route('/v1/users/possword_reset/send', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/password_reset/send', methods=['POST'])
@language_wrapper
@required_fields_check(['email'])
@content_type_check_json
def users_password_reset_send(lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url} => {request.json}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    email = request.json.get('email')
    logger.info(magenta(f'[POST] users/password_reset/send => \n'+'-'*100+f'\n{email}'+'-'*100))

    # Send verification mail
    try:
        user = User.find_user_by_email(email)
        reset_code, reset_expiration = user.update_password_reset_code()
        send_password_reset_email(
            lang, user, reset_code, reset_expiration
        )
    except UserNotFoundError:
        message = locale.get('user_not_found_with_email', lang, [email])
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except UserUpdateError as ue:
        message = locale.get('password_reset_code_update_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except MailSendError as e:
        message = locale.get('mail_send_error', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
    except UserQueryError:
        message = locale.get('user_find_single_failed', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Return Response
    return AcceptedAPISuccessFormat(
        message=locale.get('password_reset_mail_send_success', lang),
        data=user.response_json()).http_response()

## Password reset view
#@blueprint_accounts.route('/v1/<lang>/users/password_reset/view', methods=['GET'])
#@language_wrapper
#@required_query_params(['email', 'code'])
#@content_type_check_json
#def users_password_reset_view(lang, lang_name):
#   # Validate request
#    logger.info(cyan(f'request: {request.url} => {request.args}'))
#    validation_error = validate_request(lang, locale)
#    if validation_error:
#        return validation_error.http_response()
#
#    email = request.args.get('email')
#    code = request.args.get('code')
#
#    logger.info(magenta(f'[POST] users/password_reset/view => \n'+'-'*100+f'\n{email}\n{code}'+'-'*100)
#
#    try:
#        user = User.find_user_by_email(email)
#        if user.check_password_reset_code(code):
#            Session.start(user.id)
#            return render_template('password_reset_form.html', user=user)
#    except UserNotFoundError:
#        message = locale.get('user_not_found_with_email', lang, [email])
#        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
#    except InvalidPasswordResetCodeError:
#        message = locale.get('invalid_password_reset_code', lang)
#        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()
#    except PasswordResetCodeExpiredError:
#        message = locale.get('password_reset_code_expired', lang)
#        return BadRequestAPIErrorFormat(lang=lang, message=message).http_response()

# Password reset
@blueprint_accounts.route('/v1/users/possword_reset/reset', methods=['POST'])
@blueprint_accounts.route('/v1/<lang>/users/password_reset/reset', methods=['POST'])
@language_wrapper
@required_fields_check(['email', 'password', 'password_confirm', 'reset_code'])
@regex_check('password', PASSWORD_AT_LEAST_ONE_UPPER_AND_NUMERIC_REGEX, 'invalid_password_format')
@content_type_check_json
def users_password_reset_confirm(lang, lang_name):
    # Validate request
    logger.info(cyan(f'request: {request.url}'))
    validation_error = validate_request(lang, locale)
    if validation_error:
        return validation_error.http_response()

    email = request.json.get('email')
    password = request.json.get('password')
    password_confirm = request.json.get('password_confirm')
    reset_code = request.json.get('reset_code')

    logger.info(magenta(f'[POST] users/password_reset/reset => email:{email}, password: *****, password_confirm: *****, reset_code: {reset_code}'))

    # Ensure new password matches the confirmation
    if password != password_confirm:
        return BadRequestAPIErrorFormat(
            lang=lang, field_name='password_confirm', message=locale.get('password_mismatch', lang)).http_response()

    # Find user by email
    try:
        user = User.find_user_by_email(email)
    except UserNotFoundError:
        message = locale.get('user_not_found_with_email', lang, [email])
        return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
    except UserQueryError:
        message = locale.get('user_find_single_failed', lang)
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()

    # Ensure reset code matches
    if user.password_reset_code != reset_code:
        return BadRequestAPIErrorFormat(
            lang=lang, message=locale.get('reset_code_mismatch', lang)).http_response()

    # Ensure reset code has not expired
    if user.is_password_reset_code_expired():
        return BadRequestAPIErrorFormat(
            lang=lang, message=locale.get('reset_code_expired', lang)).http_response()

    # Update the user's password if all checks pass
    try:
        user.update_password(password)
        logger.info(green(f'Password updated successfully for user {user.id}'))
        return OKAPISuccessFormat(
            message=locale.get('password_reset_success', lang),
            data=user.response_json()).http_response()
    except UserUpdateError as ue:
        logger.error(red(f"Failed to update password: {ue}"))
        return UnexpectedAPIErrorFormat(lang=lang, message=str(ue)).http_response()