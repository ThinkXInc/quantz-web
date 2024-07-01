import argparse
from mongoengine import connect, DoesNotExist
from models.data.user import User  # Adjust the import according to your project structure

# Setup logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Config
from config import Config, check_config
CONFIG_REQUIRED_KEYS = [
    'MONGO_DB_HOST',
    'MONGO_DB_PORT',
    'MONGO_DB_USER',
    'MONGO_DB_PASSWORD',
    'MONGO_DB_NAME'
]
check_config(Config, CONFIG_REQUIRED_KEYS)

def delete_all_users():
    """
    Function to delete all User documents from the database.
    """
    try:
        num_deleted = User.objects.delete()
        logger.info(f"Deleted {num_deleted} users from the database.")
    except Exception as e:
        logger.error(f"An error occurred while deleting users: {e}")

def main():
    # Setting up argument parser
    parser = argparse.ArgumentParser(description="Utility script to manage database operations.")
    parser.add_argument('--user', action='store_true', help='Flag to trigger deletion of all User instances')

    args = parser.parse_args()

    # Connect to MongoDB - adjust the database parameters as necessary
    connect(host=f"mongodb://{MONGO_DB_USER}:{MONGO_DB_PASSWORD}@{MONGO_DB_HOST}:{MONGO_DB_PORT}/{MONGO_DB_NAME}")

    # Perform actions based on arguments
    if args.user:
        delete_all_users()

if __name__ == "__main__":
    main()
