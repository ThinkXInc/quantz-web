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

def delete_user_by_email(email):
    """
    Function to delete a User document by email.
    """
    try:
        user = User.objects(email=email).get()
        user.delete()
        logger.info(f"Deleted user with email {email} from the database.")
    except DoesNotExist:
        logger.warning(f"No user found with email {email}.")
    except Exception as e:
        logger.error(f"An error occurred while deleting the user: {e}")


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
    parser.add_argument('--delete_all_users', action='store_true', help='Flag to trigger deletion of all User instances')
    parser.add_argument('--email', type=str, help='Email of the user to delete')

    args = parser.parse_args()

    # Connect to MongoDB - adjust the database parameters as necessary
    connect(host=f"mongodb://{Config.MONGO_DB_USER}:{Config.MONGO_DB_PASSWORD}@{Config.MONGO_DB_HOST}:{Config.MONGO_DB_PORT}/{Config.MONGO_DB_NAME}")

    # Perform actions based on arguments
    if args.delete_all:
        delete_all_users()
    elif args.email:
        delete_user_by_email(args.email)

if __name__ == "__main__":
    main()
