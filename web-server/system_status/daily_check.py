import os
import time
from datetime import datetime, timedelta
import pytz
import sys
import argparse


# Logger
sys.path.append('/src/quantz-web/web-server') 
from libcommon.logger import Logger
from libcommon.color import *
logger = Logger('daily_check.py')
logger.setLevel(logger.DEBUG)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
    'MAIL_NOREPLY',
    'MAIL_SUPPORT',
    'MAIL_SYSTEM',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_DEFAULT_REGION',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER
MAIL_NOREPLY = Config.MAIL_NOREPLY
MAIL_SUPPORT = Config.MAIL_SUPPORT
MAIL_SYSTEM = Config.MAIL_SYSTEM
MAIL_SENDER = MAIL_SYSTEM
MAIL_REPLYTO = MAIL_SUPPORT
AWS_ACCESS_KEY_ID = Config.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = Config.AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION = Config.AWS_DEFAULT_REGION

DEBUG = False

# Mail
from libcommon.mail import Mail, MailSendError
BCC = ["kaz@thinkxinc.com"]
mail = Mail(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION)

# Mail to wait list user
from mails.send_mail import send_invitation_for_wait_list_user_email

# MongoDB
from init_mongodb import connect

# System Status
from system_status.models.system_status import DailySystemStatus, GeneralSystemStatus, Congestion

# User
from models.data.user import (
    User,
    UserNotFoundError,
    PaymentStatus
)

# Material
from models.data.material import Material

# Chatdata
from models.data.chatdata import Chatdata  # Ensure this is the correct import path for Chatdata model

# Host DB
from accessdb.host_manager import init_host_manager

host_manager = init_host_manager(
    host=REDIS_ACCESS_HOST,
    port=REDIS_ACCESS_PORT,
    db_number=REDIS_ACCESS_DB_NUMBER
)

# Clean orphan data
from system_status.clean_orphan_data import (
    delete_orphan_material,
    delete_orphan_chatdata
)



# Stats

def num_new_users(last_hours=24) -> int:
    """the number of User's creates in the last 24 hours."""
    logger.info('\n\n')
    logger.info('----- new users')
    try:
        time_threshold = datetime.utcnow().replace(tzinfo=pytz.utc) - timedelta(hours=last_hours)
        new_users_count = User.objects(created__gte=time_threshold).count()
        logger.info(green(f'Number of new user registrations in the last {last_hours} hours: => {new_users_count}'))
        return new_users_count
    except Exception as e:
        logger.error(red(f"Error counting new users: {e}"))
        return 0

def num_usage(last_hours=24):
    """Total the number of usages for the past 24 hours for all origins."""
    logger.info('\n\n')
    logger.info('----- total usage')
    try:
        end_time = datetime.utcnow().replace(tzinfo=pytz.utc)
        start_time = end_time - timedelta(hours=last_hours)
        start_timestamp = int(start_time.timestamp())
        end_timestamp = int(end_time.timestamp())

        total_usage = host_manager.count_usage_in_period(start_timestamp, end_timestamp, host_id='*')
        logger.info(green(f"Total usage for all origins in the last {last_hours} hours: => {total_usage}"))
        return total_usage
    except Exception as e:
        logger.error(red(f"Error calculating total usage: {e}"))
        return 0

def num_users_used(last_hours=24):
    """Calculate the number of unique users in the last period."""
    logger.info('\n\n')
    logger.info('----- active user (last 24 hours)')
    try:
        current_time = datetime.utcnow().replace(tzinfo=pytz.utc)
        time_threshold = current_time - timedelta(hours=last_hours)
        logger.debug(f"Current time (UTC): {current_time.isoformat()}")
        logger.debug(f"Time threshold (UTC): {time_threshold.isoformat()}")

        unique_users = Chatdata.objects(created__gte=time_threshold).distinct('user')
        num_users = len(unique_users)
        logger.info(green(f"Number of active users in the last {last_hours} hours: => {num_users}"))
        logger.debug(f"Active user IDs: {unique_users}")
        return num_users
    except Exception as e:
        logger.error(red(f"Error calculating number of users used: {str(e)}"))
        return 0

def num_active_users(last_hours=72):
    """The active user is defined as users who have used the system at least once within 3 days."""
    logger.info('\n\n')
    logger.info('----- active user (last 3 days)')
    try:
        time_threshold = datetime.utcnow().replace(tzinfo=pytz.utc) - timedelta(hours=last_hours)
        active_users = Chatdata.objects(created__gte=time_threshold).distinct('user')
        num_active_users = len(active_users)
        logger.info(green(f"Number of active users in the last {last_hours} hours: => {num_active_users}"))
        return num_active_users
    except Exception as e:
        logger.error(red(f"Error calculating number of active users: {e}"))
        return 0

def num_new_materials(last_hours=24):
    """the number of Materials saved in the last 24 hours."""
    logger.info('\n\n')
    logger.info('----- new materials')
    try:
        time_threshold = datetime.utcnow().replace(tzinfo=pytz.utc) - timedelta(hours=last_hours)
        new_materials_count = Material.objects(created__gte=time_threshold).count()
        logger.info(green(f"Number of new materials saved in the last {last_hours} hours: => {new_materials_count}"))
        return new_materials_count
    except Exception as e:
        logger.error(red(f"Error counting new materials: {e}"))
        return 0

def update_daily_status(new_users_count: int, new_materials_count: int, daily_active_users_count: int, active_users_count: int, total_usage_count: int, dryrun=False):
    logger.info('Updating daily status with new statistics...')

    today = datetime.utcnow().replace(tzinfo=pytz.utc)
    yesterday = today - timedelta(days=1)
    today_date = datetime(today.year, today.month, today.day)
    yesterday_date = datetime(yesterday.year, yesterday.month, yesterday.day)

    try:
        yesterday_status, created = DailySystemStatus.get_or_create(created=yesterday_date)
        if yesterday_status:
            logger.info(green(f"Found yesterday's system status: {yesterday_status.response_json()}"))
        else:
            logger.info(yellow("No system status found for yesterday."))

        yesterday_status.n_new_signups = new_users_count
        yesterday_status.n_new_materials = new_materials_count
        yesterday_status.n_daily_active_users = daily_active_users_count
        yesterday_status.n_active_users = active_users_count
        yesterday_status.n_total_usage = total_usage_count
        if not dryrun:
            yesterday_status.save()
        
        logger.info(green(f"Daily system status updated successfully. {'[dryrun]' if dryrun else ''}"))
        logger.info('->')
        logger.info(yesterday_status.response_json())

    except Exception as e:
        logger.error(red(f"Failed to update daily system status: {e}"))

# Mail
def mail_template(
        subject: str,
        new_users_count: int, new_materials_count: int, daily_active_users_count: int, active_users_count: int, total_usage_count: int,
        daily_system_statuses_with_congestion: [DailySystemStatus],
        yesterday_status: DailySystemStatus,
        general_status: GeneralSystemStatus) -> str:
    today = datetime.utcnow().replace(tzinfo=pytz.utc)
    yesterday = today - timedelta(days=1)
    today_date = datetime(today.year, today.month, today.day)
    yesterday_date = datetime(yesterday.year, yesterday.month, yesterday.day)
    yesterday_str = yesterday_date.strftime("%Y %m/%d")

    # Build the plain text version of the email
    text = subject
    text += f'-------------------------------------------------\n'
    text += f'[stats]\n'
    text += f"Total new users today: {new_users_count}\n"
    text += f"Total usage counts today: {total_usage_count}\n"
    text += f"Number of active users (today): {daily_active_users_count}\n"
    text += f"Number of active users (last 3 days): {active_users_count}\n"
    text += f"Number of new materials saved today: {new_materials_count}\n"
    text += f'-------------------------------------------------\n\n'

    text += f'-------------------------------------------------\n'
    text += f'[congestion in last 7 days]\n'
    text += f'{daily_system_statuses_with_congestion.count()} congestions found.\n'
    for i, daily_system_status in enumerate(daily_system_statuses_with_congestion):
        text += f"[{i}]\n"
        text += f"{daily_system_status.response_json()}\n"
    text += f'-------------------------------------------------\n\n'

    text += f'-------------------------------------------------\n'
    text += f'[udpated daily system status]\n'
    text += f'{yesterday_status.response_json()}'
    text += f'-------------------------------------------------\n\n'

    if len(general_status.wait_list_emails) > 100:
        general_status.wait_list_emails = general_status.wait_list_emails[:100]
        general_status.wait_list_emails += ['...']

    text += f'-------------------------------------------------\n'
    text += f'[general system status]\n'
    text += f'{general_status.response_json()}'
    text += f'-------------------------------------------------\n\n'
    return text

def send_mail(subject, text):
    try:
        response = mail.send(
            sender=MAIL_SENDER,
            reply_to=MAIL_REPLYTO,
            recipient=MAIL_SYSTEM,
            subject=subject,
            text=text,
            html=None,
            bcc=BCC  # FIXME: can't send to google group mail list system@quantz.thinkxinc.com
        )
        logger.info(f"Send Mail: success - {response}")
    except Exception as e:
        logger.error(red(f"Send Mail: An error occurred: {e}"))

def stats():
    """
    - The number of new registrations
    - The number of times used
    - The number of users used in the day
    - The number of Active users (used at least once in the past 3 days)
    - the number of saved Materials
    are aggregated and reported by e-mail.
    """
    logger.info('='*80)
    logger.info(bold(f'[{datetime.now().replace(tzinfo=pytz.utc).strftime("%m/%d %H:%M:%S")}] Start daily check.'))

    today = datetime.utcnow().replace(tzinfo=pytz.utc).date()
    today_date = datetime(today.year, today.month, today.day)
    try:
        daily_status, created = DailySystemStatus.get_or_create(created=today_date)
        if created:
            logger.info(light_green(f'DailySystemStatus for {today} not found. Successfully created.'))
        else:
            logger.info(cyan(f'DailySystemStatus for {today} found.'))
        logger.info(daily_status.response_json())
    except Exception as e:
        logger.error(red(f'Failed to get_or_create DailyStatus: {e}'))

    # Gather statistics
    new_users_count = num_new_users()
    total_usage_count = num_usage()
    daily_active_users_count = num_users_used() 
    active_users_count = num_active_users() 
    new_materials_count = num_new_materials()

    # Log summary of all gathered statistics
    logger.info('\n\n')
    logger.info('-'*80)
    logger.info(light_blue("Summary of Daily Statistics:"))
    logger.info(yellow(f"Total new users today: {new_users_count}"))
    logger.info(yellow(f"Total usage counts today: {total_usage_count}"))
    logger.info(yellow(f"Number of active users (today): {daily_active_users_count}"))
    logger.info(yellow(f"Number of active users (last 3 days): {active_users_count}"))
    logger.info(yellow(f"Number of new materials saved today: {new_materials_count}"))

    logger.info('-'*80)

    # Update database
    update_daily_status(
        new_users_count,
        new_materials_count,
        daily_active_users_count,
        active_users_count,
        total_usage_count)

    return  new_users_count, total_usage_count, daily_active_users_count, active_users_count, new_materials_count



# Restrict Signup

def congestion_count(last_days=7) -> [DailySystemStatus]:
    end_date = datetime.utcnow().replace(tzinfo=pytz.utc)
    start_date = end_date - timedelta(days=last_days)
    
    daily_system_statuses_with_congestion = DailySystemStatus.objects(
        created__gte=start_date,
        congestions__not__size=0
    )
    logger.info(f'{daily_system_statuses_with_congestion.count()} congestions in {last_days} days found in daily system status.')
    for status in daily_system_statuses_with_congestion:
        logger.info(status.response_json())

    return daily_system_statuses_with_congestion

def switch_restrict_signup(restrict=True, dryrun=False):
    """Switch the signup restriction flag in GeneralSystemStatus."""
    try:
        general_status, _ = GeneralSystemStatus.get_or_create()
        if restrict:
            logger.info(cyan(f"GeneralSystemStatus.is_signup_restricted is True. {'[dryrun]' if dryrun else ''}"))
        else:
            logger.info(green(f"Set False for GeneralSystemStatus.is_signup_restricted. {'[dryrun]' if dryrun else ''}"))
            general_status.is_signup_restricted = False
            if not dryrun:
                general_status.save()
                logger.info(light_green(f"Successfully updated GeneralSystemStatus.is_signup_restricted."))
    except Exception as e:
        logger.error(red(f"Failed to update signup restrictions: {str(e)}"))

def release_users_from_waiting_list(active_users_count: int, dryrun=False) -> int:
    """
    returns: 
        - n_wait_list (int) : number of the rest of wait list 
    """
    logger.info(bold(f'Calculate users released from waiting list.'))
    try:
        general_status, _ = GeneralSystemStatus.get_or_create()
        if DEBUG:
            general_status.wait_list_emails += ['kaz@thinkxinc.com']  # DEBUG
    except Exception as e:
        logger.error(red(f"Failed to get GeneralStatus: {str(e)}"))

    if not general_status.wait_list_emails:
        logger.info(yellow(f'Waiting list is empty. Skip.'))
    else:
        logger.info(f'{len(general_status.wait_list_emails)} waiting list.')
        logger.info(f'{general_status.wait_list_emails}')
        try:
            latest_daily_status_with_congestion = DailySystemStatus.objects(
                congestions__not__size=0
            ).order_by('-created').first()
            if DEBUG:
                latest_daily_status_with_congestion.n_active_users = 3  # DEBUG
            logger.info(f'latest daily status with congestion : {latest_daily_status_with_congestion.response_json()}')
        except Exception as e:
            logger.error(red(f"Failed to get GeneralStatus: {str(e)}"))

        active_users_count_while_last_congestion = latest_daily_status_with_congestion.n_active_users
        logger.info(f'active users (while last congestion) : {active_users_count_while_last_congestion}')
        logger.info(f'active users (latest) : {active_users_count}')
        num_release = active_users_count_while_last_congestion - active_users_count
        if num_release > 0:
            logger.info(cyan(f'New users capacity : {num_release}'))
        else:
            logger.info(yellow(f'Still no release capacity.'))

        for i in range(num_release):
            if len(general_status.wait_list_emails) == 0:
                break
            email = general_status.wait_list_emails.pop(0)
            logger.info(f'pop {email} from waiting list')

            # send email
            try:
                user = User.find_user_by_email(email)
            except Exception as e:
                logger.error(red(f'Coulud not find user {email}: {e}'))
            
            try:
                send_invitation_for_wait_list_user_email(user)
            except Exception as e:
                logger.error(red(f'Failed to send email to user {email}: {e}'))

        if not dryrun:
            try:
                general_status.save()
                logger.info(light_green(f'Successfully updated general status.'))
                logger.info(light_green(f'{general_status}'))
            except Exception as e:
               logger.error(red(f"Failed to save GeneralStatus: {str(e)}"))

        return len(general_status.wait_list_emails)

       
def check_recent_congestions(active_users_count: int, dryrun=False):
    """Check recent congestions and switch the signup restriction based on the result."""
    logger.info('\n\n')
    logger.info(bold('Checking for recent congestions to determine signup restrictions...'))
    daily_system_statuses_with_congestion = congestion_count(last_days=7)
    if daily_system_statuses_with_congestion.count() == 0 or DEBUG:
        logger.info(green("No congestions in the last 7 days. Disable signup restrictions."))
        n_wait_list = release_users_from_waiting_list(active_users_count, dryrun=dryrun)
        if n_wait_list == 0:
            logger.info(cyan("Wait list became empty. Disable restriction."))
            switch_restrict_signup(restrict=False, dryrun=dryrun)
    else:
        #switch_restrict_signup(restrict=True, dryrun=dryrun)  # don't set True here
        logger.info(yellow("Congestions detected in the last 7 days. Not release wait list."))
    return daily_system_statuses_with_congestion

def parse_arguments():
    parser = argparse.ArgumentParser(description="Run daily system checks with optional dry run.")
    parser.add_argument('--dryrun', action='store_true', help="Run the script in dry run mode without making actual changes.")
    return parser.parse_args()

if __name__ == '__main__':
    args = parse_arguments()
    new_users_count, total_usage_count, daily_active_users_count, active_users_count, new_materials_count = stats()
    daily_system_statuses_with_congestion = check_recent_congestions(active_users_count, dryrun=args.dryrun)

    today = datetime.utcnow().replace(tzinfo=pytz.utc)
    yesterday = today - timedelta(days=1)
    today_date = datetime(today.year, today.month, today.day)
    yesterday_date = datetime(yesterday.year, yesterday.month, yesterday.day)
    yesterday_str = yesterday_date.strftime("%Y %m/%d")

    try:
        yesterday_status, created = DailySystemStatus.get_or_create(created=yesterday_date)
    except Exception as e:
        logger.error(red(f"Failed to fetch yesterday daily system status: {e}"))

    try:
        general_status, _ = GeneralSystemStatus.get_or_create()
    except Exception as e:
        logger.error(red(f"Failed to fetch general system status: {str(e)}"))

    subject = f"Daily System Report 【{yesterday_str}】\n\n"
    mail_text = mail_template(subject, 
        new_users_count, new_materials_count, daily_active_users_count, active_users_count, total_usage_count,
        daily_system_statuses_with_congestion,
        yesterday_status,
        general_status)
    logger.debug(f'-------------------------------------------------------')
    logger.debug(f'[Subject] {subject}')
    logger.debug(f'[Text]\n{mail_text}')
    logger.debug(f'-------------------------------------------------------')
    send_mail(subject, mail_text)

    # clean orphan data
    delete_orphan_material()
    delete_orphan_chatdata()