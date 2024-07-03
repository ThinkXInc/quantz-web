import os

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    "VECTORDB_HOST",
    "VECTORDB_PORT"
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

# VectorDatabase
from libcommon.vector_database.sentence_encoder import SentenceEncoder
from libcommon.vector_database.vector_database import VectorDatabase, Document

def get_cuda_context():
    gpu_id = os.getenv("GPU_ID", default="0")
    logger.info(bold(f"allocate to gpu: {gpu_id}"))
    return int(gpu_id)

VECTORDB_ENCODER_CHECKPOINT = Config.VECTORDB_ENCODER_CHECKPOINT
VECTORDB_EMBEDDING_DIM = Config.VECTORDB_EMBEDDING_DIM
VECTORDB_HOST = Config.VECTORDB_HOST
VECTORDB_PORT = Config.VECTORDB_PORT

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

# User
from init_mongodb import connect
from models.data.user import User, UserNotFoundError

# Material
from models.data.material import Material, MaterialQueryError

all_user_ids = User.list_all_user_ids()
logger.info(f'{len(all_user_ids)} user ids found')

for user_id in all_user_ids:
    logger.info(f'\n\n'+f'-'*100)
    logger.info(magenta(f'Start processing user: {user_id}'))
    try:
        collection_name = vdb.documents_collection_name(user_id)
    except Exception as e:
        logger.error(red(f'Error occured when finding collection {collection_name}: {e}'))
        break

    try:
        user = User.find_user_by_id(user_id)
    except Exception as e:
        logger.error(red(f'Error occured when finding user by id {user_id}: {e}'))
        break

    # materials = user.materials # FIXME: not work
    try:
        materials, count = Material.get_many(user, limit=10000)
        logger.debug(f'fetched {count} materials => {materials}')
    except Exception as e:
        logger.error(red(f"Error in get materials by user: {e}"))

    logger.info(f'{len(materials)} materials found in mongodb')
    document_ids_in_mongodb = [material.id for material in materials]
    logger.debug(f'material ids in mongodb {document_ids_in_mongodb}')

    try:
        documents_in_vdb = vdb.list_all_in_collection(collection_name, with_payload=True)
        logger.info(f'{len(documents_in_vdb)} materials found in vdb')
    except Exception as e:
        logger.error(red(f"Error in list documents in vdb collection: {e}"))
        break
   
    document_ids_in_vdb = [document.payload['material_id'] for document in documents_in_vdb]
    logger.debug(f'material ids in vdb {document_ids_in_vdb}')

    orphaned_ids = [vid for vid in document_ids_in_vdb if vid not in document_ids_in_mongodb]
    logger.info(cyan(f'{len(orphaned_ids)} orphaned ids found'))
    for oid in orphaned_ids:
        try:
            deleted = vdb.delete(collection_name, find_key='material_id', find_value=oid)
            if deleted:
                logger.info(green(f"Deleted orphaned document with ID {oid} from collection {collection_name}"))
            else:
                logger.info(yellow(f"orphaned document with ID {oid} not deleted from collection {collection_name}"))
        except Exception as e:
            logger.error(red(f"Error in checking/deleting orphaned entries: {e}"))