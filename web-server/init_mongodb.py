# mongodb
from mongoengine import connect
from config import Config, check_config

# logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

MONGO_DB_REQUIRED_KEYS = [
    'MONGO_DB_HOST',
    'MONGO_DB_PORT',
    'MONGO_DB_USER',
    'MONGO_DB_PASSWORD',
    'MONGO_DB_NAME'
]
MONGO_DB_HOST=Config.MONGO_DB_HOST
MONGO_DB_PORT=Config.MONGO_DB_PORT
MONGO_DB_USER=Config.MONGO_DB_USER
MONGO_DB_PASSWORD=Config.MONGO_DB_PASSWORD
MONGO_DB_NAME=Config.MONGO_DB_NAME

# Check if all keys and values are satisfied
check_config(Config, MONGO_DB_REQUIRED_KEYS)

# Attempt to connect and log the outcome
try:
    logger.info(magenta('Initializing MongoDB...'))
    connect(host=f"mongodb://{MONGO_DB_USER}:{MONGO_DB_PASSWORD}@{MONGO_DB_HOST}:{MONGO_DB_PORT}/{MONGO_DB_NAME}")
    logger.info(green('Successfully connected to MongoDB.'))
except Exception as e:
    logger.error(red(f'Failed to connect to MongoDB: {e}'))
