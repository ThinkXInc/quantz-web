import argparse
from datetime import datetime
from host_manager import HostManager, OriginData
from access_record_manager import AccessRecordManager

# Set logger
from libcommon.logger import Logger
logger = Logger('config.py')
logger.setLevel(logger.DEBUG)
from libcommon.color import *


import os
from os.path import dirname, abspath, join
from dotenv import load_dotenv

PRJ_ROOT = dirname(dirname(dirname(abspath(__file__))))
DOTENV_PATH = join(PRJ_ROOT, '.env')
REQUIRED_KEYS_IN_DOTENV = [
"REDIS_ACCESS_HOST",
"REDIS_ACCESS_PORT",
"REDIS_ACCESS_DB_NUMBER"
]
if os.path.exists(DOTENV_PATH):
    load_dotenv(DOTENV_PATH)
    missing_keys = [key for key in REQUIRED_KEYS_IN_DOTENV if key not in os.environ]
    if missing_keys:
        raise MissingKeyError(red(f"Missing keys in .env file: {', '.join(missing_keys)}"))
else:
    print(red('[WARNING] no .env file exists in {}'.format(DOTENV_PATH)))

REDIS_HOST = os.environ.get("REDIS_ACCESS_HOST")
REDIS_PORT = os.environ.get("REDIS_ACCESS_PORT")
REDIS_DB_NUMBER = os.environ.get("REDIS_ACCESS_DB_NUMBER")
USE_UNIX_SOCKET = False


# Prepare origin data based on your configuration
origins_data = [
    OriginData(origin="localhost", host_id="a123456789abcdef12345678", monthly_limit=1000),
    OriginData(origin="quantz.thinkxinc.com", host_id="b23456789abcdef123456789", monthly_limit=9999999999999999),
    OriginData(origin="interviews:670dcf37aa9bfc2db50d1574", host_id="", monthly_limit=9999999999999999999999999999999999999999),
    OriginData(origin="rakuten.com/shop/1", host_id="c3456789abcdef1234567890", monthly_limit=20),
]

def init_hosts():
    host_manager = HostManager(host=REDIS_HOST, port=REDIS_PORT, db_number=REDIS_DB_NUMBER)
    for origin_data in origins_data:
        host_manager.set_host(
            origin_data.origin, origin_data.host_id, origin_data.monthly_limit,
            host_manager.ensure_utc(datetime.utcnow()), 
            host_manager.ensure_utc(datetime.utcnow()) 
            )
        print(f"Initialized {origin_data.origin} with limit {origin_data.monthly_limit}")

def flush_hosts():
    host_manager = HostManager(host=REDIS_HOST, port=REDIS_PORT, db_number=REDIS_DB_NUMBER)
    # Fetch all keys that start with "host:"
    host_keys = host_manager.redis.keys("host:*")
    number_of_keys = len(host_keys)
    print(f"Are you sure you want to delete {number_of_keys} records of 'host:' in {REDIS_HOST}:{REDIS_PORT}?")
    response = input("Type 'yes' to confirm: ")
    if response.lower() == 'yes':
        for key in host_keys:
            host_manager.redis.delete(key)
            print(f"Flushed data for {key.decode('utf-8')}")
    else:
        print("Deletion canceled.")

def flush_access_records():
    access_record_manager = AccessRecordManager(host=REDIS_HOST, port=REDIS_PORT, db_number=REDIS_DB_NUMBER)
    access_keys = access_record_manager.redis.keys("access_log:*")
    number_of_keys = len(access_keys)
    print(f"Are you sure you want to delete {number_of_keys} access log records from {REDIS_HOST}:{REDIS_PORT}?")
    response = input("Type 'yes' to confirm: ")
    if response.lower() == 'yes':
        total_deleted = 0
        for key in access_keys:
            access_record_manager.redis.delete(key)
            print(f"Flushed data for {key.decode('utf-8')}")
            total_deleted += 1
        print(f"Completed flushing all access records. Total deleted: {total_deleted}")
    else:
        print("Deletion canceled.")

def flush_usage():
    access_record_manager = AccessRecordManager(host=REDIS_HOST, port=REDIS_PORT, db_number=REDIS_DB_NUMBER)
    usage_keys = access_record_manager.redis.keys("host_usage:*")
    number_of_keys = len(usage_keys)
    print(f"Are you sure you want to delete {number_of_keys} host usage records from {REDIS_HOST}:{REDIS_PORT}?")
    response = input("Type 'yes' to confirm: ")
    if response.lower() == 'yes':
        total_deleted = 0
        for key in usage_keys:
            access_record_manager.redis.delete(key)
            print(f"Flushed data for {key.decode('utf-8')}")
            total_deleted += 1
        print(f"Completed flushing all host usage. Total deleted: {total_deleted}")
    else:
        print("Deletion canceled.")


def main():
    parser = argparse.ArgumentParser(description='Manage test data for origin access control.')
    parser.add_argument('--init', action='store_true', help='Initialize origin data with monthly limits')
    parser.add_argument('--flush_hosts', action='store_true', help='Flush all host data from Redis')
    parser.add_argument('--flush_usage', action='store_true', help='Flush all usage data from Redis')
    parser.add_argument('--flush_access', action='store_true', help='Flush all access data from Redis')

    args = parser.parse_args()

    if args.init:
        init_hosts()
    elif args.flush_hosts:
        flush_hosts()
    elif args.flush_usage:
        flush_usage()
    elif args.flush_access:
        flush_access_records()

if __name__ == "__main__":
    main()
