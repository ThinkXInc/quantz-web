import sys
from datetime import datetime, timedelta
from dataclasses import dataclass

import sys
sys.path.append('../')

# logger
from libcommon.logger import Logger
logger = Logger('accessdb test')
logLevel = logger.DEBUG
logger.setLevel(logLevel)
from libcommon.color import *

from accessdb.access_record_manager import AccessRecord, AccessRecordManager
from accessdb.host_manager import Host, HostManager, OriginData


def cleanup_origin(host_manager: HostManager, access_manager: AccessRecordManager, origin_data: OriginData):
    print(f"Cleaning up test data for host_id: {origin_data.host_id}")
    host_manager.redis.delete(f"host::{origin_data.host_id}")
    host_manager.redis.delete(f"host_usage::{origin_data.host_id}::{datetime.now().strftime('%Y-%m')}")
    host_manager.redis.delete(f"access_log::ip::{ip}")
    host_manager.redis.delete(f"access_log::client_id::{client_id}")

def initialize_origin(host_manager: HostManager, access_manager: AccessRecordManager, origin_data: OriginData):
    # Test logic for the specified origin
    print(f"Testing HostManager for origin: {origin_data.origin}")
    host_manager.set_host(
        origin_data.host_id, origin_data.origin, origin_data.monthly_limit,
        datetime.now(), datetime.now()+timedelta(days=30))
    print(f"Set host: host_id: {origin_data.host_id}, origin: {origin_data.origin}, monthly_limit: {origin_data.monthly_limit}")

    host_manager.increment_host_usage(origin_data.host_id)
    print(f"Incremented usage for host: {origin_data.host_id}")


if __name__ == "__main__":
    host = 'localhost'
    port = 6376
    db_number = 0

    # Initialize managers
    host_manager = HostManager(host=host, port=port, db_number=db_number)
    access_manager = AccessRecordManager(host=host, port=port, db_number=db_number)

    # Test data
    origins_data = [
        OriginData(origin="http://localhost:8080", host_id="1234", monthly_limit=100),
        OriginData(origin="http://quantz.thinkxinc.com:8000", host_id="5555", monthly_limit=10),  # Add more origins as needed
        OriginData(origin="rakuten.com/shop/1", host_id="6666", monthly_limit=5),  # Add more origins as needed
    ]

    ip = "192.168.1.1"
    client_id = "abcd1234"

    def test_rate_limit(host_manager: HostManager, access_manager: AccessRecordManager, origin_data: OriginData, ip: str, client_id: str):

        # Test AccessRecordManager
        print("\nTesting AccessRecordManager...")
        access_manager.write_access_log(origin_data.host_id, ip, client_id)
        print(f"Logged access for IP: {ip} and Client ID: {client_id}")

        # Retrieving access log by IP
        access_log_ip = access_manager.get_access_log_by_ip(ip)
        print(f"Access log for IP {ip}: {access_log_ip}")

        # Retrieving access log by Client ID
        access_log_client_id = access_manager.get_access_log_by_client_id(client_id)
        print(f"Access log for Client ID {client_id}: {access_log_client_id}")

        # Test limit
        # Check rate limit for Client ID
        time_range = 60  # 60 seconds
        limit = 5  # Allow up to 5 accesses within time_range
        rate_limited = access_manager.check_rate_limit(client_id, time_range, limit)
        print(f"Is Client ID {client_id} rate-limited? {'Yes' if rate_limited else 'No'}")

        # Simulating multiple access attempts to exceed the rate limit
        limit = 5  # Let's assume the limit is 5 accesses
        time_range = 60  # Time range in seconds
        for _ in range(limit + 1):  # Log one more access than the limit
            access_manager.write_access_log(origin_data.host_id, ip, client_id)
            print(f"Logged access for IP: {ip} and Client ID: {client_id}")

        # Retrieving access log by Client ID
        access_log_client_id = access_manager.get_access_log_by_client_id(client_id)
        print(f"Access log for Client ID {client_id}: {access_log_client_id}")

        # Check rate limit for Client ID after exceeding the limit
        rate_limited = access_manager.check_rate_limit(client_id, time_range, limit)
        print(cyan(f"Is Client ID {client_id} rate-limited after {limit + 1} accesses? {'Yes' if rate_limited else 'No'}"))


    def test_usage(host_manager: HostManager, origin_data: OriginData):
        # Simulate access increment
        print("Incrementing host usage...")
        for _ in range(10):  # Simulate 10 accesses
            host_manager.increment_host_usage(origin_data.host_id)

        # Retrieving usage for a specific period
        start_timestamp = int((datetime.now() - timedelta(days=1)).timestamp())
        end_timestamp = int(datetime.now().timestamp())
        usage_for_period = host_manager.retrieve_usage_for_billing_period(
            origin_data.host_id, start_timestamp, end_timestamp)
        print(yellow(f"Retrieved usage for billing period: {usage_for_period}"))

        exceeded = host_manager.is_host_usage_exceeded(origin_data.host_id)
        print(cyan(f"Has {origin_data.host_id} exceeded its limit? {'Yes' if exceeded else 'No'}"))

    for origin_data in origins_data:
        print(magenta(f'cleanup origin [{origin_data}] -------------------------------------->'))
        cleanup_origin(host_manager, access_manager, origin_data)
        print(magenta(f'init origin [{origin_data}]  -------------------------------------->'))
        initialize_origin(host_manager, access_manager, origin_data)
        print(magenta(f'test rate limit [{origin_data}]  -------------------------------------->'))
        test_rate_limit(host_manager, access_manager, origin_data, ip, client_id)
        print(magenta(f'test usage [{origin_data}]  -------------------------------------->'))
        test_usage(host_manager, origin_data)
        
    for origin in ["localhost", "thinkxinc.com", "quantz.thinkxinc.com", "https://rakuten.com", "https://rakuten.com/shop/1"]:
        host_manager.is_allowed_origin(origin)