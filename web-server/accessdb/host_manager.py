import time
import json
from urllib.parse import urlparse
from datetime import datetime, timedelta
from pydantic import BaseModel
from redis import Redis, ConnectionPool
import pytz
from dataclasses import dataclass, field, fields
from typing import Dict, Optional, List, Tuple, Any

import sys
sys.path.append('../')

# logger
from libcommon.logger import Logger
logger = Logger('host_manager.py')
logLevel = logger.DEBUG
logger.setLevel(logLevel)
from libcommon.color import *

class HostSettingError(Exception):
    pass

class OriginData(BaseModel):
    origin: str
    host_id: str
    monthly_limit: int

@dataclass
class Host:
    origin: str = ''
    host_id: str = ''
    monthly_limit: int = 0
    start_billing: datetime = field(default_factory=datetime.now(pytz.utc))
    next_billing: datetime = field(default_factory=datetime.now(pytz.utc))
    suspend: bool = False

    def to_redis(self) -> Dict[str, Any]:
        return {
            'origin': self.origin,
            'host_id': self.host_id,
            'monthly_limit': self.monthly_limit,
            'start_billing': self.start_billing.isoformat(),
            'next_billing': self.next_billing.isoformat(),
            'suspend': self.suspend
        }

    @staticmethod
    def from_redis(data: Dict[str, str]) -> 'Host':
        return Host(
            origin=data.get('origin', ''),
            host_id=data.get('host_id', ''),
            monthly_limit=int(data.get('monthly_limit', '0')),
            start_billing=datetime.fromisoformat(data.get('start_billing', datetime.now(pytz.utc).isoformat())),
            next_billing=datetime.fromisoformat(data.get('next_billing', datetime.now(pytz.utc).isoformat())),
            suspend=data.get('suspend', 'False') == 'True'
        )

def init_host_manager(host, port, db_number, max_connections=10, use_unix_socket=False, unix_socket_path=None):
    try:
        host_manager = HostManager(
            host=host,
            port=port,
            db_number=db_number,
            max_connections=max_connections,
            use_unix_socket=use_unix_socket,
            unix_socket_path=unix_socket_path
        )
        logger.info(green("HostManager initialized successfully."))
        return host_manager
    except Exception as e:
        logger.error(red("Failed to initialize HostManager: " + str(e)))
        raise

class HostManager:
    def __init__(self, host: str, port: int, db_number: int, max_connections: int = 10, use_unix_socket: bool = False, unix_socket_path: str = ''):
        self.host = host
        self.port = port
        self.db_number = db_number
        self.max_connections = max_connections
        self.use_unix_socket = use_unix_socket
        self.unix_socket_path = unix_socket_path
 
        try:
            if use_unix_socket:
                connection_pool = ConnectionPool(unix_socket_path=unix_socket_path, db=db_number, max_connections=max_connections)
                logger.info(light_green(f"Redis connection pool established successfully via Unix socket [path: {unix_socket_path}]"))
            else:
                connection_pool = ConnectionPool(host=host, port=port, db=db_number, max_connections=max_connections)
                logger.info(light_green(f"Redis connection pool established successfully [host: {host}, port: {port}, db: {db_number}]"))
            
            self.redis = Redis(connection_pool=connection_pool)
        except Exception as e:
            logger.error(red(f"Failed to establish Redis connection pool: {e}"))
            raise e

    def set_host(self, origin: str, host_id: str, monthly_limit: int, start_billing: datetime, next_billing: datetime) -> None:
        start_billing = self.ensure_utc(start_billing)
        next_billing = self.ensure_utc(next_billing)

        try:
            host = Host(
                origin=origin,
                host_id=host_id,
                monthly_limit=monthly_limit,
                start_billing=start_billing,
                next_billing=next_billing
            )
            serialized_host = json.dumps(host.to_redis())
            self.redis.set(f"host::{origin}", serialized_host)
            logger.info(green(f"Host set successfully for user ID {host_id} origin {origin} with start billing {start_billing} and next billing {next_billing} host limit {monthly_limit}."))
        except Exception as e:
            logger.error(red(f"Failed to set host for user ID {host_id}. Error: {e}"))
            raise

    def ensure_utc(self, dt: datetime):
        return dt if dt.tzinfo else pytz.utc.localize(dt)

    def get_host(self, origin: str) -> Optional[Host]:
        serialized_host = self.redis.get(f"host::{origin}")
        if serialized_host:
            return Host.from_redis(json.loads(serialized_host.decode('utf-8')))
        return None

    def set_host_usage_limit(self, origin: str, max_accesses: int):
        """
        Set the maximum number of accesses allowed for a host in a month.

        Args:
            origin (str): Origin or host ID.
            max_accesses (int): Maximum number of allowed accesses.
        """
        try:
            host = self.get_host(origin)
            if host:
                host.monthly_limit = max_accesses
                self.set_host(host.origin, host.host_id, host.monthly_limit)
        except Exception as e:
            logger.error(red(f"Error setting host usage limit for {origin}: {e}"))

    def increment_host_usage(self, origin: str):
        """
        Increment the usage count for a host, recording each access with a timestamp.
        """
        try:
            timestamp = int(datetime.now(pytz.utc).timestamp())
            key = f"host_usage::{origin}::{timestamp}"
            self.redis.incr(key)  # Use INCR to increment count; you might alternatively use a list or set if counting isn't needed.
            logger.debug(green(f"Incremented host usage for {origin} at {timestamp}"))
        except Exception as e:
            logger.error(red(f"Error incrementing host usage for {origin}: {e}"))

    def set_host_usage(self, origin: str, usage: int):
        """
        Set the usage count for a host to a specified value.
        
        Args:
            origin (str): The origin identifier for the host.
            usage (int): The usage count to set for the host.
        """
        try:
            timestamp = int(datetime.now(pytz.utc).timestamp())
            key = f"host_usage::{origin}::{timestamp}"
            self.redis.set(key, usage)
            logger.debug(green(f"Set host usage -> origin:{origin} usage:{usage} timestamp:{timestamp}"))
        except Exception as e:
            logger.error(red(f"Error setting host usage for {origin}: {e}"))

    def delete_host(self, origin: str) -> None:
        """
        Delete a host's data from Redis.
    
        Args:
            origin (str): The origin identifier for the host to be deleted.
        """
        try:
            key = f"host::{origin}"
            result = self.redis.delete(key)
            if result:
                logger.info(green(f"Host successfully deleted for origin {origin}."))
            else:
                logger.warning(yellow(f"No host found for origin {origin}, nothing to delete."))
        except Exception as e:
            logger.error(red(f"Error deleting host for origin {origin}: {e}"))
            raise

    def delete_host_usage(self, origin: str, start_timestamp: int, end_timestamp: int):
        """
        Clear the usage data for a host within a specific period.
        
        Args:
            origin (str): The origin identifier for the host.
            start_timestamp (int): The start of the period (UNIX timestamp).
            end_timestamp (int): The end of the period (UNIX timestamp).
        """
        start_date = datetime.utcfromtimestamp(start_timestamp).strftime('%Y-%m-%d %H:%m')
        end_date = datetime.utcfromtimestamp(end_timestamp).strftime('%Y-%m-%d %H:%m')

        try:
            # Generate keys pattern for the given period
            keys_pattern = f"host_usage::{origin}::*"
            keys = self.redis.keys(keys_pattern)
            deleted_count = 0
            logger.debug(f"Initiating clearing keys for origin {origin} between {start_date} ~ {end_date}")

            for key in keys:
                key_str = key.decode('utf-8')
                _, _, key_timestamp = key_str.rpartition('::')
                if start_timestamp <= int(key_timestamp) <= end_timestamp:
                    self.redis.delete(key)
                    deleted_count += 1
                    logger.debug(f"Deleted key {key_str} for origin {origin}")

            logger.info(green(f"{deleted_count} keys deleted for origin {origin} in the specified period."))
        except Exception as e:
            logger.error(f"Error clearing host usage for {origin}: {e}")

    def count_usage_in_period(self, start_timestamp: int, end_timestamp: int, origin='*'):
        """Retrieve the number of accesses for a host or all hosts within a specific billing period."""
        try:
            # Format the start and end dates
            start_date = datetime.utcfromtimestamp(start_timestamp).strftime('%Y-%m-%d %H:%M')
            end_date = datetime.utcfromtimestamp(end_timestamp).strftime('%Y-%m-%d %H:%M')

            # Generate the Redis key pattern for the given period and origin
            keys_pattern = f"host_usage::{origin}::*"
            keys = self.redis.keys(keys_pattern)
            usage_count = 0
            logger.debug(f"Checking keys for origin pattern {origin} ({start_date} ~ {end_date})")

            for key in keys:
                key_str = key.decode('utf-8')
                _, _, key_timestamp = key_str.rpartition('::')
                key_timestamp = int(key_timestamp)
                if start_timestamp <= key_timestamp <= end_timestamp:
                    count = int(self.redis.get(key))
                    usage_count += count
                    logger.debug(f"Usage retrieved -> key:{key.decode('utf-8')} usage:{count}")

            logger.info(yellow(f"Total usage for origin pattern '{origin}' in the period: \n{usage_count} ({start_date} ~ {end_date})"))
            return usage_count
        except Exception as e:
            logger.error(red(f"Error retrieving usage for origin pattern:{origin} ({start_date} ~ {end_date}): {e}"))
            return 0

    def retrieve_usage_for_billing_period(self, origin: str, start_timestamp: int, end_timestamp: int):
        """
        Retrieve the number of accesses for a host within a specific billing period.
        """
        return self.count_usage_in_period(start_timestamp, end_timestamp, origin)

    def is_host_usage_exceeded(self, origin: str) -> bool:
        """
        Check if the current host usage has exceeded the set limit within the billing period.
        """
        try:
            host = self.get_host(origin)
            if not host:
                logger.debug(f"No host settings found for {origin}")
                return False

            start_timestamp = int(host.start_billing.timestamp())
            end_timestamp = int(host.next_billing.timestamp())
            usage_count = self.retrieve_usage_for_billing_period(origin, start_timestamp, end_timestamp)

            logger.debug(f"Usage for {origin} from {host.start_billing} to {host.next_billing}: {usage_count}/{host.monthly_limit}")
            return usage_count > host.monthly_limit
        except Exception as e:
            logger.error(red(f"Error checking if host usage is exceeded for {origin}: {e}"))
            return False

    def get_all_origins(self) -> List[str]:
        """
        Retrieve all origins from the stored Host instances.

        Returns:
            List[str]: A list of all host origins.
        """
        try:
            origin_keys = self.redis.keys('host::*')
            origins = [key.decode('utf-8').split('::', 1)[1] for key in origin_keys]
            logger.info(green(f"Successfully retrieved all host origins. {origins}"))
            return origins
        except Exception as e:
            logger.error(red(f"Error retrieving all host origins: {e}"))
            raise e

    @staticmethod
    def normalize_origin(origin: str) -> str:
        """
        Normalize the origin by removing the scheme ('http' or 'https') and port, but keep the URL as is if there's a path.
        This function treats 'http://a.com', 'https://a.com', and 'http://a.com:8000' as 'a.com',
        but will return 'a.com/page/list' as is.
    
        Args:
            origin (str): The origin URL to normalize.
    
        Returns:
            str: The normalized origin, keeping paths intact if present.
        """
        parsed_url = urlparse(origin)
    
        # If there's a path, query, or fragment, return the URL as is (preserving the path and ignoring scheme and port)
        if parsed_url.path not in ['', '/'] or parsed_url.query or parsed_url.fragment:
            netloc = parsed_url.hostname or ''
            # Directly return the concatenated string without re-parsing
            return netloc + parsed_url.path + (('?' + parsed_url.query) if parsed_url.query else '') + (('#' + parsed_url.fragment) if parsed_url.fragment else '')
    
        # If there's no path, query, or fragment, return the hostname
        return parsed_url.hostname if parsed_url.hostname else origin.split('/')[0].split(':')[0]
    

    def allowed_origins(self):
        """
        Return normalized allowed origins.
        """
        allowed_origins = [self.normalize_origin(o) for o in self.get_all_origins()]
        return allowed_origins
    

    def is_allowed_origin(self, origin: str) -> bool:
        """
        Check if every origin in origins_data is listed in the allowed origins from HostManager,
        disregarding scheme and port in the comparison.
    
        Args:
            host_manager (HostManager): The HostManager instance to interact with Redis.
            origins_data (List[OriginData]): The list of origin data to verify against the allowed list.
        """
        allowed_origins = self.allowed_origins()
        print(f"found {len(allowed_origins)} allowed origins. {allowed_origins}")
    
        print(bold(f'check {origin}'))
        normalized_origin = self.normalize_origin(origin)
        if normalized_origin not in allowed_origins:
            print(yellow(f"{origin} (normalized to {normalized_origin}) is NOT in the allowed list."))
            return False
        else:
            print(cyan(f"{origin} (normalized to {normalized_origin}) is in the allowed list."))
            return True

    def set_suspend(self, origin: str, suspend: bool) -> None:
        """
        Set the suspension state of the host.

        Args:
            origin (str): The origin of the host to modify.
            suspend (bool): True to suspend the host, False to unsuspend.

        Raises:
            HostSettingError: If the host does not exist.
        """
        host = self.get_host(origin)
        if host:
            host.suspend = suspend
            serialized_host = json.dumps(host.to_redis())
            self.redis.set(f"host::{origin}", serialized_host)
            logger.info(green(f"Suspension state set for {origin}. Now suspended: {suspend}"))
        else:
            logger.error(red(f"Host not found for origin: {origin}"))
            raise HostSettingError("Host not found.")

    def is_host_suspended(self, origin: str) -> bool:
        """
        Check if the host is suspended.
        """
        host = self.get_host(origin)
        if host:
            return host.suspend
        else:
            logger.error(red(f"Host not found for origin: {origin}"))
            raise HostSettingError("Host not found.")