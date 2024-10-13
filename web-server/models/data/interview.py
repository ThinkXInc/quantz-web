#
# models/data/interview.py
#
# Interview MongoDB Data Model
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

logger = Logger('interview.py')
logger.setLevel(logger.DEBUG)

# interview
TITLE_MAX_LENGTH = 120
START_MESSAGE_MAX_LENGTH = 300
# interview step
FINISH_CONDITION_MAX_LENGTH = 100
QUESTION_MAX_LENGTH = 120
INSTRUCTION_MAX_LENGTH = 300

class InterviewSaveError(Exception):
    pass

class InterviewNotFoundError(Exception):
    pass

class InterviewQueryError(Exception):
    pass

class InterviewUpdateError(Exception):
    pass

class InterviewDeleteError(Exception):
    pass

class NoUpdateFieldError(Exception):
    pass

class InterviewStep(MongoModel):
    question = StringField(max_length=QUESTION_MAX_LENGTH)
    finish_condition = StringField(max_length=FINISH_CONDITION_MAX_LENGTH)
    max_turns = IntField(required=True, default=3)
    instructions = ListField(StringField(max_length=INSTRUCTION_MAX_LENGTH))

    user = ReferenceField('User', reverse_delete_rule=CASCADE)

    meta = {
        'collection': 'interview_step',
        'max_size': 2000000, # 200 MB  TODO: use Config
        #'max_documents': 1000,  # 1000 entries  TODO: use Config
        'ordering': ['-updated']
    }


class Interview(MongoModel):
    title = StringField(max_length=TITLE_MAX_LENGTH)
    introduction = StringField(max_length=START_MESSAGE_MAX_LENGTH)

    steps = ListField(ReferenceField(InterviewStep))

    user = ReferenceField('User', reverse_delete_rule=CASCADE)
    meta = {
        'collection': 'interview',
        'max_size': 10485760*100, # max size of the collection in bytes 10MB *100 = 1GB TODO: use Config
        'max_documents': 1000000,  # old documents are removed when reached to this limit  TODO: use Config
        'indexes': [
            '$title', # text index (full-text search / partial word mathing)
        ],
        'ordering': ['-updated']
    }

    @classmethod
    def get_one(cls, user: User, interview_id: str) -> 'Interview':
        try:
            interview = Interview.objects(user=user, id=interview_id).first()
            if not interview:
                raise InterviewNotFoundError("Interview not found")
            return interview
        except Exception as e:
            logger.error(e)
            raise InterviewNotFoundError("An error occurred while retrieving the interview.")

    @classmethod
    def get_many(cls, user: User, limit: int = 100) -> Union[List['Interview']]:
        try:
            interviews = Interview.objects(user=user).limit(limit)
            count = Interview.objects(user=user).count()
            return interviews, count
        except Exception as e:
            logger.error(e)
            raise InterviewListError("An error occurred while listing the interviews.")

    @classmethod
    def create_new(cls, title: str, introduction: str, steps: list, user: 'User') -> 'Interview':
        try:
            # Create and save InterviewStep instances
            step_documents = []
            for step_data in steps:
                step_document = InterviewStep(
                    question=step_data['question'],
                    finish_condition=step_data['finish_condition'],
                    max_turns=step_data['max_turns'],
                    instructions=step_data['instructions'],
                    user=user
                ).save()
                step_documents.append(step_document)

            # Now create the main Interview document with references to these InterviewStep instances
            interview = Interview(
                title=title,
                introduction=introduction,
                steps=step_documents,  # This now uses the saved InterviewStep documents
                user=user
            ).save()
            logger.info(light_green(f"[created] interview {interview.id}.\ntitle: {title}\nintroduction: {introduction}\nuser: {user.email}"))
            return interview
        except Exception as e:
            logger.error(e)
            raise InterviewSaveError("Error saving interview")

    @classmethod
    def update(cls, user: 'User', interview_id: str, updates: Dict[str, Union[str, List]]) -> 'Interview':
        try:
            interview = Interview.objects(user=user, id=interview_id).first()
            if not interview:
                logger.error(red(f"No Interview found with id: {interview_id} user: {user.email}"))
                raise InterviewNotFoundError("Interview not found")

            # Handle updating steps separately
            if 'steps' in updates:
                # First, delete the current steps to avoid orphan documents
                for step in interview.steps:
                    step.delete()
                # Now create new InterviewStep instances
                new_steps = []
                for step_data in updates['steps']:
                    new_step = InterviewStep(
                        question=step_data['question'],
                        finish_condition=step_data['finish_condition'],
                        max_turns=step_data['max_turns'],
                        instructions=step_data['instructions'],
                        user=user
                    ).save()
                    new_steps.append(new_step)
                interview.steps = new_steps
                del updates['steps']  # Remove 'steps' from updates as it's already handled

            # Update other fields
            for key, value in updates.items():
                if hasattr(interview, key):
                    setattr(interview, key, value)
                else:
                    logger.warning(yellow(f"Attempting to update non-existing field '{key}'."))

            interview.save()
            logger.info(light_green(f"Updated interview {interview.id}.\nUser: {user.email}"))
            return interview

        except Exception as e:
            logger.error(red(f"Error updating Interview with id: {interview_id}. Error: {e}"))
            raise InterviewUpdateError("Error updating interview")

    @classmethod
    def delete_one(cls, interview_id: str) -> Optional['Interview']:
        try:
            interview = Interview.objects(id=interview_id).first()
            if not interview:
                logger.error(red(f"No Interview found with id: {interview_id}"))
                raise InterviewNotFoundError("Interview not found")

            interview.delete()
            return interview
        except Exception as e:
            logger.error(red(f"Error deleting Interview with id: {interview_id}. Error: {e}"))
            raise InterviewDeleteError("Error deleting interview")


    def response_json(self):
        # Convert each InterviewStep ObjectId in steps to a string
        steps_data = []
        for step in self.steps:
            step_detail = {
                'question': step.question,
                'finish_condition': step.finish_condition,
                'max_turns': step.max_turns,
                'instructions': step.instructions
            }
            steps_data.append(step_detail)

        # Serialize the main Interview document
        return {
            'id': str(self.id),  # Convert ObjectId to string
            'title': self.title,
            'introduction': self.introduction,
            'steps': steps_data,
            'user_id': str(self.user.id)  # Assuming user also has an ObjectId
        }

    #@classmethod
    #def update_with_task_results(cls, result: Dict, user: 'User', interview_id: str) -> None:
    #    # List of fields that we will attempt to update
    #    fields_to_update = ['title', 'keywords', 'question', 'answer', 'review']

    #    # Loop over the fields and use the update method to set their values if present in the result
    #    for key in fields_to_update:
    #        if key in result:
    #            response = cls.update(user, interview_id, key, result[key], lang, locale)
    #            if isinstance(response, Exception):
    #                return response

    #    # Check if there are no fields to update in the result
    #    if not any([key in result for key in fields_to_update]):
    #        logger.error(red(f"No field to update in result: {result}. This will never happen."))
    #        raise InterviewUpdateError("Error updating interview with task results")

    #    # Logging the updates
    #    updated_fields = [f"{key}: {', '.join(result[key])}" if key == 'keywords' else f"{key}: {result[key]}" for key in fields_to_update if key in result]
    #    logger.info(yellow(f"[updated] interview {interview_id}.\n" + '\n'.join(updated_fields)))

