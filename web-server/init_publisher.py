import time
import uuid
from datetime import datetime
# logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# publisher
from llm.queue_server.queue_publisher import QueueConfig, QueuePublisher, QueueConnectionManager
# server
from llm.queue_server.queue_server import Status

should_warmup = True

queue_config = QueueConfig()
connection_manager = QueueConnectionManager(queue_config)
## Start the I/O loop in a separate thread
connection_manager.connect()
time.sleep(1)

# Initialize Publisher
publisher = QueuePublisher(queue_config, connection_manager)

class LLMQueueNotResponseError(Exception):
    pass

# Test Publish
if should_warmup:
    # Check
    try:
        logger.info(green('LLM publisher get connection..'))
        publisher.get_connection()
        logger.info(cyan('Testing publish LLM task ...'))
        message = 'ping ->'
        request_id = 'publish_test_in_init'
        request_id = publisher.publish(message, request_id)
        logger.info(f'Successfully published queue. request_id: {request_id}')
        count = 0
        while publisher.get_status(request_id) != "finished":
            time.sleep(1)
            count += 1
            if count > 5:
                raise LLMQueueNotResponseError(red(f'LLM Queue server has no response for {count} sec. Check if LLMQueue server is running.'))
        logger.info(f'llm queue result successfully returned => {publisher.get_result(request_id)["text"][:10]}...')
    except Exception as e:
        logger.error(f"Failed to publish message: {e}")
    finally:
        publisher.close_connection()