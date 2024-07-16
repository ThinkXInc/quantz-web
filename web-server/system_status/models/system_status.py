from mongoengine import (
    Document, FloatField, IntField, ListField, ReferenceField, BooleanField, StringField
)
import datetime

from libcommon.mongomodel import MongoModel

# Logger
from libcommon.logger import Logger
from libcommon.color import *
logger = Logger('system_status.py')
logger.setLevel(logger.DEBUG)

class GeneralSystemStatus(MongoModel):
    is_signup_restricted = BooleanField(default=False)
    wait_list_emails = ListField(StringField(), default=list)

    meta = {
        'collection': 'general_system_status',
        'max_size': 2000000, # 200 MB  TODO: use Config
        #'max_documents': 1000,  # 1000 entries  TODO: use Config
        'ordering': ['-updated']
    }

class Congestion(MongoModel):
    start_time = FloatField(required=True)  # the first timestamp of access record
    end_time = FloatField(required=True)  # the last timestamp of access record
    host_ids = ListField(StringField(), default=list)  # all host ids within the timeframe (0.5 sec)

    meta = {
        'collection': 'congestion',
        'max_size': 2000000, # 200 MB  TODO: use Config
        #'max_documents': 1000,  # 1000 entries  TODO: use Config
        'ordering': ['-updated']
    }

    def to_datetime(self, time_stamp, timezone="UTC"):
        """
        Convert a UTC timestamp to a datetime object in the specified timezone.
        
        :param time_stamp: float, UTC timestamp as returned by time.time()
        :param timezone: str, the timezone to convert the timestamp into
        :return: datetime.datetime, the converted datetime object
        """
        tz = pytz.timezone(timezone)
        return datetime.datetime.fromtimestamp(time_stamp, tz)

class DailySystemStatus(MongoModel):
    n_new_signups = IntField(required=True, default=0)  # created user count
    n_new_materials = IntField(required=True, default=0)  # created material count
    n_active_users = IntField(required=True, default=0)  # active users count
    n_total_usage = IntField(required=True, default=0)  # total chat usage
    congestions = ListField(ReferenceField(Congestion))

    meta = {
        'collection': 'daily_system_status',
        'max_size': 2000000, # 200 MB  TODO: use Config
        #'max_documents': 1000,  # 1000 entries  TODO: use Config
        'ordering': ['-updated'],
        'indexes': [
        ]
    }

