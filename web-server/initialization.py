# initialization.py
from config import Config
# mongodb
from mongoengine import connect
from models.data.user import User, ApplyChangeDelayInSec, UserAlreadyExistsError, UserNotFoundError, UserSaveError
# vectordb celery
from celery.exceptions import TimeoutError, NotRegistered
from vectordb_server.celery_instance import celery_app as vectordb_celery_app
from vectordb_server.tasks import echo, vectordb_create_collection
from models.data.material_vectordb import documents_collection_name
# web celery
from web_tasks_server.celery_instance import celery_app as web_celery_app
from web_tasks_server.tasks import echo as echo_web
from web_tasks_server.tasks import run_payment

# Set logger
from libcommon.logger import Logger
from libcommon.color import *

logger = Logger('initialization.py')
logger.setLevel(logger.DEBUG)

def check_initialization():
    email = "kaz@thinkxinc.com"
    logger.info("Starting initialization check...")
    # MongoDB
    #from manage_mongodb import delete_all_users
    #delete_all_users()
    #email = "otsuka.kazuki@googlemail.com"
    # Try to delete existing user if exists
    try:
        existing_user = User.find_user_by_email(email)
        existing_user.delete()
        logger.info(f"Existing user deleted: {email}")
    except UserNotFoundError:
        logger.info(f"No existing user to delete: {email}")
    except Exception as e:
        logger.error(f"Failed to delete existing user: {e}")
        return False

    # Try to create a new user
    try:
        user = User.create_new(suspended_email=email, password="1234")
        user.email_to_verified()
        logger.info(f"User successfully created and verified: {user.response_json()}")
    except UserAlreadyExistsError as e:
        logger.error(f"User already exists error: {e}")
        return False
    except UserSaveError as e:
        logger.error(f"User save error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during user creation: {e}")
        return False

    # Verification if user is saved correctly
    try:
        saved_user = User.find_user_by_email(email)
        if saved_user.email == email:
            logger.info("User is correctly saved and retrieved.")
            return True
        else:
            logger.error("Saved user email does not match.")
            return False
    except Exception as e:
        logger.error(f"Error retrieving saved user: {e}")
        return False

    # VectorDB Celery
    logger.info(cyan('Checking VectorDB Celery status --->'))
    registered_task_keys = [key for key in vectordb_celery_app.tasks.keys() if 'vectordb' in key]
    logger.info(f'VectorDB registered tasks: {registered_task_keys}')

    # Checking the echo task
    try:
        #task = echo.apply_async(args=("<--- VectorDB Celery Worker OK.",))
        task = vectordb_create_collection.apply_async(args=(documents_collection_name(user.id),))
        logger.info(yellow(f'Task id {task.id}: waiting for response...'))
        result = task.get(timeout=15)
        logger.info(green(f'Task response: {result}'))
        if not result['success']:
            return False
    except (TimeoutError, NotRegistered) as e:
        logger.error(red(f"Error with Celery task execution: {e}"))
        return False
    except Exception as e:
        logger.error(red(f"Unexpected error with Celery task: {e}"))
        return False
    logger.info(cyan('ok <--- VectorDB Celery status'))

    # Web Celery
    logger.info(cyan('Checking Web Celery status --->'))
    registered_task_keys = [key for key in web_celery_app.tasks.keys() if 'web' in key]
    logger.info(f'Web celery registered tasks: {registered_task_keys}')

    # Checking the echo task
    try:
        #task = echo.apply_async(args=("<--- VectorDB Celery Worker OK.",))
        task = echo_web.apply_async(args=("Hello",))
        logger.info(yellow(f'Task id {task.id}: waiting for response...'))
        result = task.get(timeout=15)
        logger.info(green(f'Task response: {result}'))
        if not result:
            return False
    except (TimeoutError, NotRegistered) as e:
        logger.error(red(f"Error with Celery task execution: {e}"))
        return False
    except Exception as e:
        logger.error(red(f"Unexpected error with Celery task: {e}"))
        return False

    logger.info(cyan('ok <--- Web Celery status'))
    return True