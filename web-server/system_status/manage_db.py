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

# GeneralSystemStatus
from system_status.models.system_status import GeneralSystemStatus

def update_general_status(restricted=None, email=None):
    try:
        general_status, created = GeneralSystemStatus.get_or_create()
        if restricted is not None:
            general_status.is_signup_restricted = restricted
            action = "restricted" if restricted else "not restricted"
            logger.info(green(f"General system status updated to {action}."))
        if email:
            general_status.wait_list_emails.append(email)
            logger.info(green(f"Email {email} added to wait list."))
        general_status.save()
    except Exception as e:
        logger.error(red(f"Failed to update General System Status: {str(e)}"))

def get_general_status():
    try:
        general_status = GeneralSystemStatus.objects.first()
        if general_status:
            logger.info(green(f"General System Status: {general_status.response_json()}"))
        else:
            logger.info(yellow("No General System Status found."))
    except Exception as e:
        logger.error(red(f"Failed to retrieve General System Status: {str(e)}"))


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

    parser.add_argument('--general_status', action='store_true', help='Manage General System Status')
    parser.add_argument('--is_signup_restricted', type=str, choices=['true', 'false'], help='Set signup restriction status')
    parser.add_argument('--get', action='store_true', help='Get current General System Status')
    parser.add_argument('--wait_list_emails', type=str, help='Email to append to wait list')

    args = parser.parse_args()

    if args.user and args.email and args.delete:
        delete_user_by_email(args.email)
    else:
        logger.info(yellow("Invalid arguments. Use --user --email {email} --delete to delete a user."))

    if args.general_status:
        if args.is_signup_restricted:
            update_general_status(restricted=(args.is_signup_restricted == 'true'))
        elif args.wait_list_emails:
            update_general_status(email=args.wait_list_emails)
        elif args.get:
            pass
        else:
            logger.info(yellow("Please provide an action for --general_status."))
        get_general_status()
    else:
        logger.info(yellow("Invalid or missing arguments. Please review the usage of the script."))


if __name__ == '__main__':
    main()