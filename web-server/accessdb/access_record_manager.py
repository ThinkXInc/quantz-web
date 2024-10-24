import json
import time
import redis
from redis import Redis, ConnectionPool
from datetime import datetime
from dataclasses import dataclass, field, fields
from typing import Dict, List, Any

import sys
sys.path.append('../')

# logger
from libcommon.logger import Logger
logger = Logger('access_record_manager.py')
logLevel = logger.INFO
logger.setLevel(logLevel)
from libcommon.color import *

from accessdb.host_manager import HostManager, OriginData

@dataclass
class AccessRecord:
    host_id: int = 0
    origin: str = ''
    access_time: float = field(default_factory=time.time)
    ip: str = ''
    client_id: str = ''

    def to_redis(self) -> Dict[str, Any]:
        return {field.name: getattr(self, field.name) for field in fields(self)}

    @staticmethod
    def from_redis(data: Dict[str, str]) -> 'AccessRecord':
        return AccessRecord(
            host_id=data.get('host_id', ''),
            origin=data.get('origin', ''),
            access_time=float(data.get('access_time', 0.0)),
            ip=data.get('ip', ''),
            client_id=data.get('client_id', ''),
        )

def init_access_record_manager(host, port, db_number, max_connections=10, use_unix_socket=False, unix_socket_path=None):
    try:
        access_record_manager = AccessRecordManager(
            host=host,
            port=port,
            db_number=db_number,
            max_connections=max_connections,
            use_unix_socket=use_unix_socket,
            unix_socket_path=unix_socket_path
        )
        logger.info(green("AccessRecordManager initialized successfully."))
        return access_record_manager
    except Exception as e:
        logger.error(red("Failed to initialize AccessRecordManager: " + str(e)))
        raise

class AccessRecordManager:
    def __init__(self, host: str, port: int, db_number: int, max_connections: int = 10, use_unix_socket: bool = False, unix_socket_path: str = ''):
        """
        Initialize AccessRecordManager class with a Redis connection pool.
        """
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

    def write_access_log(self, host_id: str, ip: str, client_id: str):
        """
        Log an access attempt by origin, IP address, and client ID.

        Args:
            ip (str): IP address of the client.
            client_id (str): Client ID of the user.
        """
        try:
            host_manager = HostManager(self.host, self.port, self.db_number, self.use_unix_socket, self.redis_address)  
            host = host_manager.get_host(host_id)
            if not host:
                logger.error(red(f"Host not found for host_id: {host_id}"))
                return  

            access_record = AccessRecord(host_id=host.host_id, origin=origin, ip=ip, client_id=client_id, access_time=time.time())
            serialized_record = json.dumps(access_record.to_redis())

            # Use timestamp as the score for the sorted set
            score = access_record.access_time
            self.redis.zadd(f"access_log::ip::{ip}", {serialized_record: score})
            self.redis.zadd(f"access_log::client_id::{client_id}", {serialized_record: score})
            logger.debug(green(f"Logged access for IP: {ip}, Client ID: {client_id}, and Origin: {origin}"))
        except Exception as e:
            logger.error(red(f"Error logging access for IP {ip} and Client ID {client_id}: {e}"))

    def get_latest_access_log(self, last_ms: int) -> List[AccessRecord]:
        """
        Retrieve all AccessRecords from the last specified milliseconds.

        Args:
            last_ms (int): Milliseconds ago to start fetching records from.

        Returns:
            List[AccessRecord]: List of access records.
        """
        try:
            current_time_ms = int(time.time() * 1000)
            start_time_ms = current_time_ms - last_ms
            logger.debug(f"Current time ms: {current_time_ms}, Start time ms: {start_time_ms}")

            records = []

            key_pattern = "access_log::client_id::*"
            for key in self.redis.scan_iter(match=key_pattern):
                all_records_with_scores = self.redis.zrange(key, 0, -1, withscores=True)
                logger.debug(f"Inspecting key: {key.decode()}, Total records: {len(all_records_with_scores)}")

                for record, score in all_records_with_scores:
                    logger.debug(f"Record: {record.decode()}, Score: {score}")

                serialized_records = self.redis.zrangebyscore(key, start_time_ms, '+inf')
                logger.debug(f"Key: {key.decode()}, Records found: {len(serialized_records)}")

                for record in serialized_records:
                    try:
                        decoded_record = json.loads(record.decode('utf-8'))
                        records.append(AccessRecord.from_redis(decoded_record))
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error: {e}")
                    except Exception as e:
                        logger.error(f"Error processing record: {e}")

            logger.info(light_green(f'{len(records)} latest access records found in last {last_ms} ms.'))
            return records
        except Exception as e:
            logger.error(red(f"Error retrieving access records from the last {last_ms} milliseconds: {e}"))
            return []

    def get_access_log_by_ip(self, ip: str, last_ms: int = None) -> List[AccessRecord]:
        """
        Retrieve access log for a specific IP address using a sorted set, optionally within the last specified milliseconds.

        Args:
            ip (str): IP address to retrieve access log for.
            last_ms (int, optional): Milliseconds ago to start fetching records from. Default is None, fetching all records.

        Returns:
            List[AccessRecord]: List of access records.
        """
        try:
            key = f"access_log::ip::{ip}"
            if last_ms is not None:
                current_time_ms = int(time.time() * 1000)
                start_time_ms = current_time_ms - last_ms
                serialized_records = self.redis.zrangebyscore(key, start_time_ms, '+inf')
            else:
                serialized_records = self.redis.zrange(key, 0, -1)

            return [AccessRecord.from_redis(json.loads(record.decode('utf-8'))) for record in serialized_records]
        except Exception as e:
            logger.error(red(f"Error retrieving access log for IP {ip}: {e}"))
            return []

    def get_access_log_by_client_id(self, client_id: str, last_ms: int = None) -> List[AccessRecord]:
        """
        Retrieve access log for a specific client ID using a sorted set, optionally within the last specified milliseconds.

        Args:
            client_id (str): Client ID to retrieve access log for.
            last_ms (int, optional): Milliseconds ago to start fetching records from. Default is None, fetching all records.

        Returns:
            List[AccessRecord]: List of access records.
        """
        try:
            key = f"access_log::client_id::{client_id}"
            if last_ms is not None:
                current_time_ms = int(time.time() * 1000)
                start_time_ms = current_time_ms - last_ms
                serialized_records = self.redis.zrangebyscore(key, start_time_ms, '+inf')
            else:
                serialized_records = self.redis.zrange(key, 0, -1)

            return [AccessRecord.from_redis(json.loads(record.decode('utf-8'))) for record in serialized_records]
        except Exception as e:
            logger.error(red(f"Error retrieving access log for Client ID {client_id}: {e}"))
            return []

    def check_rate_limit(self, client_id: str, time_range: int, limit: int) -> bool:
        """
        Check if a client ID has exceeded a specified rate limit using sorted sets in Redis.

        Args:
            client_id (str): Client ID to check rate limit for.
            time_range (int): Time range in seconds to consider for rate limiting.
            limit (int): Number of allowed accesses within the time range.

        Returns:
            bool: True if the rate limit has been exceeded, False otherwise.
        """
        try:
            current_time = time.time()
            start_time = current_time - time_range
            key = f"access_log::client_id::{client_id}"

            # Fetch records from sorted set within the given time range
            count = self.redis.zcount(key, start_time, current_time)
            return count > limit
        except Exception as e:
            logger.error(red(f"Error checking rate limit for Client ID {client_id}: {e}"))
            return True


