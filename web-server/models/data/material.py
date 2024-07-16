#
# models/data/material.py
#
# Material MongoDB Data Model
#
from typing import Union, Tuple, List, Dict, Optional
import datetime
from models.data.user import User
from libcommon.mongomodel import MongoModel
from libcommon.color import yellow, bold, red, cyan, green, light_green
from mongoengine import (
    Document, StringField, IntField, ObjectIdField, ListField,
    BooleanField, DateTimeField, EmbeddedDocumentField, EmbeddedDocument,
    ReferenceField,
    CASCADE
)

# Set logger
from libcommon.logger import Logger
from libcommon.color import *

logger = Logger('material.py')
logger.setLevel(logger.DEBUG)

TITLE_MAX_LENGTH = 120
TEXT_MAX_LENGTH = 500
KEYWORD_MAX_LENGTH = 120
QUESTION_MAX_LENGTH = 200
ANSWER_MAX_LENGTH = 500
REVIEW_MAX_LENGTH = 1000

class MaterialSaveError(Exception):
    pass

class MaterialNotFoundError(Exception):
    pass

class MaterialQueryError(Exception):
    pass

class MaterialUpdateError(Exception):
    pass

class MaterialDeleteError(Exception):
    pass

class NoUpdateFieldError(Exception):
    pass

class Material(MongoModel):
    """ 
    Example usage:
    >> text = "This is the new text"
    >> title = "Title"
    >> keywords = ['Topic 0', 'Topic 1']
    >> material = Material(text=text).save()
    >> Material(id=material.id).update(title=title, keywords=keywords)
    >> material.reload()
    >> material.keywords
    ['Topic 0', 'Topic 1']
    """
    title = StringField(max_length=TITLE_MAX_LENGTH)
    text = StringField(required=True, max_length=TEXT_MAX_LENGTH)
    keywords = ListField(StringField(max_length=KEYWORD_MAX_LENGTH), default=list)
    question = StringField(max_length=QUESTION_MAX_LENGTH)
    answer = StringField(max_length=ANSWER_MAX_LENGTH)
    review = StringField(max_length=REVIEW_MAX_LENGTH)

    user = ReferenceField('User', reverse_delete_rule=CASCADE)

    meta = {
        'collection': 'material',
        'max_size': 10485760*100, # max size of the collection in bytes 10MB *100 = 1GB TODO: use Config
        'max_documents': 1000000,  # old documents are removed when reached to this limit  TODO: use Config
        'indexes': [
            '$text', # text index (full-text search / partial word mathing)
        ],
        'ordering': ['-updated']
    }

    @classmethod
    def get_one(cls, user: User, material_id: str) -> 'Material':
        try:
            material = Material.objects(user=user, id=material_id).first()
            if not material:
                raise MaterialNotFoundError("Material not found")
            return material
        except Exception as e:
            logger.error(e)
            raise MaterialNotFoundError("An error occurred while retrieving the material.")

    @classmethod
    def get_many(cls, user: User, limit: int = 100) -> Union[List['Material']]:
        try:
            materials = Material.objects(user=user).limit(limit)
            count = Material.objects(user=user).count()
            return materials, count
        except Exception as e:
            logger.error(e)
            raise MaterialListError("An error occurred while listing the materials.")

    @classmethod
    def create_new(cls, text: str, user: 'User') -> 'Material':
        try:
            material = Material(text=text, user=user).save()
            logger.info(light_green(f"[created] material {material.id}.\ntext: {text}\nuser: {user.email}"))
            return material
        except Exception as e:
            logger.error(e)
            raise MaterialSaveError("Error saving material")

    @classmethod
    def update(cls, user: 'User', material_id: str, updates: Dict[str, Union[str, List]]) -> 'Material':
        try:
            material = Material.objects(user=user, id=material_id).first()
            if not material:
                logger.error(red(f"No Material found with id: {material_id} user: {user.email}"))
                raise MaterialNotFoundError("Material not found")

            for key, value in updates.items():
                if hasattr(material, key):
                    setattr(material, key, value)
                else:
                    logger.warning(yellow(f"Attempting to update non-existing field '{key}'."))

            material.save()
            return material
        
        except Exception as e:
            logger.error(red(f"Error updating Material with id: {material_id}. Error: {e}"))
            raise MaterialUpdateError("Error updating material")

    @classmethod
    def delete_one(cls, material_id: str) -> Optional['Material']:
        try:
            material = Material.objects(id=material_id).first()
            if not material:
                logger.error(red(f"No Material found with id: {material_id}"))
                raise MaterialNotFoundError("Material not found")

            material.delete()
            return material
        except Exception as e:
            logger.error(red(f"Error deleting Material with id: {material_id}. Error: {e}"))
            raise MaterialDeleteError("Error deleting material")


    @classmethod
    def update_with_task_results(cls, result: Dict, user: 'User', material_id: str) -> None:
        # List of fields that we will attempt to update
        fields_to_update = ['title', 'keywords', 'question', 'answer', 'review']

        # Loop over the fields and use the update method to set their values if present in the result
        for key in fields_to_update:
            if key in result:
                response = cls.update(user, material_id, key, result[key], lang, locale)
                if isinstance(response, Exception):
                    return response

        # Check if there are no fields to update in the result
        if not any([key in result for key in fields_to_update]):
            logger.error(red(f"No field to update in result: {result}. This will never happen."))
            raise MaterialUpdateError("Error updating material with task results")

        # Logging the updates
        updated_fields = [f"{key}: {', '.join(result[key])}" if key == 'keywords' else f"{key}: {result[key]}" for key in fields_to_update if key in result]
        logger.info(yellow(f"[updated] material {material_id}.\n" + '\n'.join(updated_fields)))

