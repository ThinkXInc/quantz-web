import time
import re
import sys
import os
sys.path.append('../')
from typing import Dict, List, Union, Optional
# Vector DB models
from vectordb_server.models import Metadata

# VectorDatabase
from libcommon.vector_database.sentence_encoder import SentenceEncoder
from libcommon.vector_database.vector_database import VectorDatabase, Document

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Config
from vectordb_server.config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    "VECTORDB_ENCODER_CHECKPOINT",
    "VECTORDB_EMBEDDING_DIM",
    "VECTORDB_HOST",
    "VECTORDB_PORT"
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

def get_cuda_context():
    gpu_id = os.getenv("GPU_ID", default="0")
    logger.info(bold(f"allocate to gpu: {gpu_id}"))
    return int(gpu_id)

VECTORDB_ENCODER_CHECKPOINT = Config.VECTORDB_ENCODER_CHECKPOINT
VECTORDB_EMBEDDING_DIM = Config.VECTORDB_EMBEDDING_DIM
VECTORDB_HOST = Config.VECTORDB_HOST
VECTORDB_PORT = Config.VECTORDB_PORT

# Setup and Initialization
encoder = SentenceEncoder(
    VECTORDB_ENCODER_CHECKPOINT,
    embedding_dim=VECTORDB_EMBEDDING_DIM,
    device=f'cuda:{get_cuda_context()}'
)
vdb = VectorDatabase(
    host=VECTORDB_HOST,
    port=VECTORDB_PORT,
    encoder=encoder,
    test_on_memory=False
)

from vectordb_server.tasks import (
VectorDBSaveError,
VectorDBUpdateError,
VectorDBDeleteError,
VectorDBNotFoundError,
VectorDBCreateCollectionError,
VectorDBDeleteCollectionError,
)

# save
def run_save(collection_name: str, metadata_dict: dict, send_callback=None):
    metadata = Metadata(**metadata_dict)

    try:
        saved_document = vdb.save(collection_name=collection_name, text=metadata.text, metadata=metadata.dict())
        logger.info(green(f'successfully saved: {saved_document.id} ({saved_document.payload})'))
        return saved_document
    except Exception as e:
        logger.error(red(f'[run_save] save error: {e}'))
        raise VectorDBSaveError(str(e))

    #logger.info(f'find document in vectordb \ncollection_name: {collection_name} \nmetadata: {metadata} \nfind_key: material_id')
    #if not vdb.find_one(collection_name=collection_name, find_key='material_id', metadata=metadata.dict()):
    #    logger.info('no document found in vectordb. save new document.')
    #    try:
    #        saved_document = vdb.save(collection_name=collection_name, text=metadata.text, metadata=metadata.dict())
    #        logger.info(green(f'successfully saved: {saved_document.id} ({saved_document.payload})'))
    #        return saved_document
    #    except Exception as e:
    #        logger.error(red(f'[run_save] save error: {e}'))
    #        raise VectorDBSaveError(str(e))
    #else:
    #    message = f'already exist in db: {metadata}'
    #    logger.warning(red(message))
    #    raise VectorDBSaveError(f'Document already exists in DB: {metadata}')


# update
def run_update(collection_name: str, metadata_dict: dict, send_callback=None):
    metadata = Metadata(**metadata_dict)

    try:
        updated_document = vdb.find_one_and_update(
            collection_name=collection_name, 
            find_key='material_id', 
            find_value=metadata.material_id, 
            text=metadata.text, 
            metadata=metadata.dict()
        )
        
        if not updated_document:
            raise VectorDBNotFoundError(f'Document with material_id {metadata.material_id} not found in collection {collection_name}.')
        
        return updated_document
    
    except Exception as e:
        logger.error(red(f'[run_update] update error: {e}'))
        raise VectorDBUpdateError(str(e))

# delete
def run_delete(collection_name: str, material_id: str, send_callback=None):
    try:
        metadata = Metadata(material_id=material_id)  # Only material_id is necessary for deletion.
        document = vdb.find_one(collection_name=collection_name, find_key='material_id', metadata=metadata.dict())
        
        if not document:
            raise VectorDBNotFoundError(f'Document with material_id {material_id} not found in collection {collection_name}.')

        success = vdb.delete(collection_name=collection_name, find_key='material_id', find_value=material_id)

        if not success:
            raise VectorDBDeleteError(f'Document with material_id {material_id} failed to delete')
    
    except Exception as e:
        logger.error(red(f'[run_delete] delete error: {e}'))
        raise VectorDBDeleteError(str(e))

# create collection
def run_create_collection(collection_name: str, send_callback=None):
    try:
        vdb.create_collection(collection_name)
    except Exception as e:
        logger.error(red(f'Create collection error: {e}'))
        raise VectorDBCreateCollectionError(str(e))

# delte collection
def run_delete_collection(collection_name: str, send_callback=None):
    try:
        vdb.delete_collection(collection_name)
    except Exception as e:
        logger.error(red(f'Delete collection error: {e}'))
        raise VectorDBDeleteCollectionError(str(e))