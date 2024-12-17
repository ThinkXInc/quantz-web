# global configurations
IS_DEBUG = True
import logging
LOG_LEVEL = logging.DEBUG if IS_DEBUG else logging.INFO

import os
from enum import Enum
from datetime import datetime
from os.path import dirname, abspath, join
from dotenv import load_dotenv
# Set logger
from libcommon.logger import Logger
logger = Logger('vectordb_server/config.py')
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
                logger.debug(yellow(f"Config.{key}: {value}"))
        else:
            # Log missing keys with error highlighting
            logger.error(red(f"Config key '{key}' is missing."))

    if missing_or_none_keys:
        error_message = f"Missing or None configuration keys: {', '.join(missing_or_none_keys)}"
        logger.error(red(error_message))
        raise MissingKeyError(red(error_message))

class Config:
    # web-server/
    SRC_ROOT = dirname(abspath(__file__))
    # quantz/ 
    PRJ_ROOT = dirname(SRC_ROOT)

    DOTENV_PATH = join(PRJ_ROOT, '.env')

    REQUIRED_KEYS_IN_DOTENV = [
        'ENV',
        "LLM_CHECKPOINT",
        "LLM_MAX_TOKENS",
        "LLM_MAX_CONTEXT",
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
        'REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC'
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

    LLM_CHECKPOINT = os.environ.get("LLM_CHECKPOINT")
    LLM_MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS"))
    LLM_MAX_CONTEXT = int(os.environ.get("LLM_MAX_CONTEXT"))

    VECTORDB_ENCODER_CHECKPOINT = os.environ.get("VECTORDB_ENCODER_CHECKPOINT")
    VECTORDB_EMBEDDING_DIM = int(os.environ.get("VECTORDB_EMBEDDING_DIM"))
    VECTORDB_HOST = os.environ.get("VECTORDB_HOST")
    VECTORDB_PORT = int(os.environ.get("VECTORDB_PORT"))

    RABBITMQ_VECTORDB_USER = os.environ.get('RABBITMQ_VECTORDB_USER')
    RABBITMQ_VECTORDB_HOST = os.environ.get('RABBITMQ_VECTORDB_HOST')
    RABBITMQ_VECTORDB_PORT = int(os.environ.get('RABBITMQ_VECTORDB_PORT'))
    RABBITMQ_VECTORDB_PASSWORD = os.environ.get('RABBITMQ_VECTORDB_PASSWORD')

    REDIS_RESULTS_VECTORDB_HOST = os.environ.get('REDIS_RESULTS_VECTORDB_HOST')
    REDIS_RESULTS_VECTORDB_PORT = int(os.environ.get('REDIS_RESULTS_VECTORDB_PORT'))
    REDIS_RESULTS_VECTORDB_LOGLEVEL = os.environ.get('REDIS_RESULTS_VECTORDB_LOGLEVEL')
    REDIS_RESULTS_VECTORDB_DB_NUMBER = int(os.environ.get('REDIS_RESULTS_VECTORDB_DB_NUMBER'))
    REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC = int(os.environ.get('REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC'))