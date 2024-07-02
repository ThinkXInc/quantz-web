import os
import threading
from celery.utils.log import get_task_logger
#from server.queue_instance import queue
from celery import Celery
# Worker process connection pool
from celery.signals import worker_process_init
from billiard import current_process
import sys
sys.path.append('../')
#from llm.tasks import create_connection_pool
# Set logger
from libcommon.logger import Logger
logger = Logger('vectordb cerely')
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Celery log
import logging
from celery.signals import after_setup_logger
custom_log_format = '[%(asctime)s: %(levelname)s/%(processName)s: %(name)s] %(message)s'
@after_setup_logger.connect
def setup_loggers(logger, *args, **kwargs):
    for handler in logger.handlers:
        handler.setFormatter(logging.Formatter(custom_log_format))

# Celery instance
from vectordb_server.celery_instance import celery_app

## Register tasks
from vectordb_server.tasks import (
    vectordb_save, vectordb_update, vectordb_delete,
    vectordb_create_collection, vectordb_delete_collection,
    echo
)

celery_app.register_task(echo) # for checking status
celery_app.register_task(vectordb_save)
celery_app.register_task(vectordb_update)
celery_app.register_task(vectordb_delete)
celery_app.register_task(vectordb_create_collection)
celery_app.register_task(vectordb_delete_collection)

# Ensure that there are no residual tasks
celery_app.control.purge()

@worker_process_init.connect
def setup_worker_process(sender=None, **kwargs):
    """Initialize worker process.
    """
    logger.info('Setup worker process..')
    try:
        from vectordb_server.vectordb_runtime import (
            run_save, run_update, run_delete,
            run_create_collection, run_delete_collection)

        current_process()._run_vectordb_save = run_save
        current_process()._run_vectordb_update = run_update
        current_process()._run_vectordb_delete = run_delete
        current_process()._run_vectordb_create_collection = run_create_collection
        current_process()._run_vectordb_delete_collection = run_delete_collection

        logger.info(yellow('Worker process successfully initialized with VectorDB operations.'))
    except Exception as e:
        logger.error(red(f"[ERROR] Error setting up worker process: {e}"))
    finally:
        logger.info(green('vectordb worker process ready.'))

logger.info('Celery task queue server start running in the main thread..')

if __name__ == '__main__':
    # Note: the command `celery -A server.run:queue worker -l debug`
    # does "not" call this main function.
    #
    # Since this option `worker` start running the queue instance,
    # we don't need to call worker_main() explicitly.
    # The command queue.worker_main() is only for the case this __main__
    # function is called in some way.
    # Usually, this __main__ function is not used.

    # Start the Celery worker
    try:
        celery_app.worker_main()
    except Exception as e:
        logger.exception("Error running Celery worker_main: %s", e)
