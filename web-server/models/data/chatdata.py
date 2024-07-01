from typing import Union, Tuple, List, Dict, Optional
import datetime
from models.data.user import User
from libcommon.mongomodel import MongoModel
from mongoengine import (
    Document, StringField, IntField, ObjectIdField, ListField,
    BooleanField, DateTimeField, EmbeddedDocumentField, EmbeddedDocument,
    ReferenceField,
    CASCADE
)

# Set logger
from libcommon.logger import Logger
from libcommon.color import *

logger = Logger('chatdata.py')
logger.setLevel(logger.DEBUG)

HISTORY_MAX_LENGTH = 10000

class ChatdataSaveError(Exception):
    pass

class ChatdataNotFoundError(Exception):
    pass

class ChatdataQueryError(Exception):
    pass

class ChatdataUpdateError(Exception):
    pass

class ChatdataDeleteError(Exception):
    pass

class NoUpdateFieldError(Exception):
    pass

class Chatdata(MongoModel):
    host_id = StringField()
    client_id = StringField()
    history =  StringField(max_length=HISTORY_MAX_LENGTH)
    start_time = DateTimeField()

    user = ReferenceField('User', reverse_delete_rule=CASCADE)

    meta = {
        'collection': 'chatdata',
        'max_size': 2000000, # 200 MB  TODO: use Config
        'max_documents': 1000,  # 1000 entries  TODO: use Config
        'indexes': [
            '$history', # text index (full-text search / partial word mathing)
        ],
        'ordering': ['-updated']
    }

    @classmethod
    def create_new(cls, host_id: str, client_id: str, history: str, start_time: datetime, user: 'User') -> 'Chatdata':
        try:
            chatdata = Chatdata(host_id=host_id, client_id=client_id, history=history, start_time=start_time, user=user).save()
            logger.info(light_green(f"[created] chatdata {chatdata.id}.\nhost_id: {host_id}\nclient_id: {client_id}\nhistory: {history}\nuser: {user.email}"))
            return chatdata
        except Exception as e:
            logger.error(e)
            raise ChatdataSaveError("Error saving chatdata")
