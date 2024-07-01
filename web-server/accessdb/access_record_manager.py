import json
import time
import redis
from datetime import datetime
from dataclasses import dataclass, field, fields
from typing import Dict, List, Any

import sys
sys.path.append('../')

# logger
from libcommon.logger import Logger
logger = Logger('access_record_manager.py')
logLevel = logger.DEBUG
logger.setLevel(logLevel)
from libcommon.color import *

from accessdb.host_manager import HostManager, OriginData

@dataclass
class AccessRecord:
    origin: str = ''
    host_id: int = 0
    access_time: float = field(default_factory=time.time)
    ip: str = ''
    client_id: str = ''

    def to_redis(self) -> Dict[str, Any]:
        return {field.name: getattr(self, field.name) if not isinstance(getattr(self, field.name), str) else str(getattr(self, field.name)) for field in fields(self)}

    @staticmethod
    def from_redis(data: Dict[str, str]) -> 'AccessRecord':
        return AccessRecord(
            origin=data.get('origin', ''),
            host_id=int(data.get('host_id', 0)),
            access_time=float(data.get('access_time', 0.0)),
            ip=data.get('ip', ''),
            client_id=data.get('client_id', ''),
        )

class AccessRecordManager:
    def __init__(self, host: str, port: int, db_number: int, use_unix_socket=False, redis_address=''):
        """
        Initialize AccessTable class with a Redis connection.
        """
        self.host = host
        self.port = port
        self.db_number = db_number
        self.use_unix_socket = use_unix_socket
        self.redis_address = redis_address
        try:
            if use_unix_socket:
                self.redis = redis.Redis(unix_socket_path=redis_address)
                logger.info(light_green(f"Redis connection established successfully [address: {redis_address}]"))
            else:
                self.redis = redis.Redis(host=host, port=port, db=db_number)
                logger.info(light_green(f"Redis connection established successfully [host: {host} port: {port} db: {db_number}]"))
        except Exception as e:
            logger.error(red(f"Failed to connect to Redis: {e}"))
            raise e

    def write_access_log(self, origin: str, ip: str, client_id: str):
        """
        Log an access attempt by origin, IP address, and client ID.

        Args:
            origin (str): Origin accessed by the client.
            ip (str): IP address of the client.
            client_id (str): Client ID of the user.
        """
        try:
            # Fetch the host ID based on the origin
            host_manager = HostManager(
                self.host, self.port, self.db_number, self.use_unix_socket, self.redis_address)  # Adjust parameters as needed
            host = host_manager.get_host(origin)
            if not host:
                logger.error(red(f"Host not found for origin: {origin}"))
                return  # Exit if host ID is not found to prevent logging without host ID

            access_record = AccessRecord(origin=origin, host_id=host.host_id, ip=ip, client_id=client_id, access_time=time.time())
            serialized_record = json.dumps(access_record.to_redis())

            self.redis.rpush(f"access_log::ip::{ip}", serialized_record)
            self.redis.rpush(f"access_log::client_id::{client_id}", serialized_record)
            logger.debug(green(f"Logged access for IP: {ip}, Client ID: {client_id}, and Origin: {origin}"))
        except Exception as e:
            logger.error(red(f"Error logging access for IP {ip} and Client ID {client_id}: {e}"))


    def get_access_log_by_ip(self, ip: str) -> List[AccessRecord]:
        """
        Retrieve access log for a specific IP address.

        Args:
            ip (str): IP address to retrieve access log for.

        Returns:
            List[AccessRecord]: List of access records.
        """
        try:
            records = self.redis.lrange(f"access_log::ip::{ip}", 0, -1)
            return [AccessRecord.from_redis(json.loads(record.decode('utf-8'))) for record in records]
        except Exception as e:
            logger.error(red(f"Error retrieving access log for IP {ip}: {e}"))
            return []
    
    def get_access_log_by_client_id(self, client_id: str) -> List[AccessRecord]:
        """
        Retrieve access log for a specific client ID.

        Args:
            client_id (str): Client ID to retrieve access log for.

        Returns:
            List[AccessRecord]: List of access records.
        """
        try:
            records = self.redis.lrange(f"access_log::client_id::{client_id}", 0, -1)
            return [AccessRecord.from_redis(json.loads(record.decode('utf-8'))) for record in records]
        except Exception as e:
            logger.error(red(f"Error retrieving access log for Client ID {client_id}: {e}"))
            return []

    def check_rate_limit(self, client_id: str, time_range: int, limit: int) -> bool:
        """
        Check if a client ID has exceeded a specified rate limit.

        Args:
            client_id (str): Client ID to check rate limit for.
            time_range (int): Time range in seconds to consider for rate limiting.
            limit (int): Number of allowed accesses within the time range.

        Returns:
            bool: True if the rate limit has been exceeded, False otherwise.
        """
        try:
            current_time = time.time()
            accesses = self.get_access_log_by_client_id(client_id)
            recent_accesses = [record for record in accesses if current_time - record.access_time <= time_range]
            return len(recent_accesses) > limit
        except Exception as e:
            logger.error(red(f"Error checking rate limit for Client ID {client_id}: {e}"))
            return True

