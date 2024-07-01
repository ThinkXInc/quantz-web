import os
import threading
from celery.utils.log import get_task_logger
from celery import Celery
from celery.signals import worker_process_init
from billiard import current_process
import sys
sys.path.append('../')

# chatdata listener
from threading import Thread

# Set logger
from libcommon.logger import Logger
logger = Logger('web-server cerely')
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
from web_tasks_server.celery_instance import celery_app
## Register tasks
from web_tasks_server.tasks import (
    echo,
    run_payment,
    process_chatdata,
    listen_chatdata_queue
)
celery_app.register_task(echo) # for checking status
celery_app.register_task(run_payment)
celery_app.register_task(process_chatdata)

# Ensure that there are no residual tasks
#celery_app.control.purge()

@worker_process_init.connect
def setup_worker_process(sender=None, **kwargs):
    """Initialize worker process.
    """
    worker_type = os.getenv("WORKER_TYPE")
    worker_name = current_process().name

    logger.info('Setup worker process..')
    try:
        if worker_type == "billing":
            logger.info(f'worker type: {worker_type}')
        elif worker_type == "process_chatdata":
            logger.info(f'worker type: {worker_type}')

            thread = Thread(target=listen_chatdata_queue)
            thread.start()
            logger.info(light_green("Started chat data listener thread."))
        else:
            logger.error(red(f'unknown worker type {worker_type}'))
            raise RuntimeError(f'unknown worker type {worker_type}')
        #current_process()._run_vectordb_delete_collection = run_delete_collection
        pass
    except Exception as e:
        logger.error(f"[ERROR] Error setting up worker process: {e}")
    finally:
        logger.info(green(f'{worker_type} {worker_name} worker process ready.'))

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
