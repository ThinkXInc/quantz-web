#
# models/data/material.py
#
# Material MongoDB Data Model
#
 
import datetime
from libcommon.mongomodel import MongoModel
from libcommon.response.errors import ProcessingError, ResourceNotFoundError
from libcommon.color import yellow, bold, red, cyan, green, light_green
from mongoengine import (
    Document, StringField, IntField, ObjectIdField, ListField,
    BooleanField, DateTimeField, EmbeddedDocumentField, EmbeddedDocument,
    ReferenceField,
    CASCADE
)

# Set logger
from libcommon.logger import Logger
logger = Logger('material.py')
logger.setLevel(logger.DEBUG)

TITLE_MAX_LENGTH = 120
TEXT_MAX_LENGTH = 1000
KEYWORD_MAX_LENGTH = 120
QUESTION_MAX_LENGTH = 200
ANSWER_MAX_LENGTH = 500
REVIEW_MAX_LENGTH = 500

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
        'max_size': 2000000, # 200 MB  TODO: use Config
        'max_documents': 1000,  # 1000 entries  TODO: use Config
        'indexes': [
            '$text', # text index (full-text search / partial word mathing)
        ],
        'ordering': ['-updated']
    }

    @classmethod
    def create_new(cls, text, user, lang, locale):
        try:
            material = Material(text=text, user=user).save()
            logger.info(light_green(f"[created] material {material.id}.\ntext: {text}\nuser: {user.email}"))
            return material
        except Exception as e:
            logger.error(e)
            return ProcessingError(lang, locale, 'material_save_error')

    @classmethod
    def update(cls, user, material_id, updates: dict, lang, locale):
        try:
            material = Material.objects(user=user, id=material_id).first()
            if not material:
                logger.error(red(f"No Material found with id: {material_id} user: {user.email}"))
                return ResourceNotFoundError(lang, locale, 'material_not_found', 'material', locale_args=[material_id])

            for key, value in updates:
                material[key] = value
            material.save()
            return material
        
        except Exception as e:
            logger.error(red(f"Error updating Material with id: {material_id}. Error: {e}"))
            return ProcessingError(lang, locale, 'material_update_error')

    @classmethod
    def delete_by_id(cls, material_id, lang, locale):
        try:
            material = Material.objects(id=material_id).first()
            print('XXX')
            if not material:
                logger.error(red(f"No Material found with id: {material_id}"))
                return ResourceNotFoundError(lang, locale, 'material_not_found', 'material', locale_args=[material_id])

            print('YYYY')
            material.delete()
            return material
        
        except Exception as e:
            print('ZZZZ')
            logger.error(red(f"Error deleting Material with id: {material_id}. Error: {e}"))
            return ProcessingError(lang, locale, 'material_delete_error')


    @classmethod
    def update_with_task_results(cls, result, user, material_id, lang, locale):
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
            return ProcessingError(lang, locale, 'material_update_error')

        # Logging the updates
        updated_fields = [f"{key}: {', '.join(result[key])}" if key == 'keywords' else f"{key}: {result[key]}" for key in fields_to_update if key in result]
        logger.info(yellow(f"[updated] material {material_id}.\n" + '\n'.join(updated_fields)))

    #@classmethod
    #def update_with_task_results(result, material_id, lang, locale):
    #    # Update the Material object in the database with the fetched results.
    #    try:
    #        material = Material.objects(id=material_id).first()
    #        if not material:
    #            logger.error(red(f"No Material found with id: {material_id}"))
    #            return ResourceNotFoundError(lang, locale, 'material_not_found', 'material', material_id)

    #        fields_to_update = []

    #        for key in ['title', 'keywords', 'question', 'answer', 'review']:
    #            if key in result:
    #                material[key] = result[key]
    #                if key == 'keywords':
    #                    fields_to_update.append(f"{key}: {', '.join(result[key])}")
    #                else:
    #                    fields_to_update.append(f"{key}: {result[key]}")

    #        # Save the updates made to the material
    #        material.save()

    #        # Log the updates
    #        logger.info(yellow(f"[updated] material {material_id}.\n" + '\n'.join(fields_to_update)))

    #    except Exception as e:
    #        logger.error(red(f"Error updating Material with id: {material_id}. Error: {e}"))
    #        return ProcessingError(lang, locale, 'material_update_error').http_response()

    @classmethod
    def get(cls, user, material_id, lang, locale, return_json=True):
        try:
            material = Material.objects(user=user, id=material_id).first()
            
            # Return error if not found
            if not material:
                return ResourceNotFoundError(lang, locale, 'material_not_found', 'material', material_id).http_response()

            # Convert to JSON if required
            print(cyan(material.response_json()))
            if return_json:
                return {'material': material.response_json() }
            return material
        except Exception as e:
            print(e)
            logger.error(e)

    @classmethod
    def list(cls, user, limit=100, return_json=True):
        try:
            materials = Material.objects(user=user).limit(limit)

            # Fetch the count of all materials associated with the user
            count = Material.objects(user=user).count()

            # Convert to JSON if required
            if return_json:
                return {
                    'materials': [material.response_json() for material in materials],
                    'count': count
                }
            return materials
        except Exception as e:
            print(e)
            logger.error(e)

