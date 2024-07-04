#!/usr/bin/python
# -*- coding: utf-8 -*-
#
# NOTE:
# always considering using yaml to express settings, 
# but in the end writing them in python files for flexibility 
# in terms of conditional branching, etc.
#

import os
import logging
from enum import Enum
from datetime import datetime
from os.path import dirname, abspath, join
from dotenv import load_dotenv
# Set logger
from libcommon.logger import Logger
logger = Logger('web-server/config.py')
logger.setLevel(logger.DEBUG)
from libcommon.color import *

class EnvironmentNotSpecified(Exception):
    pass

class MissingKeyError(Exception):
    """Raised when a required key is missing from .env file."""
    pass

def check_config(config, required_keys):
    """Function to check if all required configuration keys exist and are not None."""
    # Assuming `red` and `bold` are defined functions that color the text
    missing_or_none_keys = [key for key in required_keys if not hasattr(config, key) or getattr(config, key) is None]
    
    for key in required_keys:
        if hasattr(config, key):
            value = getattr(config, key)
            if value is None:
                # Log with error highlighting if value is None
                logger.error(red(f"Config.{key} is set but its value is None."))
            else:
                # Log with standard highlighting for info
                if "SECRET" in key or "PASS" in key:
                    logger.debug(yellow(f"Config.{key}: **{value[-2:]}"))
                else:
                    logger.debug(yellow(f"Config.{key}: {value}"))
        else:
            # Log missing keys with error highlighting
            logger.error(red(f"Config key '{key}' is missing."))

    if missing_or_none_keys:
        error_message = f"Missing or None configuration keys: {', '.join(missing_or_none_keys)}"
        logger.error(red(error_message))
        raise MissingKeyError(red(error_message))

class BillingSchedule(Enum):
    MONTHLY = 'monthly'
    MINUTES_5 = '5min'
    MINUTES_1 = '1min'
    SECONDS_30 = '30sec'

class Config:
    # web-server/
    SRC_ROOT = dirname(abspath(__file__))
    # quantz/ 
    PRJ_ROOT = dirname(SRC_ROOT)
    # web-server/locales
    LOCALES_ROOT = join(SRC_ROOT, 'locales')
    # web-server/data
    DATA_DIR = join(SRC_ROOT, 'data')

    ANIMAL_NAME_MECAB_DIC_PATH = join(DATA_DIR, 'animal/animal_name.dic')
    # TODO: ansible によるinstall 場所に変更する
    MECAB_SYSTEM_DIC_PATH = '/usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd'

    DOTENV_PATH = join(PRJ_ROOT, '.env')

    REQUIRED_KEYS_IN_DOTENV = [
        'ENV',
        'FLASK_APP_SECRET_KEY',
        'PASSWORD_ENCRYPT_KEY',
        'MONGO_DB_HOST',
        'MONGO_DB_PORT',
        'MONGO_DB_USER',
        'MONGO_DB_PASSWORD',
        'MONGO_DB_NAME',
        "REDIS_SESSION_HOST",
        "REDIS_SESSION_PORT",
        "REDIS_SESSION_LOGLEVEL",
        "REDIS_SESSION_EXPIRATION_TIME_SEC",
        "REDIS_CHATDATA_HOST",
        "REDIS_CHATDATA_PORT",
        "REDIS_CHATDATA_DB_NUMBER",
        "REDIS_CHATDATA_LOGLEVEL",
        "REDIS_CHATDATA_EXPIRATION_TIME_SEC",
        "REDIS_CHATDATA_QUEUE_NAME",
        "VECTORDB_ENCODER_CHECKPOINT",
        "VECTORDB_EMBEDDING_DIM",
        "VECTORDB_HOST",
        "VECTORDB_PORT",
        'RABBITMQ_VECTORDB_USER',
        'RABBITMQ_VECTORDB_USER',
        'RABBITMQ_VECTORDB_HOST',
        'RABBITMQ_VECTORDB_PORT',
        'RABBITMQ_VECTORDB_PASSWORD',
        'REDIS_RESULTS_VECTORDB_HOST',
        'REDIS_RESULTS_VECTORDB_PORT',
        'REDIS_RESULTS_VECTORDB_LOGLEVEL',
        'REDIS_RESULTS_VECTORDB_DB_NUMBER',
        'REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC',
        "RABBITMQ_WEB_USER",
        "RABBITMQ_WEB_HOST",
        "RABBITMQ_WEB_PORT",
        "RABBITMQ_WEB_PASSWORD",
        "REDIS_RESULTS_WEB_HOST",
        "REDIS_RESULTS_WEB_PORT",
        "REDIS_RESULTS_WEB_DB_NUMBER",
        "REDIS_RESULTS_WEB_LOGLEVEL",
        "REDIS_RESULTS_WEB_EXPIRATION_TIME_SEC",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_DEFAULT_REGION",
        "STRIPE_SECRET_KEY"
    ]

    if os.path.exists(DOTENV_PATH):
        load_dotenv(DOTENV_PATH)

        # Check for required keys
        missing_keys = [key for key in REQUIRED_KEYS_IN_DOTENV if key not in os.environ]
        if missing_keys:
            raise MissingKeyError(red(f"Missing keys in .env file: {', '.join(missing_keys)}"))
    else:
        print(red('[WARNING] no .env file exists in {}'.format(DOTENV_PATH)))

    env = os.environ.get("ENV")
    print(f".env path: {DOTENV_PATH}")
    print(f"environment detected in .env => "+bold(f"{env}"))

    ENV = env

    DEFAULT_LANG = 'en'
    BASIC_AUTH_USERNAME = 'think'
    BASIC_AUTH_PASSWORD = 'x'
    FLASK_APP_SECRET_KEY = os.environ.get("FLASK_APP_SECRET_KEY")
    FLASK_MAX_CONTENT_LENGTH = 70000000
    SESSION_COOKIE_NAME = 'session'

    PASSWORD_ENCRYPT_KEY = os.environ.get("PASSWORD_ENCRYPT_KEY")

    # MongoDB
    MONGO_DB_HOST = os.environ.get("MONGO_DB_HOST")
    MONGO_DB_PORT = os.environ.get("MONGO_DB_PORT")
    MONGO_DB_USER = os.environ.get("MONGO_DB_USER")
    MONGO_DB_PASSWORD = os.environ.get("MONGO_DB_PASSWORD")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME")

    # Session
    REDIS_SESSION_HOST = os.environ.get("REDIS_SESSION_HOST")
    REDIS_SESSION_PORT = int(os.environ.get("REDIS_SESSION_PORT"))
    REDIS_SESSION_DB_NUMBER = int(os.environ.get("REDIS_SESSION_DB_NUMBER"))
    REDIS_SESSION_LOGLEVEL = os.environ.get("REDIS_SESSION_LOGLEVEL")
    REDIS_SESSION_EXPIRATION_TIME_SEC = int(os.environ.get("REDIS_SESSION_EXPIRATION_TIME_SEC"))

    # Redis Chatdata
    REDIS_CHATDATA_HOST = os.environ.get('REDIS_CHATDATA_HOST')
    REDIS_CHATDATA_PORT = os.environ.get('REDIS_CHATDATA_PORT')
    REDIS_CHATDATA_DB_NUMBER = os.environ.get('REDIS_CHATDATA_DB_NUMBER')
    REDIS_CHATDATA_LOGLEVEL = os.environ.get('REDIS_CHATDATA_LOGLEVEL')
    REDIS_CHATDATA_EXPIRATION_TIME_SEC = os.environ.get('REDIS_CHATDATA_EXPIRATION_TIME_SEC')
    REDIS_CHATDATA_QUEUE_NAME = os.environ.get('REDIS_CHATDATA_QUEUE_NAME')

    # Access DB
    REDIS_ACCESS_HOST = os.environ.get("REDIS_ACCESS_HOST")
    REDIS_ACCESS_PORT = os.environ.get("REDIS_ACCESS_PORT")
    REDIS_ACCESS_DB_NUMBER = os.environ.get("REDIS_ACCESS_DB_NUMBER")
    REDIS_ACESS_USE_UNIX_SOCKET = False

    # VectorDB
    VECTORDB_ENCODER_CHECKPOINT = os.environ.get("VECTORDB_ENCODER_CHECKPOINT")
    VECTORDB_EMBEDDING_DIM = int(os.environ.get("VECTORDB_EMBEDDING_DIM"))
    VECTORDB_HOST = os.environ.get("VECTORDB_HOST")
    VECTORDB_PORT = int(os.environ.get("VECTORDB_PORT"))

    # RabbitMQ VectorDB
    RABBITMQ_VECTORDB_USER = os.environ.get('RABBITMQ_VECTORDB_USER')
    RABBITMQ_VECTORDB_HOST = os.environ.get('RABBITMQ_VECTORDB_HOST')
    RABBITMQ_VECTORDB_PORT = int(os.environ.get('RABBITMQ_VECTORDB_PORT'))
    RABBITMQ_VECTORDB_PASSWORD = os.environ.get('RABBITMQ_VECTORDB_PASSWORD')

    # Redis Results VectorDB
    REDIS_RESULTS_VECTORDB_HOST = os.environ.get('REDIS_RESULTS_VECTORDB_HOST')
    REDIS_RESULTS_VECTORDB_PORT = int(os.environ.get('REDIS_RESULTS_VECTORDB_PORT'))
    REDIS_RESULTS_VECTORDB_LOGLEVEL = os.environ.get('REDIS_RESULTS_VECTORDB_LOGLEVEL')
    REDIS_RESULTS_VECTORDB_DB_NUMBER = int(os.environ.get('REDIS_RESULTS_VECTORDB_DB_NUMBER'))
    REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC = int(os.environ.get('REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC'))

    # RabbitMQ Web settings
    RABBITMQ_WEB_USER = os.environ.get('RABBITMQ_WEB_USER')
    RABBITMQ_WEB_HOST = os.environ.get('RABBITMQ_WEB_HOST')
    RABBITMQ_WEB_PORT = int(os.environ.get('RABBITMQ_WEB_PORT'))
    RABBITMQ_WEB_PASSWORD = os.environ.get('RABBITMQ_WEB_PASSWORD')

    # Redis Results Web settings
    REDIS_RESULTS_WEB_HOST = os.environ.get('REDIS_RESULTS_WEB_HOST')
    REDIS_RESULTS_WEB_PORT = int(os.environ.get('REDIS_RESULTS_WEB_PORT'))
    REDIS_RESULTS_WEB_DB_NUMBER = int(os.environ.get('REDIS_RESULTS_WEB_DB_NUMBER'))
    REDIS_RESULTS_WEB_LOGLEVEL = os.environ.get('REDIS_RESULTS_WEB_LOGLEVEL')
    REDIS_RESULTS_WEB_EXPIRATION_TIME_SEC = int(os.environ.get('REDIS_RESULTS_WEB_EXPIRATION_TIME_SEC'))

    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")

    AWS_PROFILE_NAME = 'quantz-system'
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
    AWS_DEFAULT_REGION = os.environ.get("AWS_DEFAULT_REGION")

    GOOGLE_OAUTH_CLIENT_ID = "53794604964-782scvqhcdarhu3ujpihao5v3h9re683.apps.googleusercontent.com"

    MAIL_NOREPLY = 'Quantz <noreply@quantz.thinkxinc.com>'
    MAIL_SUPPORT = 'support@quantz.thinkxinc.com'  # necessary
    MAIL_SYSTEM = 'system@quantz.thinkxinc.com'

    FIRST_MONTH_FREE_CALL = 50
    MONTHLY_FREE_CALL = 10
    UNIT_PRICE_USD = 0.05
    USAGE_LIMIT_DEFAULT = 200
 
    PAYMENT_MAX_RETRIES = 3

    VERIFICATION_CODE_EXPIRED_HOUR = 1

    if env == "production":
        HOST_URL = "https://quantz.thinkxinc.com"
        LOG_LEVEL = logging.INFO

        NEXT_BILLING_SCHEDULE = BillingSchedule.MONTHLY
        PAYMENT_RETRY_DELAY = 60 * 60 * 24  # sec

        #LOG_FILEPATH = f'/var/log/quantz.log'

        #S3_BUCKET_NAME_MONGO_DUMP = "quantz-mongo-dump"
        #S3_BUCKET_NAME_CONTENTS = 'quantz-contents'
    elif env == "develop":
        HOST_URL = "https://quantz.thinkxinc.com"
        LOG_LEVEL = logging.DEBUG

        NEXT_BILLING_SCHEDULE = BillingSchedule.MINUTES_5
        PAYMENT_RETRY_DELAY = 30  # sec
    elif env == "local":
        HOST_URL = "http://localhost:8000"
        LOG_LEVEL = logging.DEBUG

        NEXT_BILLING_SCHEDULE = BillingSchedule.SECONDS_30
        PAYMENT_RETRY_DELAY = 30  # sec
    else:
        print('no env specified')
        raise EnvironmentNotSpecified