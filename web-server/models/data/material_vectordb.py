import sys
sys.path.append('../')
from vectordb_server.tasks import echo, vectordb_save, vectordb_update, \
    vectordb_delete, vectordb_delete_collection, vectordb_create_collection
from vectordb_server.models import Metadata
from celery.exceptions import TimeoutError, NotRegistered
from models.data.material import Material
from models.data.user import User

# Set logger
from libcommon.logger import Logger
from libcommon.color import *

logger = Logger()
logger.setLevel(logger.DEBUG)

class MaterialVectorDBCreateCollectionError(Exception):
    pass

class MaterialVectorDBSaveError(Exception):
    pass

class MaterialVectorDBUpdateError(Exception):
    pass

class MaterialVectorDBDeleteError(Exception):
    pass

# vectordb collection name
def chat_history_collection_name(user_id):
    return f'{user_id}_chats'

def documents_collection_name(user_id):
    return f'{user_id}_documents'

class MaterialVectorDB:
    @staticmethod
    def create_collection(user: User):
        collection_name = documents_collection_name(user.id)
        try:
            task = vectordb_create_collection.apply_async(args=(collection_name,))
            logger.info(yellow(f'[create_collection] Task id {task.id}: waiting for response...'))
            result = task.get(timeout=5)
            logger.info(green(f'Task response: {result}'))
            if not result['success']:
                return False
        except (TimeoutError, NotRegistered) as e:
            logger.error(red(f"Error with Celery task execution for create collection: {e}"))
            raise MaterialVectorDBCreateCollectionError("Failed to creating user's document collection in VectorDB")
        except Exception as e:
            logger.error(red(f"Error creating user's document collection in VectorDB: {str(e)}"))
            raise MaterialVectorDBCreateCollectionError("Failed to creating user's document collection in VectorDB")
 
    @staticmethod
    def save(material: Material, user: User, check_result=True) -> None:
        try:
            metadata = Metadata(
                material_id=str(material.id),
                user_id=str(user.id),
                text=material.text,
                title=material.title,
                keywords=material.keywords
            )
            collection_name = documents_collection_name(user.id)
            task = vectordb_save.apply_async(
                kwargs={
                    'collection_name': collection_name,
                    'metadata_dict': metadata.dict()})
            logger.info(yellow(f'[save] Task id {task.id}: waiting for response...'))
            result = task.get(timeout=5)
            logger.info(green(f'Task response: {result}'))
            if not result['success']:
                return False
        except (TimeoutError, NotRegistered) as e:
            logger.error(red(f"Error with Celery task execution for create collection: {e}"))
            raise MaterialVectorDBSaveError("Failed to creating user's document collection in VectorDB")
        except Exception as e:
            logger.error(red(f"Error saving material in VectorDB: {str(e)}"))
            raise MaterialVectorDBSaveError("Failed to save material in VectorDB")

    @staticmethod
    def update(material: Material, user: User, check_result=True) -> None:
        try:
            metadata = Metadata(
                material_id=str(material.id),
                user_id=str(user.id),
                text=material.text,
                title=material.title,
                keywords=material.keywords
            )
            collection_name = documents_collection_name(user.id)
            res = vectordb_update.apply_async(
                kwargs={'collection_name': collection_name, 'metadata_dict': metadata.dict()})
            if check_result:
                result = res.get(timeout=5)
                logger.info(green(f'[update] Task response: {result}'))
                if not result or not result.get('success', False):
                    error_message = result.get('error', 'Unknown error during material update in VectorDB.')
                    logger.error(red(f"Error updating material in VectorDB: {error_message}"))
                    raise MaterialVectorDBUpdateError(message={error_message}, errors=result)
        except Exception as e:
            logger.error(red(f"Error updating material in VectorDB: {str(e)}"))
            raise MaterialVectorDBUpdateError("Failed to update material in VectorDB")

    @staticmethod
    def delete(material: Material, user: User, check_result=True) -> None:
        try:
            collection_name = documents_collection_name(user.id)
            task = vectordb_delete.apply_async(
                kwargs={'collection_name': collection_name, 'material_id': str(material.id)})
    
            if check_result:
                try:
                    result = task.get(timeout=5)
                    logger.info(green(f'Task response: {result}'))
                except TimeoutError:
                    logger.error(red(f"Timeout while waiting for delete task result"))
                    raise MaterialVectorDBDeleteError("Timeout waiting for Vectordb response")
    
                if not result or not result.get('success', False):
                    error_message = result.get('error', 'Unknown error during material deletion in VectorDB.')
                    logger.error(red(f"Error deleting material in VectorDB: {error_message}"))
                    raise MaterialVectorDBDeleteError(message=error_message, errors=result)
                else:
                    logger.info(green(f'Material {material.id} successfully deleted from vectordb'))
        except Exception as e:
            logger.error(red(f"Error deleting material in VectorDB: {str(e)}"))
            raise MaterialVectorDBDeleteError("Failed to delete material in VectorDB")
