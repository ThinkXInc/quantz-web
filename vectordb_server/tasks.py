import time
from celery import Celery
from billiard import current_process
from typing import Dict, List, Union, Optional
# Read request
import json

# Set logger
from libcommon.logger import Logger
logger = Logger('vectordb cerely worker')
logger.setLevel(logger.DEBUG)
from libcommon.color import *

## Define tasks
from vectordb_server.celery_instance import celery_app
# Vector DB models
from vectordb_server.models import Metadata

class VectorDBSaveError(Exception):
    pass

class VectorDBUpdateError(Exception):
    pass

class VectorDBDeleteError(Exception):
    pass

class VectorDBNotFoundError(Exception):
    pass

class VectorDBCreateCollectionError(Exception):
    pass

class VectorDBDeleteCollectionError(Exception):
    pass


@celery_app.task(queue='echo')
def echo(text):
    time.sleep(0)
    logger.info(f'echo: {text}')
    return text

@celery_app.task(queue='vectordb_save')
def vectordb_save(collection_name: str, metadata_dict: dict, send_callback: Optional[callable] = None):
    try:
        logger.debug(cyan('run save ----->'))
        logger.debug(f'collection_name: {collection_name}\nmetadata_dict: {metadata_dict}')
        res = current_process()._run_vectordb_save(
            collection_name=collection_name,
            metadata_dict=metadata_dict,
            send_callback=send_callback)
        # If res is successful, return a positive response.
        logger.info(bold(f'<Response>: {res}'))
        return {'success': True, 'data': res.id}
    except VectorDBSaveError as e:
        logger.error(red(f'VectorDBSaveError: {e}'))
        return {'success': False, 'error': str(e), 'type': 'VectorDBSaveError'}
    except VectorDBNotFoundError as e:
        logger.error(red(f'VectorDBNotFoundError: {e}'))
        return {'success': False, 'error': str(e), 'type': 'VectorDBNotFoundError'}
    except Exception as e:
        logger.error(red(f'Unexpected error: {e}'))
        return {'success': False, 'error': str(e), 'type': 'UnexpectedError'}
    finally:
        logger.debug(cyan('<---- done save'))

@celery_app.task(queue='vectordb_update')
def vectordb_update(collection_name: str, metadata_dict: dict, send_callback: Optional[callable] = None):
    try:
        logger.debug(cyan('run update ----->'))
        res = current_process()._run_vectordb_update(
            collection_name=collection_name,
            metadata_dict=metadata_dict,
            send_callback=send_callback)
        logger.info(f'<Response>: {res}')
        return {'success': True, 'data': res.id}
    except VectorDBUpdateError as e:
        logger.error(red(f'VectorDBUpdateError: {e}'))
        return {'success': False, 'error': str(e), 'type': 'VectorDBUpdateError'}
    except Exception as e:
        logger.error(red(f'Unexpected error: {e}'))
        return {'success': False, 'error': str(e), 'type': 'UnexpectedError'}
    finally:
        logger.debug(cyan('<---- done update'))

@celery_app.task(queue='vectordb_delete')
def vectordb_delete(collection_name: str, material_id: str, send_callback: Optional[callable] = None):
    try:
        logger.debug(cyan('run delete ----->'))
        res = current_process()._run_vectordb_delete(
            collection_name=collection_name,
            material_id=material_id,
            send_callback=send_callback)
        logger.info(f'<Response>: {res}')
        return {'success': True}
    except VectorDBDeleteError as e:
        logger.error(red(f'VectorDBDeleteError: {e}'))
        return {'success': False, 'error': str(e), 'type': 'VectorDBDeleteError'}
    except Exception as e:
        logger.error(red(f'Unexpected error: {e}'))
        return {'success': False, 'error': str(e), 'type': 'UnexpectedError'}
    finally:
        logger.debug(cyan('<---- done delete'))

@celery_app.task(queue='vectordb_create_collection')
def vectordb_create_collection(collection_name: str, send_callback: Optional[callable] = None):
    try:
        logger.debug(cyan('run create_collection ----->'))
        current_process()._run_vectordb_create_collection(
            collection_name=collection_name,
            send_callback=send_callback)
        return {'success': True}
    except VectorDBCreateCollectionError as e:
        logger.error(red(f'VectorDBCreateCollectionError: {e}'))
        return {'success': False, 'error': str(e), 'type': 'VectorDBCreateCollectionError'}
    except Exception as e:
        logger.error(red(f'Unexpected error: {e}'))
        return {'success': False, 'error': str(e), 'type': 'UnexpectedError'}
    finally:
        logger.debug(cyan('<---- done create_collection'))

@celery_app.task(queue='vectordb_delete_collection')
def vectordb_delete_collection(collection_name: str, send_callback: Optional[callable] = None):
    try:
        logger.debug(cyan('run delete_collection ----->'))
        collection_config = {
            "hnsw_config": {
                "max_connections": 16,
                "ef_construction": 200,
                "ef_search": 100
            },
            "wal_config": {
                "wal_capacity_mb": 1024,
                "wal_segments_ahead": 3
            },
            "optimizers_config": {
                "deleted_threshold": 0.2,
                "vacuum_min_vector_number": 10000
            },
            "shard_number": 4,
            "on_disk_payload": True,
            "quantization_config": {
                "quantizer_precision": 8
            },
            "payload_index": ["material_id", "keywords"]  # Ensure these fields are indexed
        }
        current_process()._run_vectordb_delete_collection(
            collection_name=collection_name,
            collection_config=collection_config,
            send_callback=send_callback)
        logger.info(f'<Response>: {res}')
        return {'success': True}
    except VectorDBDeleteCollectionError as e:
        logger.error(red(f'VectorDBDeleteCollectionError: {e}'))
        return {'success': False, 'error': str(e), 'type': 'VectorDBDeleteCollectionError'}
    except Exception as e:
        logger.error(red(f'Unexpected error: {e}'))
        return {'success': False, 'error': str(e), 'type': 'UnexpectedError'}
    finally:
        logger.debug(cyan('<---- done delete_collection'))
