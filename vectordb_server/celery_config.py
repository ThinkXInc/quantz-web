from redis import ConnectionPool

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    'RABBITMQ_VECTORDB_USER',
    'RABBITMQ_VECTORDB_USER',
    'RABBITMQ_VECTORDB_HOST',
    'RABBITMQ_VECTORDB_PORT',
    'RABBITMQ_VECTORDB_PASSWORD',
    'REDIS_RESULTS_VECTORDB_HOST',
    'REDIS_RESULTS_VECTORDB_PORT',
    'REDIS_RESULTS_VECTORDB_LOGLEVEL',
    'REDIS_RESULTS_VECTORDB_DB_NUMBER',
    'REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

# RabbitMQ Broker settings
RABBITMQ_USER = Config.RABBITMQ_VECTORDB_USER
RABBITMQ_HOST = Config.RABBITMQ_VECTORDB_HOST
RABBITMQ_PORT = Config.RABBITMQ_VECTORDB_PORT
RABBITMQ_PASSWORD = Config.RABBITMQ_VECTORDB_PASSWORD
broker_url = f'amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}//'

# Redis as Result Backend
REDIS_HOST = Config.REDIS_RESULTS_VECTORDB_HOST
REDIS_PORT = Config.REDIS_RESULTS_VECTORDB_PORT
REDIS_DB_NUMBER = Config.REDIS_RESULTS_VECTORDB_DB_NUMBER
REDIS_EXPIRATION_TIME_SEC = Config.REDIS_RESULTS_VECTORDB_EXPIRATION_TIME_SEC
redis_url = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB_NUMBER}'
redis_pool = ConnectionPool.from_url(redis_url, max_connections=10)
result_backend = redis_url
result_backend_transport_options = {
    'socket_timeout': 15,  
    'retry_on_timeout': True,
    'pool': redis_pool,
    'expires': REDIS_EXPIRATION_TIME_SEC
}

# Serialization
task_serializer = 'msgpack'
result_serializer = 'msgpack'
accept_content = ['msgpack']

# Concurrency settings
worker_prefetch_multiplier = 1  # This setting controls the number of tasks a worker prefetches to be ready for execution. Prefetching means that the worker pulls tasks from the queue before it finishes the execution of current tasks. 
worker_concurrency = 1#4  # This setting determines the number of concurrent worker processes/threads executing tasks.

# Logging settings
worker_log_format = '[%(asctime)s: %(levelname)s/%(processName)s: %(name)s] %(message)s'
worker_log_color = False
worker_hijack_root_logger = False
task_track_started=True
worker_redirect_stdouts=False
worker_send_task_events=True
worker_pool_restarts=True
broker_heartbeat=10  # Adjust as needed
broker_heartbeat_checkrate=2.0

# Retry broker connection on startup
# NOTE: automatically retrying broker connections on startup (useful in environments where the broker might not be immediately available when the Celery worker starts)
broker_connection_retry_on_startup = True