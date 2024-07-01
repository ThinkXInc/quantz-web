import pika
import sys
sys.path.append('../')
#from llm.tasks import create_connection_pool
# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# FIXME: not working

# Connectivity checks
def check_rabbitmq_server(broker_url):
    try:
        parameters = pika.URLParameters(broker_url)
        connection = pika.BlockingConnection(parameters)
        connection.close()
        logger.info(green('Successfully connected to RabbitMQ.'))
        return True
    except pika.exceptions.AMQPConnectionError as e:
        logger.error(red(f'Failed to connect to RabbitMQ: {e}'))
        return False

def check_redis_server(redis_pool):
    try:
        client = Redis(connection_pool=redis_pool)
        if client.ping():
            logger.info(green('Successfully connected to Redis.'))
            return True
    except Exception as e:
        logger.error(red(f'Failed to connect to Redis: {e}'))
        return False

if __name__ == '__main__':
    # Perform checks when worker process is initialized
    if not check_rabbitmq_server(broker_url) or not check_redis_server(redis_pool):
        logger.error(red('Required services are not available. Worker process initialization aborted.'))
        raise RuntimeError('Failed to initialize worker process due to service unavailability.')

