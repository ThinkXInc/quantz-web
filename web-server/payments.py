from flask import Flask, render_template, request, g, jsonify, Blueprint
from flask_httpauth import HTTPBasicAuth
import stripe
import json
import pytz
from datetime import datetime, timezone

# Web API Tools
from libcommon.web.session import Session
from libcommon.web.http_response_formatter import ValidationErrorsFormat
from libcommon.web.http_successes import OKAPISuccessFormat, CreatedAPISuccessFormat, \
    AcceptedAPISuccessFormat
from libcommon.web.http_errors import InvalidContentTypeAPIErrorFormat, \
    UnexpectedAPIErrorFormat, ForbiddenAPIErrorFormat, ResourceNotFoundAPIErrorFormat, \
    BadRequestAPIErrorFormat, UnauthorizedAPIErrorFormat, RateLimitExceededAPIErrorFormat, \
    UserAlreadyExistsErrorFormat
from libcommon.web.flask_helpers import language_wrapper, content_type_check_json, \
    required_fields_check, required_query_params, validate_request, \
    format_check, length_check, regex_check, \
    handle_error, session_helper, google_oauth_token_check

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Language
from libcommon.language import Language

# User
from models.data.user import (
    User,
    UserUpdateError,
    UserNotFoundError,
    UserQueryError,
    PaymentStatus
)

# Email
from mails.send_mail import (
    MailSendError
)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'DEFAULT_LANG',
    'STRIPE_SECRET_KEY'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

DEFAULT_LANG = Config.DEFAULT_LANG

# Stripe
stripe.api_key = Config.STRIPE_SECRET_KEY

# Locale
from libcommon.locale import Locale, COMMON_LOCALES_FILE_PATHS
LOCALES_ROOT = Config.LOCALES_ROOT
PAYMENTS_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/payments_responses.json'
locale = Locale([
    PAYMENTS_RESPONSES_LOCALE_FILE_PATH,
    ] + COMMON_LOCALES_FILE_PATHS
)

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_payments = Blueprint('payments', __name__)

def calculate_order_amount(items):
    # Replace this constant with a calculation of the order's amount
    # Calculate the order total on the server to prevent
    # people from directly manipulating the amount on the client
    return 1400

@blueprint_payments.route('/v1/payments/setup', methods=['POST'])
@session_helper
@content_type_check_json
def payments_setup(user):
    logger.info(magenta(f'[POST] payements/setup'))

    try:
        if not user.stripe_customer_id:
            logger.debug(f"Attempting to create Stripe customer for user email: {user.email}")
            customer = stripe.Customer.create(
                email=user.email,
                metadata={'user_id': str(user.id)}
            )
            logger.info(green(f'Customer created with ID: {customer.id} for user {user.id}'))
            user.update_stripe_customer_id(customer.id)
        else:
            customer = stripe.Customer.retrieve(user.stripe_customer_id)
            logger.info(f'Retrieved existing customer with ID: {customer.id} for user {user.id}')

        if customer:
            setup_intent = stripe.SetupIntent.create(
                usage='off_session',
                customer=customer.id,
                metadata={'user_id': str(user.id)}
            )
            logger.debug(f'Setup Intent created with Client Secret: {setup_intent.client_secret}')
            return OKAPISuccessFormat(
                message="Intent setup successfully.",
                data={'clientSecret': setup_intent.client_secret}
            ).http_response()
        else:
            raise ValueError("Failed to create or retrieve Stripe customer.")
    except UserUpdateError as ue:
        message = "Failed to create payment ID. Please try again."
        logger.error(red(message))
        return UnexpectedAPIErrorFormat(lang=DEFAULT_LANG, message=message).http_response()
    except Exception as e:
        logger.error(red(str(e)))
        return ForbiddenAPIErrorFormat(message=str(e)).http_response()

@blueprint_payments.route('/v1/stripe/webhook', methods=['POST'])
def stripe_webhook():
    logger.info(magenta("[POST] /v1/stripe/webhook"))

    payload = request.data
    event = None
    lang = DEFAULT_LANG

    try:
        event = stripe.Event.construct_from(
            json.loads(payload), stripe.api_key
        )
        logger.info(yellow(f'Received Stripe webhook event: {event["type"]}'))
    except ValueError as e:
        logger.error(red(f'Invalid payload with error: {e}'))
        return 'Invalid payload', 400

    # Handle the event
    if event['type'] == 'customer.created':
        pass

    if event['type'] == 'setup_intent.created':
        pass

    if event['type'] == 'setup_intent.succeeded':
        logger.info(cyan('type: setup_intent.succeeded'))

        setup_intent = event['data']['object']
        payment_method_id = setup_intent['payment_method']
        user_id = setup_intent['metadata']['user_id']
        logger.info(f'retrieved payment_method_id {payment_method_id} for user_id {user_id}')

        try:
            user = User.find_user_by_id(user_id)
            user.update_stripe_payment_method_id(payment_method_id)
            logger.info(cyan(f"Updated user {user_id} with new payment method ID {payment_method_id}"))
        except UserNotFoundError:
            message = locale.get('user_not_found', lang)
            logger.error(red(message))
            return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
        except UserQueryError:
            message = locale.get('user_find_single_failed', lang)
            logger.error(red(message))
            return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()
        except Exception as e:
            logger.error(red(e))
            return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()

    if event['type'] == 'payment_intent.payment_failed':
        pass

    if event['type'] == 'charge.payment_failed':
        pass
    
    if event['type'] == 'payment_method.attached':
        # called after card updated
        payment_method = event['data']['object']
        logger.info(event)
        customer_id = payment_method.get('customer', {})

        if customer_id:
            logger.info(f'Handling payment_method.attached for user_id {customer_id}')
            try:
                user = User.find_by_customer_id(customer_id)
                if user.last_payment_status == PaymentStatus.CARD_DECLINED.value:
                    # Retry payment
                    logger.info(cyan("===> declined card update detected. retry payment."))
                    user.schedule_payment(lang=DEFAULT_LANG, execute_now=True)
            except UserNotFoundError:
                message = locale.get('user_not_found', lang)
                logger.error(red(message))
                return ResourceNotFoundAPIErrorFormat(lang=lang, message=message).http_response()
            except Exception as e:
                logger.error(red(f"Retry schedule payment for {user.email} failed :{e}"))
                return UnexpectedAPIErrorFormat(lang=lang, message=str(e)).http_response()
        else:
            logger.error(red("Metadata 'user_id' not found in payment_method.attached event"))

    return OKAPISuccessFormat(
                message="Stripe webhook processed successfully.",
                data={'payload': json.loads(payload)}
            ).http_response()

@blueprint_payments.route('/v1/<lang>/payments/method/status', methods=['GET'])
@language_wrapper
@session_helper
def payments_method_status(user, lang, lang_name):
    logger.info(magenta(f'[POST] payements/method/status'))

    # no cutomer_id
    if not user.stripe_customer_id:
        message = locale.get("method_status_no_customer_id", lang)
        logger.info(yellow(message))
        return OKAPISuccessFormat(
                    message=message,
                    data={'status': 'no_customer_id'}
                ).http_response()
    
    # no payment_method_id
    if not user.payment_method_id:
        message = locale.get("method_status_no_payment_method_id", lang)
        logger.info(yellow(message))
        return OKAPISuccessFormat(
                    message=message,
                    data={'status': 'no_payment_method_id'}
                ).http_response()

    # call stripe payment_method_id check
    try:
        payment_method = stripe.PaymentMethod.retrieve(user.payment_method_id)
        payment_method_updated_at = datetime.fromtimestamp(
            payment_method['created'],
            tz=pytz.utc 
        )
        logger.info(f"Payment Method details: {payment_method}")
        card_brand = payment_method.card.brand
        last4 = payment_method.card.last4

        if user.last_payment_status == PaymentStatus.CARD_DECLINED.value:
            if payment_method_updated_at > User.ensure_utc(user.last_payment_date):
                # Payment method was updated after the last declined payment
                message = locale.get("method_status_card_declined_but_updated", lang)
                logger.info(yellow(message))
                return OKAPISuccessFormat(
                    message=message,
                    data={
                        'status': 'card_declined_but_updated',
                        'card_brand': card_brand,
                        'last4': last4
                        }
                ).http_response()
            else:
                # Card was declined and no new updates
                message = locale.get("method_status_card_declined", lang)
                logger.info(yellow(message))
                return OKAPISuccessFormat(
                    message=message,
                    data={
                        'status': 'card_declined',
                        'card_brand': card_brand,
                        'last4': last4
                    }
                ).http_response()

        message = locale.get("method_status_valid", lang)
        logger.info(green(message))
        return OKAPISuccessFormat(
                    message=message,
                    data={
                        'status': 'payment_method_valid',
                        'payment_method': payment_method,
                        'card_brand': card_brand,
                        'last4': last4}
                ).http_response()
    except stripe.error.StripeError as e:
        logger.info(red(f"Error retrieving payment method: {e}"))
        message = locale.get("method_status_stripe_error", lang, [str(e)])   
        logger.error(red(message))
        return UnexpectedAPIErrorFormat(lang=lang, message=message).http_response()