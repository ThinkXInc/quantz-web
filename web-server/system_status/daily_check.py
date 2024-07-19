import time
from datetime import datetime, timedelta
import pytz
import sys

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
    'REDIS_ACCESS_DB_NUMBER'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER

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

        total_usage = host_manager.count_usage_in_period(start_timestamp, end_timestamp, origin='*')
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

def daily_check():
    """
    - The number of new registrations
    - The number of times used
    - The number of users used in the day
    - The number of Active users (used at least once in the past 3 days)
    - the number of saved Materials
    are aggregated and reported by e-mail.
    """
    logger.info('-'*80)
    logger.info(magenta(f'[{datetime.now().replace(tzinfo=pytz.utc).strftime("%m/%d %H:%M:%S")}] Start daily check.'))

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
    users_used_count = num_users_used() 
    active_users_count = num_active_users() 
    new_materials_count = num_new_materials()

    # Log summary of all gathered statistics
    logger.info('\n\n')
    logger.info('-'*80)
    logger.info(light_blue("Summary of Daily Statistics:"))
    logger.info(yellow(f"Total new users today: {new_users_count}"))
    logger.info(yellow(f"Total usage counts today: {total_usage_count}"))
    logger.info(yellow(f"Number of active users today: {users_used_count}"))
    logger.info(yellow(f"Number of active users (last 3 days): {active_users_count}"))
    logger.info(yellow(f"Number of new materials saved today: {new_materials_count}"))


daily_check()