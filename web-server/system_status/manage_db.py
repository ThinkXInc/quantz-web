import os
import sys
import argparse

sys.path.append('/src/quantz-web/web-server') 

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

# User
from init_mongodb import connect
from models.data.user import User, UserNotFoundError

# Material
from models.data.material import Material, MaterialQueryError

# Chatdata
from models.data.chatdata import Chatdata

def delete_user_by_email(email):
    try:
        user = User.objects(email=email).first()
        if not user:
            logger.error(red(f"No user found with email: {email}"))
            return

        # Delete related materials
        Material.objects(user=user).delete()
        logger.info(green(f"All materials related to {email} have been deleted."))

        # Delete related chatdata
        Chatdata.objects(user=user).delete()
        logger.info(green(f"All chatdata related to {email} have been deleted."))

        # Delete related material
        Material.objects(user=user).delete()
        logger.info(green(f"All material related to {email} have been deleted."))

        # Delete the user
        user.delete()
        logger.info(green(f"User with email {email} has been successfully deleted."))

    except Exception as e:
        logger.error(red(f"Error in deleting user with email {email}: {str(e)}"))

def main():
    parser = argparse.ArgumentParser(description='Manage Database Entries')
    parser.add_argument('--user', action='store_true', help='Flag to specify user management')
    parser.add_argument('--email', type=str, help='Email of the user to manage')
    parser.add_argument('--delete', action='store_true', help='Flag to delete the user')

    args = parser.parse_args()

    if args.user and args.email and args.delete:
        delete_user_by_email(args.email)
    else:
        logger.info(yellow("Invalid arguments. Use --user --email {email} --delete to delete a user."))

if __name__ == '__main__':
    main()