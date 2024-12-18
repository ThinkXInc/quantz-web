#!/usr/bin/env python3
import sys
import os
import json

# Ensure we can import from parent directories if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from libcommon.logger import Logger
from libcommon.color import *
from vectordb_server.config import Config, check_config
from libcommon.vector_database.sentence_encoder import SentenceEncoder
from libcommon.vector_database.vector_database import VectorDatabase

logger = Logger('CheckVectorDB')
logger.setLevel(logger.INFO)

# Required config keys
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    "VECTORDB_ENCODER_CHECKPOINT",
    "VECTORDB_EMBEDDING_DIM",
    "VECTORDB_HOST",
    "VECTORDB_PORT",
    "LLM_MAX_CONTEXT"
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
LLM_MAX_CONTEXT = Config.LLM_MAX_CONTEXT

# Initialize the encoder and vector database
encoder = SentenceEncoder(
    VECTORDB_ENCODER_CHECKPOINT,
    embedding_dim=VECTORDB_EMBEDDING_DIM,
    max_context_length=LLM_MAX_CONTEXT,
    device=f'cuda:{get_cuda_context()}'
)
vdb = VectorDatabase(
    host=VECTORDB_HOST,
    port=VECTORDB_PORT,
    encoder=encoder,
    test_on_memory=False
)

def get_one_document_from_collection(collection_name: str):
    """
    Attempt to get one representative document from the collection.
    We'll just try a neutral vector search or use the built-in method 
    that attempts to list all documents and pick one.
    """
    try:
        # Use the list_all_in_collection method to retrieve documents
        # This method as defined in the class returns search results, 
        # which are points with at least an `id` and possibly payload.
        results = vdb.list_all_in_collection(collection_name=collection_name, limit=1, with_payload=True)
        
        if not results:
            return None
        
        # results is a list of qdrant_client.constructors.ScoredPoint
        # Let's return a simplified dict
        representative = results[0]
        doc_info = {
            "id": representative.id,
            "payload": representative.payload
        }
        return doc_info
    except Exception as e:
        logger.error(red(f"Error retrieving a doc from {collection_name}: {e}"))
        return None

def main():
    try:
        # Get all collections
        collections_response = vdb.client.get_collections()
        collections = collections_response.collections if collections_response else []
        
        if not collections:
            logger.info(yellow("No collections found in the database."))
            return
        
        logger.info(cyan("Collections found:"))
        for coll in collections:
            collection_name = coll.name
            logger.info(f"- {collection_name}")
            
            # Count documents in the collection
            try:
                doc_count = vdb.count(collection_name)
            except Exception as e:
                logger.error(red(f"Error counting documents in {collection_name}: {e}"))
                doc_count = None
            
            logger.info(f"  Number of documents: {doc_count if doc_count is not None else 'N/A'}")
            
            # Try to get one representative document
            representative_doc = get_one_document_from_collection(collection_name)
            if representative_doc:
                logger.info("  Representative document:")
                logger.info(json.dumps(representative_doc, indent=2))
            else:
                logger.info("  No representative document found (empty collection or error).")
            
            logger.info("")

    except Exception as e:
        logger.error(red(f"Failed to check vector db: {e}"))

if __name__ == '__main__':
    main()
