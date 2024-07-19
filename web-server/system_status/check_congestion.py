import time
import datetime
import sys

# Logger
sys.path.append('../')
sys.path.append('/src/quantz-web/web-server') 
from libcommon.logger import Logger
from libcommon.color import *
logger = Logger('check_congestion.py')
logger.setLevel(logger.DEBUG)

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    'CONGESTION_CHECK_INTERVAL_SEC',
    'CONGESTION_THRESHOLD',
    'CONGESTION_TIMEFRAME_SEC',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER
CONGESTION_CHECK_INTERVAL_SEC = Config.CONGESTION_CHECK_INTERVAL_SEC
CONGESTION_THRESHOLD = Config.CONGESTION_THRESHOLD
CONGESTION_TIMEFRAME_SEC = Config.CONGESTION_TIMEFRAME_SEC

# MongoDB
from init_mongodb import connect
from system_status.models.system_status import DailySystemStatus, GeneralSystemStatus, Congestion

# Access DB
from accessdb.access_record_manager import init_access_record_manager

access_record_manager = init_access_record_manager(
    host=REDIS_ACCESS_HOST,
    port=REDIS_ACCESS_PORT,
    db_number=REDIS_ACCESS_DB_NUMBER
)

def check_congestion():
    """Find any pair's time is within the timeframe, if any is_congestion is true.

    First sort all records by the time, and see the interval ms between each records.
    If the interval is within the TIMEFRAME_MS, they are congested.
    if is_congestion is true, create Congestion object and save as DailySystemStatus
    The DailySystemStatus is newly saved if there's no data for the date.
    Group records by host_id to check congestion per host
    """
    logger.info('-'*80)
    logger.info(magenta(f'[{datetime.datetime.now().strftime("%m/%d %H:%M:%S")}] Start checking congestion.'))

    today = datetime.datetime.utcnow().date()
    today_date = datetime.datetime(today.year, today.month, today.day)
    try:
        daily_status, created = DailySystemStatus.get_or_create(created=today_date)
        if created:
            logger.info(light_green(f'DailySystemStatus for {today} not found. Successfully created.'))
        else:
            logger.info(cyan(f'DailySystemStatus for {today} found.'))
        logger.info(daily_status.response_json())
    except Exception as e:
        logger.error(red(f'Failed to get_or_create DailyStatus: {e}'))

    # last 5 seconds records
    latest_records = access_record_manager.get_latest_access_log(last_ms=CONGESTION_CHECK_INTERVAL_SEC*1000)
    if not latest_records:
        logger.info(yellow("No access records retrieved. done."))
        return
    else:
        logger.info(light_green(f"{len(latest_records)} access records found."))

    # Sort records by access_time
    sorted_records = sorted(latest_records, key=lambda x: x.access_time)

    # Check for congestion in the sorted list
    congestions = []
    for i in range(len(sorted_records) - 1):
        # Check if the next record is within 0.5 seconds of the current one
        one = sorted_records[i + 1]
        another = sorted_records[i]
        if (one.access_time - another.access_time <= 0.5) and (one.client_id != another.client_id):
            start_time = sorted_records[i].access_time
            end_time = sorted_records[i + 1].access_time
            host_ids = [sorted_records[i].host_id, sorted_records[i + 1].host_id]
            logger.info(bold(f"Congestion detected from {start_time} to {end_time} for hosts {host_ids}"))

            try:
                new_congestion = Congestion(
                    start_time=start_time,
                    end_time=end_time,
                    host_ids=host_ids
                )
                new_congestion.save()
                logger.info(cyan("New congestion saved."))
                logger.info(new_congestion.response_json())
            except Exception as e:
                logger.error(red(f'Failed to save congestion: {e}'))

            congestions += [new_congestion]

    if congestions:
        try:
            daily_status.congestions.append(new_congestion)
            daily_status.save()
            logger.info(cyan("DailySystemStatus updated with congestions."))
            logger.info(daily_status.response_json())
        except Exception as e:
            logger.error(red(f'Failed to update DailySystemStatus: {e}'))

        # Update general system status
        try:
            general_status = GeneralSystemStatus.objects.first()
            if not general_status:
                general_status = GeneralSystemStatus()
            general_status.is_signup_restricted = True
            general_status.save()
            logger.info(cyan("GeneralSystemStatus updated with signup restrictions due to congestion."))
            logger.info(general_status.response_json())
        except Exception as e:
            logger.error(red(f'Failed to update GeneralSystemStatus: {e}'))
    else:
        logger.info(light_green("No congestion detected in the latest check."))

while True:
    check_congestion()
    time.sleep(CONGESTION_CHECK_INTERVAL_SEC)