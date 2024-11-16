import json
import time
import sys
import pytz
from datetime import datetime

# MongoDB
from init_mongodb import connect

# User
from models.data.user import (
    User,
    UserNotFoundError,
    PaymentStatus
)

# HostManager
from accessdb.host_manager import HostManager, HostSettingError

# Email
from mails.send_mail import (
    send_notify_card_issue_email,
    send_free_call_given_email,
    send_chatdata_report_email,
    MailSendError
)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'UNIT_PRICE_USD',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
    'STRIPE_SECRET_KEY',
    'MONTHLY_FREE_CREDIT',
    'PAYMENT_MAX_RETRIES',
    'PAYMENT_RETRY_DELAY',
    "REDIS_CHATDATA_HOST",
    "REDIS_CHATDATA_PORT",
    "REDIS_CHATDATA_DB_NUMBER",
    "REDIS_CHATDATA_LOGLEVEL",
    "REDIS_CHATDATA_EXPIRATION_TIME_SEC",
    "REDIS_CHATDATA_QUEUE_NAME",

]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

UNIT_PRICE_USD = Config.UNIT_PRICE_USD

REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER

REDIS_CHATDATA_HOST = Config.REDIS_CHATDATA_HOST
REDIS_CHATDATA_PORT = Config.REDIS_CHATDATA_PORT
REDIS_CHATDATA_DB_NUMBER = Config.REDIS_CHATDATA_DB_NUMBER
REDIS_CHATDATA_LOGLEVEL = Config.REDIS_CHATDATA_LOGLEVEL
REDIS_CHATDATA_EXPIRATION_TIME_SEC = Config.REDIS_CHATDATA_EXPIRATION_TIME_SEC
REDIS_CHATDATA_QUEUE_NAME = Config.REDIS_CHATDATA_QUEUE_NAME

# chatdata
from datetime import timedelta
from llm.chat_db import ChatData, ChatDB
import redis
from redis import Redis, ConnectionPool
from llm.chat_history import parse_history, ParseHistoryError
from models.data.chatdata import Chatdata, ChatdataSaveError

def get_redis_instance():
    try:
        redis_connection_pool = ConnectionPool(
            host=REDIS_CHATDATA_HOST,
            port=REDIS_CHATDATA_PORT,
            db=REDIS_CHATDATA_DB_NUMBER,
            socket_timeout=10,
            max_connections=10  # Example setting
        )
        redis_instance = Redis(connection_pool=redis_connection_pool)
    except Exception as e:
        logger.error(red(str(e)))
    logger.info(light_green('redis connection pool created'))
    return redis_instance

# Stripe
import stripe
stripe.api_key = Config.STRIPE_SECRET_KEY

# Set logger
from libcommon.logger import Logger
logger = Logger('web-server cerely worker')
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Locale
from libcommon.locale import Locale
LOCALES_ROOT = Config.LOCALES_ROOT
BILLING_RESPONSES_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/payments_responses.json'
locale = Locale([BILLING_RESPONSES_LOCALE_FILE_PATH])

## Define tasks
from web_tasks_server.celery_instance import celery_app

# Celery
from celery import current_task


DESCRIPTION_DATE_FORMAT = "%Y-%m-%d"

MONTHLY_FREE_CREDIT = Config.MONTHLY_FREE_CREDIT
PAYMENT_MAX_RETRIES = Config.PAYMENT_MAX_RETRIES
PAYMENT_RETRY_DELAY = Config.PAYMENT_RETRY_DELAY

def round_price(value, decimals=2):
    factor = 10 ** decimals
    return (value * factor // 1) / factor

@celery_app.task(queue='billing.echo')
def echo(text):
    time.sleep(0)
    logger.info(cyan(f'echo: {text}'))
    return text

@celery_app.task(queue='billing.run_payment', max_retries=PAYMENT_MAX_RETRIES, default_retry_delay=PAYMENT_RETRY_DELAY)
def run_payment(user_id, lang):
    logger.debug(cyan('run payment ----->'))
    try:
        # get user
        user = User.objects(id=user_id).first()
        if not user:
            raise ValueError("User not found")

        logger.info(f"User found: {user_id} {user.email} for payment processing.")

        if not user.next_billing:
            logger.error(red("Cannot run payment without a next billing date."))
            raise ValueError(f"No next billing date is set in user {user.id} {user.email}")

        if not user.stripe_customer_id:
            logger.warning(yellow("Cannot run payment without Stripe customer ID. Needs setup correctly."))
            return {'success': False, 'type': 'NoStripeCustomerId'}
 
        logger.info(f"User {user_id} is ready to pay.")

        # calculate billing
        host_manager = HostManager(
            host=REDIS_ACCESS_HOST,
            port=REDIS_ACCESS_PORT,
            db_number=REDIS_ACCESS_DB_NUMBER)

        start_timestamp = int(User.ensure_utc(user.start_billing).timestamp())
        end_timestamp = int(User.ensure_utc(user.next_billing).timestamp())

        usage = host_manager.retrieve_usage_for_billing_period(
            str(user.id), start_timestamp, end_timestamp)
        billing_usage = max(usage - user.free_call, 0)
        price = round_price(UNIT_PRICE_USD * billing_usage)

        logger.debug(magenta(f"Calculated price: {price} for billing usage: {billing_usage} ({usage} - {user.free_call} free)"))

        if user.free_call > 0:
            description = locale.get('billing_description_with_free_call', lang, [
                user.start_billing.strftime(DESCRIPTION_DATE_FORMAT),
                user.next_billing.strftime(DESCRIPTION_DATE_FORMAT),
                str(UNIT_PRICE_USD),
                str(billing_usage),
                str(user.free_call)])
        else:
            description = locale.get('billing_description', lang, [
                user.start_billing.strftime(DESCRIPTION_DATE_FORMAT),
                user.next_billing.strftime(DESCRIPTION_DATE_FORMAT),
                str(UNIT_PRICE_USD),
                str(billing_usage)])

        logger.debug(f"Description compiled -> {description}")

        intent = None
        if price <= 0:
            user.last_payment_status = PaymentStatus.NO_CHARGE.value
            logger.info(yellow(f"Usage fee is 0. Payment not executed for user {user_id} ."))
        else:
            # stripe charge
            intent = user.execute_billing_charge(
                price=price,
                currency='usd',
                description=description)
            logger.info(green(f"Payment executed for user {user_id}: {intent} [Description] {description}"))

        user.last_payment_intent_id = intent.id if intent and 'id' in intent else None
        user.save()

        # update free call & next billing
        user.free_call = MONTHLY_FREE_CREDIT
        user.start_billing = User.ensure_utc(user.next_billing)
        user.next_billing = User.ensure_utc(user.calculate_next_billing_date(user.start_billing))
        logger.info(green(f"Next billing date updated to {user.next_billing} {user.next_billing.tzinfo}"))

        user.last_payment_status = PaymentStatus.SUCCESS.value
        user.last_payment_error = ""
        user.last_payment_date = datetime.now(pytz.utc)
        user.save()

        # Schedule the next payment
        user.schedule_payment(lang)

        if user.free_call > 0:
            send_free_call_given_email(user)
        return {'success': True, 'intent_id': intent.id if intent else None}

    except stripe.error.CardError as e:
        try:
            send_notify_card_issue_email(user)
            host_manager.set_suspend(str(user.id), suspend=True)
            logger.error(red(f"Card issue for user {user_id}: {e.user_message}"))
        except MailSendError as e:
            logger.error(red(e))
        return {'success': False, 'error': str(e), 'type': 'CardError'}

    except stripe.error.StripeError as e:
        # Retry tomorrow
        logger.error(red(f"Stripe API error for user {user_id}: {e}"))
        return current_task.retry(exc=e)

    except Exception as e:
        logger.error(red(f'Unexpected error: {e}'))
        try:
            if user:
                user.last_payment_status = PaymentStatus.UNKNOWN_ERROR.value
                user.save()
        except Exception as e:
            logger.error(red(str(e)))
        return {'success': False, 'error': str(e), 'type': 'UnexpectedError'}
    finally:
        logger.debug(cyan('<---- done payment'))


@celery_app.task(queue='process_chatdata')
def process_chatdata(client_id):
    redis_instance = get_redis_instance()
    print(magenta(client_id))
    print(magenta(redis_instance.hgetall(client_id)))

    raw_data = redis_instance.hgetall(client_id)
    data = {k.decode('utf-8'): v.decode('utf-8') for k, v in raw_data.items()}
    chat_data = ChatData.from_redis(data)
    logger.info(f"Processing chat data for client_id: {client_id}")
    logger.info(bold(f"host_id: {chat_data.host_id}"))
    logger.info(bold(f"history: {chat_data.history}"))
    logger.info(bold(f"start_time: {chat_data.start_time} {datetime.utcfromtimestamp(chat_data.start_time)}"))

    if chat_data.history == '':
        logger.warning(f"Empty history.")
        logger.info(f"{chat_data}")
        if chat_data.host_id:
            # increment host_usage
            pass

    TOO_SHORT_THRESHOLD = 30
    logger.debug(f'length of history {len(chat_data.history)}')
    if len(chat_data.history) < TOO_SHORT_THRESHOLD:
        logger.warning(f"History is too short. {len(chat_data.history)} < {TOO_SHORT_THRESHOLD}")
        if chat_data.host_id:
            # increment host_usage
            pass

    try:
        start_datetime = datetime.utcfromtimestamp(chat_data.start_time)
    except Exception as e:
        logger.error(red(f"start_time {chat_data.start_time} can't format to datetime"))

    if chat_data.host_id:
        # Find user by host_id
        try:
            logger.info(f'trying to find user by {chat_data.host_id}..')
            user = User.find_user_by_id(user_id=chat_data.host_id)
            logger.info(green(f'User {user.email} found.'))
        except UserNotFoundError as e:
            logger.error(red(f"{e}"))
            return
        except Exception as e:
            logger.error(red(f"Find user failed: {e}"))
            return

        # Save history to MongoDB
        try:
            logger.info(f'trying to save Chatdata to MongoDB..')
            chatdata = Chatdata.create_new(
                host_id=chat_data.host_id,
                client_id=chat_data.client_id,
                history=chat_data.history,
                start_time=start_datetime,
                user=user
            )
            logger.info(green(f'Chatdata {chatdata.id} saved.'))
        except ChatdataSaveError as e:
            logger.error(red(f"{e}"))
        except Exception as e:
            logger.error(red(f"Save chatdata failed: {e}"))

        # Parse history
        try:
            parsed_history = parse_history(chat_data.history, "<human>", "<bot>")
            parsed_history = [turn for turn in parsed_history if len(turn['text'].strip()) > 0]
            logger.info(f'history parsed =>')
            for turn in parsed_history:
                logger.info(f"{turn}")
                speaker = turn['speaker']
                text = turn['text']
        except ParseHistoryError as e:
            logger.error(red(f"Error parsing history: {e}"))
        except Exception as e:
            logger.error(red(f"An unexpected error occurred: {e}"))


        # Send report email
        try:
            send_chatdata_report_email(parsed_history, start_datetime, user)
        except MailSendError as e:
            logger.error(red(e))


def listen_chatdata_queue():
    redis_instance = get_redis_instance()

    # DEV
    try:
        client_id = 'xxxxxxxxx'
        redis_instance.lpush(REDIS_CHATDATA_QUEUE_NAME, client_id) # Push client ID to the queue
        logger.info(f'{client_id} is pushed to {REDIS_CHATDATA_QUEUE_NAME}')
    except Exception as e:
        logger.error(orange("Error during lpush or task delay: {}".format(str(e))))
    # DEV

    while True:
        try:
            result = redis_instance.brpop(REDIS_CHATDATA_QUEUE_NAME)
            _, client_id = result  # This line only executes if result is not None
            process_chatdata.delay(client_id.decode('utf-8'))
        except redis.exceptions.TimeoutError:
            logger.info("No items in queue, timeout expired, continuing...")
            continue  # Properly handle the timeout scenario
        except TypeError:
            # This handles the case where result is None and unpacking fails
            logger.info("No items in queue, received None, continuing...")
            continue
        except Exception as e:
            logger.error(f"Unexpected error during BRPOP: {str(e)}")


@celery_app.task(queue='report.send_resport')
def send_report(user_id, lang):
    pass