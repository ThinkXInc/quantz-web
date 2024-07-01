from redis import ConnectionPool

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    'RABBITMQ_WEB_USER',
    'RABBITMQ_WEB_HOST',
    'RABBITMQ_WEB_PORT',
    'RABBITMQ_WEB_PASSWORD',
    'REDIS_RESULTS_WEB_HOST',
    'REDIS_RESULTS_WEB_PORT',
    'REDIS_RESULTS_WEB_DB_NUMBER',
    'REDIS_RESULTS_WEB_LOGLEVEL',
    'REDIS_RESULTS_WEB_EXPIRATION_TIME_SEC'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

# RabbitMQ Broker settings
RABBITMQ_USER = Config.RABBITMQ_WEB_USER
RABBITMQ_HOST = Config.RABBITMQ_WEB_HOST
RABBITMQ_PORT = Config.RABBITMQ_WEB_PORT
RABBITMQ_PASSWORD = Config.RABBITMQ_WEB_PASSWORD
broker_url = f'amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}//'
#broker_url = 'amqp://guest:guest@192.168.1.9//'

# Redis as Result Backend
REDIS_HOST = Config.REDIS_RESULTS_WEB_HOST
REDIS_PORT = Config.REDIS_RESULTS_WEB_PORT
REDIS_DB_NUMBER = Config.REDIS_RESULTS_WEB_DB_NUMBER
REDIS_EXPIRATION_TIME_SEC = Config.REDIS_RESULTS_WEB_EXPIRATION_TIME_SEC
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

# Retry broker connection on startup
# NOTE: automatically retrying broker connections on startup (useful in environments where the broker might not be immediately available when the Celery worker starts)
broker_connection_retry_on_startup = True