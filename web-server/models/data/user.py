from enum import Enum
from datetime import datetime, timedelta
import pytz
from typing import Tuple
import re
from bson import ObjectId, errors
import random
import secrets
from urllib.parse import urlparse
from libcommon.mongomodel import MongoModel
from libcommon.language import Language
from libcommon.enumlocale import EnumLocale
from libcommon.dateutils import expiration_datetime
from libcommon.cipher import Cipher

from mongoengine import (
    Document, StringField, EmailField, IntField, FloatField, ObjectIdField, ListField,
    BooleanField, DateTimeField, EmbeddedDocumentField, EmbeddedDocument,
    ReferenceField, ValidationError, Q, DoesNotExist, MultipleObjectsReturned,
    NotUniqueError
)
from mongoengine.fields import DecimalField

# Logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# AccessDB
from accessdb.host_manager import HostManager, HostSettingError

# NOTE: so far avoid lang dependent values to user
# # Locale
# from libcommon.locale import Locale
# LOCALES_ROOT = Config.LOCALES_ROOT
# USER_DEFAULTS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/user_defaults.json'
# locale = Locale([USER_DEFAULTS_LOCALE_FILE_PATH])

# Config
from config import Config, check_config, BillingSchedule
REQUIRED_KEYS_IN_CONFIG = [
    'ENV',
    'DEFAULT_LANG',
    'USAGE_LIMIT_DEFAULT',
    'VERIFICATION_CODE_EXPIRED_HOUR',
    'NEXT_BILLING_SCHEDULE',
    'STRIPE_SECRET_KEY',
    'REDIS_ACCESS_HOST',
    'REDIS_ACCESS_PORT',
    'REDIS_ACCESS_DB_NUMBER',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

# Stripe
import stripe
stripe.api_key = Config.STRIPE_SECRET_KEY

# Celery task
from celery.exceptions import CeleryError


LANGUAGE = [lang.value for lang in Language] # ('ja', 'en', ..)

ENV = Config.ENV
DEFAULT_LANG = Config.DEFAULT_LANG
ORIGIN_MAX_LENGTH = 100
FIRST_NAME_MAX_LENGTH = 100
LAST_NAME_MAX_LENGTH = 100
VERIFICATION_CODE_DIGIT = 4
VERIFICATION_CODE_EXPIRED_HOUR = Config.VERIFICATION_CODE_EXPIRED_HOUR
USAGE_LIMIT_DEFAULT = Config.USAGE_LIMIT_DEFAULT
NEXT_BILLING_SCHEDULE = Config.NEXT_BILLING_SCHEDULE
REDIS_ACCESS_HOST = Config.REDIS_ACCESS_HOST
REDIS_ACCESS_PORT = Config.REDIS_ACCESS_PORT
REDIS_ACCESS_DB_NUMBER = Config.REDIS_ACCESS_DB_NUMBER

class UserSaveError(Exception):
    pass

class UserAlreadyExistsError(Exception):
    pass

class UserNotFoundError(Exception):
    pass

class UnauthorizedAccessError(Exception):
    pass

class UserQueryError(Exception):
    pass

class UserUpdateError(Exception):
    pass

class UserDeleteError(Exception):
    pass

class InvalidFQDNError(Exception):
    pass

class OriginIsNeitherSameAsEmailNorIncludingUrlError(Exception):
    pass

class InvalidPasswordResetCodeError(Exception):
    pass

class PasswordResetCodeExpiredError(Exception):
    pass

class VerificationCodeExpiredError(Exception):
    pass

class VerificationCodeMismatchError(Exception):
    pass

class OriginAlreadyExistsError(Exception):
    pass


def validate_verification_code(value):
    if not value.isdigit() or len(value) != VERIFICATION_CODE_DIGIT:
        raise ValidationError(
            f"Verification code must be exactly {VERIFICATION_CODE_DIGIT} digits.")

class PaymentStatus(Enum):
    SUCCESS = 'success'
    NO_CHARGE = 'nocharge'
    CARD_DECLINED = 'card_declined'
    STRIPE_ERROR = 'stripe_error'
    CONFIGURATION_ERROR = 'configuration_error'
    NETWORK_ERROR = 'network_error'
    UNKNOWN_ERROR = 'unknown_error'

class ColorTheme(EnumLocale):
    light = 'light'
    dark = 'dark'

class ApplyChangeDelayInSec(EnumLocale):
    immediately = 0
    three_minutes_later = 60*3
    one_hour_later = 3600
    twenty_four_hour_later = 3600 * 24

class ButtonType:
    A = 'A'
    B = 'B'

class Customize(EmbeddedDocument):
    #operator_name = StringField(max_length=100, default="Quantz")
    #first_message = StringField(max_length=100, default="")
    button_type = StringField(choices=[ButtonType.A, ButtonType.B], default=ButtonType.A)
    button_width = IntField(default=260)  # px
    button_height = IntField(default=50)  # px
    button_color = StringField(default="#0067FF")
    font_size = FloatField(default=13.0)  # px
    balloon_width = IntField(default=35)  # vw
    balloon_height = IntField(default=30)  # vh

class Counter(Document):
    name = StringField(required=True)
    value = IntField(required=True)

    meta = {'collection': 'counters'}

def get_next_user_index():
    counter = Counter.objects(name='user_index').modify(upsert=True, new=True, inc__value=1)
    return counter.value

class User(MongoModel):
    email = EmailField(required=False, unique=True)
    suspended_email = EmailField(required=False, unique=False)
    password = StringField(required=False)
    google_id = StringField(required=False)  # null duplicates

    origin = StringField(max_length=ORIGIN_MAX_LENGTH)
    verified_emails = ListField()

    first_name = StringField(max_length=FIRST_NAME_MAX_LENGTH)
    last_name = StringField(max_length=LAST_NAME_MAX_LENGTH)

    stripe_customer_id = StringField(required=False)
    payment_method_id = StringField(required=False)

    user_index = IntField(unique=True)

    usage_limit = IntField(default=USAGE_LIMIT_DEFAULT)
    free_call = IntField(default=0)

    last_payment_intent_id = StringField(required=False)
    last_payment_status = StringField(choices=[status.value for status in PaymentStatus])
    last_payment_error = StringField(required=False)
    last_payment_date = DateTimeField()

    materials = ListField(ReferenceField('Material'))

    customize = EmbeddedDocumentField(Customize, default=Customize, required=True)

    lang = StringField(choices=LANGUAGE, default=DEFAULT_LANG)

    verification_code = StringField(
        validation=validate_verification_code,
        help_text=f"Must be exactly {VERIFICATION_CODE_DIGIT} digits")
    verification_code_expiration = DateTimeField()

    password_reset_code = StringField(required=False)
    password_reset_code_expiration = DateTimeField()

    start_billing = DateTimeField()
    next_billing = DateTimeField()

    # configurations
    color_theme = StringField(
        choices=ColorTheme.names(),
        default=ColorTheme.dark.name)
    
    # NOTE: WILL DEPRECATE
    apply_change_delay_sec = IntField(
        choices=ApplyChangeDelayInSec.values(),
        default=ApplyChangeDelayInSec.three_minutes_later.value)

    meta = {
        'collection': 'user',
        'max_size': 2000000, # 200 MB  TODO: use Config
        'max_documents': 1000,  # 1000 entries  TODO: use Config
        'indexes': [
            '#email', # hashed index (complete match)
            {'fields': ['google_id'], 'unique': True, 'sparse': True}  # unique but null allowed
        ]
    }

    def response_json(self, excludes=['password', 'verification_code', 'materials']):#, 'verified_emails']):
        # Generate JSON response with verification status
        data = super().response_json(excludes)
        if self.suspended_email:
            data['is_email_verified'] = False
        elif self.email in self.verified_emails:
            data['is_email_verified'] = True

        if self.email:
            try:
                data['origin_type'] = self.check_origin(self.origin)
                data['is_origin_verified'] = True
            except InvalidFQDNError:
                data['is_origin_verified'] = False
                data['origin_type'] = ''
            except OriginIsNeitherSameAsEmailNorIncludingUrlError:
                data['is_origin_verified'] = False
                data['origin_type'] = ''
        logger.debug(cyan(f'Response JSON prepared: {data}'))
        return data

    @staticmethod
    def ensure_utc(dt):
        """Ensure datetime is timezone-aware in UTC."""
        if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
            # The datetime is naive, localize it to UTC
            return pytz.utc.localize(dt)
        else:
            # The datetime is already timezone-aware, convert it to UTC
            return dt.astimezone(pytz.utc)

    def save(self, *args, **kwargs):
        """ Override the save method to ensure dates are in UTC. """
        if self.start_billing:
            self.start_billing = self.ensure_utc(self.start_billing)
        
        if self.next_billing:
            self.next_billing = self.ensure_utc(self.next_billing)
        
        super(User, self).save(*args, **kwargs)

    #def save(self, *args, **kwargs):
    #    """ Override the save method to ensure dates are in UTC. """
    #    #if self.start_billing and self.start_billing.tzinfo is None:
    #    #    self.start_billing = pytz.utc.localize(self.start_billing)

    #    #if self.next_billing and self.next_billing.tzinfo is None:
    #    #    self.next_billing = pytz.utc.localize(self.next_billing)
    #    logger.debug(yellow(f'trying to save user as {self}'))
    #    return super(User, self).save(*args, **kwargs)

    @staticmethod
    def generate_random_verification_code() -> str:
        return str(random.randint(1000, 9999))

    @classmethod
    def create_new(cls, suspended_email, password, **kwargs):
        # Check if the suspended_email already exists as any User.email
        if cls.objects(email=suspended_email).first():
            logger.error(yellow(f"{suspended_email} user already exists."))
            raise UserAlreadyExistsError(f"User already exists with email: {suspended_email}")
    
        try:
            encrypted_password = Cipher.encrypt(password)  # Assuming Cipher.encrypt is defined elsewhere
            user = cls(
                suspended_email=suspended_email, password=encrypted_password, user_index=get_next_user_index(), **kwargs)
            user.save()
            logger.info(green(f"User created with email: {suspended_email}"))
            return user
        except ValidationError as ve:
            logger.error(red(f"Validation Error: {ve}"))
            raise UserSaveError("Validation failed for creating user.")
        except Exception as e:
            logger.error(red(f"Error creating user: {e}"))
            raise UserSaveError("An unexpected error occurred while creating user.")
    
    @classmethod
    def create_new_google_oauth(cls, email, google_id, **kwargs):
        # Check if the user already exists by google_id or email
        existing_user = cls.objects(Q(google_id=google_id) | Q(email=email)).first()
        if existing_user:
            if existing_user.google_id == google_id:
                logger.info(f"User already exists with Google ID: {google_id}")
                raise UserAlreadyExistsError(f"User already exists with google_id: {google_id}")
            else:
                logger.error(f"Email conflict: {email} already registered with a different Google ID.")
                raise UserAlreadyExistsError(f"User already exists with email: {email}")

        # If no existing user, create a new one
        try:
            user = cls(email=email, google_id=google_id, user_index=get_next_user_index(), **kwargs)
            user.save()  # Assuming save handles both insertion and validation
            logger.info(green(f"New user created with Google OAuth. Email: {email}, Google ID: {google_id}"))
            return user
        except ValidationError as ve:
            logger.error(red(f"Validation Error while creating user: {ve}"))
            raise UserSaveError("Validation failed for creating user.")
        except Exception as e:
            logger.error(red(f"Error creating user with Google OAuth: {e}"))
            raise UserSaveError("An unexpected error occurred while creating user with Google OAuth.")

    @classmethod
    def find_user_by_email(cls, email):
        try:
            user = cls.objects(email=email).first()
            if not user:
                logger.error(yellow(f"User not found with email: {email}"))
                raise UserNotFoundError(f"User not found with email: {email}")
            return user
        except UserNotFoundError:
            raise
        except DoesNotExist:
            logger.error(yellow(f"User not found with email: {email}"))
            raise UserNotFoundError(f"User not found with email: {email}")
        except Exception as e:
            logger.error(red(f"Error finding user: {e}"))
            raise UserQueryError("An error occurred while querying user.")
    
    @classmethod
    def find_user_by_id(cls, user_id):
        try:
            user = cls.objects(id=user_id).first()
            if not user:
                logger.error(red(f"User not found with ID: {user_id}"))
                raise UserNotFoundError(f"User not found with ID: {user_id}")
            logger.info(green(f"User found with ID: {user_id}"))
            return user
        except UserNotFoundError:
            raise
        except DoesNotExist:
            logger.error(red(f"No User found with ID: {user_id}"))
            raise UserNotFoundError("User not found.")
        except Exception as e:
            logger.error(red(f"Error finding user by ID: {e}"))
            raise UserQueryError(f"An error occurred while querying user by ID: {e}")

    @classmethod
    def find_by_customer_id(cls, customer_id):
        try:
            user = cls.objects(stripe_customer_id=customer_id).first()
            if not user:
                logger.error(yellow(f"User not found with Stripe customer ID: {customer_id}"))
                raise UserNotFoundError(f"User not found with Stripe customer ID: {customer_id}")
            logger.info(green(f"User found with Stripe customer ID: {customer_id}"))
            return user
        except DoesNotExist:
            logger.error(yellow(f"No User found with Stripe customer ID: {customer_id}"))
            raise UserNotFoundError("User not found.")
        except Exception as e:
            logger.error(red(f"Error finding user by Stripe customer ID: {e}"))
            raise UserQueryError(f"An error occurred while querying user by Stripe customer ID: {e}")

    @classmethod
    def update_user(cls, user_id, **updates):
        try:
            user = cls.objects(id=user_id).first()
            if not user:
                raise UserNotFoundError("User not found with ID: {}".format(user_id))
            
            if 'origin' in updates:
                new_origin = updates['origin']
                if cls.objects(origin=new_origin, id__ne=user_id).first():
                    logger.error(red(f"Origin {new_origin} is already in use by another user."))
                    raise UserUpdateError(f"Origin {new_origin} is already in use by another user.")

            for key, value in updates.items():
                if hasattr(user, key):
                    original_value = getattr(user, key)
                    if original_value != value:
                        setattr(user, key, value)
                        logger.info(f"Updated {key} for user {user_id} from {original_value} to {value}")
                else:
                    logger.error(f"{key}:{value} is invalid attribute. not in user properties.")
                    raise UserUpdateError(f"{key}:{value} is invalid attribute. not in user properties.")
            
            user.save()
            logger.info(green(f'user {user_id} updated with {updates}'))
            return user
        except ValidationError as ve:
            logger.error(f"Validation Error during update: {ve}")
            raise UserUpdateError("Validation failed during user update.")
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise UserUpdateError("An error occurred while updating user.")
    
    @classmethod
    def delete_user(cls, identifier):
        """Delete a user based on user ID or email."""
        try:
            if ObjectId.is_valid(identifier):
                # This checks if the identifier is a valid ObjectId and converts it
                user = cls.objects(id=ObjectId(identifier)).get()
            else:
                # Assume the identifier is an email
                user = cls.objects(email=identifier).get()
            user.delete()
            logger.info(f"User deleted: {identifier}")
        except DoesNotExist:
            logger.error("User not found for deletion.")
            raise UserNotFoundError("User not found for deletion.")
        except errors.InvalidId:
            logger.error("Invalid ObjectId format.")
            raise ValueError("Invalid ObjectId format.")
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise UserDeleteError("An error occurred while deleting user.")

    def update_stripe_customer_id(self, customer_id: str):
        try:
            self.stripe_customer_id = customer_id
            self.save()
            logger.info(f"Updated Stripe customer ID for user {self.email} to {self.stripe_customer_id}")
        except Exception as e:
            logger.error(f"Failed to update Stripe customer ID for user {self.email}: {str(e)}")
            raise UserUpdateError(f"Failed to update Stripe customer ID: {str(e)}")

    def update_stripe_payment_method_id(self, payment_method_id: str):
        try:
            self.payment_method_id = payment_method_id
            self.save()
            logger.info(f"Updated Stripe payment method ID for user {self.email} to {self.payment_method_id}")
        except Exception as e:
            logger.error(f"Failed to update Stripe payment method ID for user {self.email}: {str(e)}")
            raise UserUpdateError(f"Failed to update Stripe payment method ID: {str(e)}")

    def update_verification_code(self) -> str:
        try:
            new_code = User.generate_random_verification_code()
            validate_verification_code(new_code)  # This will raise ValidationError if invalid
            self.verification_code = new_code
            self.verification_code_expiration = datetime.utcnow() + timedelta(hours=VERIFICATION_CODE_EXPIRED_HOUR)
            self.save()
            return new_code
        except ValidationError as ve:
            logger.error(red(f"Validation Error: {ve}"))
            raise UserUpdateError(f"Invalid verification code: {ve}")
        except Exception as e:
            logger.error(red(f"Error updating verification code: {e}"))
            raise UserUpdateError("An unexpected error occurred while updating the verification code.")

    def check_verification_code(self, code):
        """Checks if the provided verification code matches and is not expired."""
        if datetime.utcnow() > self.verification_code_expiration:
            logger.error(red("The verification code has expired."))
            raise VerificationCodeExpiredError("The verification code has expired.")
        if self.verification_code != code:
            logger.error(red("The verification code does not match."))
            raise VerificationCodeMismatchError("The verification code does not match.")
        return True

    def email_to_verified(self):
        try:
            if self.suspended_email:
                logger.debug(f"user has suspended_email {self.suspended_email}")
                if not User.objects(email=self.suspended_email):
                    logger.debug(f"No user with email {self.suspended_email} has been confirmed.")
                    self.email = self.suspended_email
                    self.suspended_email = None
                    self.verification_code = None
                    if self.email not in self.verified_emails:
                        self.verified_emails.append(self.email)
                    self.save()
                    return self
                else:
                    logger.error(f"Email conflict: {self.suspended_email} already registered with a different Google ID.")
                    raise UserAlreadyExistsError(f"User already exists with email: {self.suspended_email}")
            elif self.email:
                logger.warning(yellow(f"User {self.email} already verified."))
                self.verification_code = None
                if self.email not in self.verified_emails:
                    self.verified_emails.append(self.email)
                self.save()
                return self
            else:
                logger.debug(red(f"[WARNING] no suspended_email in user."))
                raise ValueError(f"suspended_email must be in user")
        except Exception as e:
            logger.error(red(e))
            raise UserUpdateError("Error updating user")

    def update_password_reset_code(self) -> (str, datetime):
        try:
            self.password_reset_code = secrets.token_urlsafe(16)  # Generates a random URL-safe text string.
            self.password_reset_code_expiration = expiration_datetime(after_hours=48)  # Sets the code to expire in 48 hours.
            self.save()
            logger.info(green(f"Password reset code updated for user {self.id}"))
            return self.password_reset_code, self.password_reset_code_expiration
        except Exception as e:
            logger.error(red(f"Error updating password reset code: {e}"))
            raise UserUpdateError("Failed to update password reset code.")

    def check_password_reset_code(self, code):
        if self.password_reset_code_expiration < datetime.now():
            logger.error(red("Password reset code has expired."))
            raise PasswordResetCodeExpiredError("Password reset code has expired.")
        if self.password_reset_code != code:
            logger.error(red("Invalid password reset code provided."))
            raise InvalidPasswordResetCodeError("Invalid password reset code.")
        return True

    def is_password_reset_code_expired(self):
        current_time_utc = datetime.now(pytz.utc)
        return self.ensure_utc(current_time_utc) > self.ensure_utc(self.password_reset_code_expiration)

    def update_password(self, new_password):
        try:
            self.password = Cipher.encrypt(new_password)  # Encrypt the new password
            self.save()  # Save the updated user information to the database
            logger.info(green(f"Password updated for user {self.id}"))
        # NOTE:
        # Don't check password format here. use @regex_check in flask_helper
        # except ValidationError as e:
        #     logger.error(red(f"Error updating password for user {self.id}: {e}"))
        #     raise ValidationError("Failed to update password.")
        except Exception as e:
            logger.error(red(f"Error updating password for user {self.id}: {e}"))
            raise UserUpdateError("Failed to update password.")

    @classmethod
    def update_origin(cls, user_id, new_origin):
        # Attempt to find the user by ID first
        user = cls.objects(id=user_id).first()
        if not user:
            logger.error(f"No user found with ID {user_id}")
            raise UserNotFoundError(f"No user found with the provided ID: {user_id}")

        # Check if the new origin is already used by another user
        existing_user = cls.objects(origin=new_origin).first()
        if existing_user and existing_user.id != user_id:
            logger.error(f"Attempt to update to an existing origin {new_origin} for user {user.email}")
            raise OriginAlreadyExistsError(f"The origin '{new_origin}' is already in use by another user.")

        # If not used, update the user's origin
        try:
            last_origin = user.origin
            if last_origin == new_origin:
                # same origin
                logger.info(green(f"Origin tried to update but not changed."))
                return

            if not last_origin:
                # create origin for new user
                user.update(origin=new_origin)
                # DEV
                if ENV == 'develop':
                    host_manager = HostManager(
                        host=REDIS_ACCESS_HOST,
                        port=REDIS_ACCESS_PORT,
                        db_number=REDIS_ACCESS_DB_NUMBER)
                    for i in range(100):
                        logger.info(cyan(f"[DEV] add 100 usage."))
                        host_manager.increment_host_usage(new_origin)
            else:
                # migrate current usage when origin is updated
                host_manager = HostManager(
                    host=REDIS_ACCESS_HOST,
                    port=REDIS_ACCESS_PORT,
                    db_number=REDIS_ACCESS_DB_NUMBER)

                start_timestamp = int(User.ensure_utc(user.start_billing).timestamp())
                end_timestamp = int(User.ensure_utc(user.next_billing).timestamp())
                current_usage = host_manager.retrieve_usage_for_billing_period(
                    last_origin, start_timestamp, end_timestamp)

                host_manager.delete_host(last_origin)
                host_manager.set_host(
                    new_origin, str(user.id), user.usage_limit, user.start_billing, user.next_billing)

                if current_usage > 0:
                    host_manager.delete_host_usage(last_origin, start_timestamp, end_timestamp)
                    host_manager.set_host_usage(new_origin, current_usage)

                user.update(origin=new_origin)

                usage = host_manager.retrieve_usage_for_billing_period(
                    new_origin, start_timestamp, end_timestamp)
                logger.info(green(f"Origin updated successfully for user {user.email} to {new_origin} [usage {usage}]"))

        except Exception as e:
            logger.error(red(f"Failed to update origin for user {user.email}: {e}"))
            raise UserUpdateError(f"An unexpected error occurred while updating the origin: {e}")

    @classmethod
    def update_usage_limit(cls, user, new_limit: int):
        try:
            User.update_user(user.id, usage_limit=new_limit)
            host_manager = HostManager(
                host=REDIS_ACCESS_HOST,
                port=REDIS_ACCESS_PORT,
                db_number=REDIS_ACCESS_DB_NUMBER)
            host_manager.set_host(
                user.origin, str(user.id), new_limit, user.start_billing, user.next_billing)
        except Exception as e:
            logger.error(red(f"Failed to update origin for user {user.email}: {e}"))
            raise UserUpdateError(f"An unexpected error occurred while updating the origin: {e}")

    @staticmethod
    def is_valid_fqdn(hostname):
        # Validate FQDN format
        if not hostname or '/' in hostname.rstrip('/'):
            logger.debug(cyan('Invalid hostname or hostname with trailing slash.'))
            return False

        fqdn_regex = r'^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$'
        if re.match(fqdn_regex, hostname) is None:
            logger.debug(cyan(f'Hostname {hostname} does not match FQDN regex.'))
            return False

        logger.info(cyan(f'Hostname {hostname} is a valid FQDN.'))
        return True

    def check_origin(self, origin) -> (bool, str):
        """
        Check origin comparing user.email.

        Args:
            origin (str): The origin URL to be validated.

        Returns:
            tuple:
                - bool: True if the origin is valid (matches email domain or has a valid path), False otherwise.
                - str: A string 'original', 'public', or an empty string '' indicating the type of origin or an error.

        The function uses regular expressions to validate the FQDN and parses the URL to dissect the domain and path components. Logging is used to trace the validation steps and outcomes.

        Examples:
            >>> user.check_origin("http://rakuten.com/shop")
            (True, 'public')

            >>> user.check_origin("http://domain")
            (False, '')

            >>> user.check_origin("http://mydomain.com")
            (True, 'original')  # user.email is ..@mydomain.com

            >>> user.check_origin("http://mydomain.com")
            (False, '')  # user.email is ..@gmail.com

        Note:
            The method assumes `self.email` contains a valid email address and uses Python's `re` and `urllib.parse` modules for regex matching and URL parsing.
        """
        # Check origin against FQDN and email domain
        email_domain = self.email.split('@')[-1]
        origin_netloc = urlparse(f'http://{origin}').netloc
        origin_domain = origin_netloc.split(':')[0]
        parsed_origin = urlparse(f'http://{origin}')
        logger.debug(f'email domain: {email_domain}')
        logger.debug(f'origin netloc: {origin_netloc}')
        logger.debug(f'origin domain: {origin_domain}')
        logger.debug(f'parsed origin: {parsed_origin}')

        if not self.is_valid_fqdn(origin_domain):
            logger.error(orange(f'Origin {origin} is not a valid FQDN.'))
            raise InvalidFQDNError

        elif parsed_origin.path not in ['', '/']:
            logger.info(green(f'[origin type: public] Origin {parsed_origin.path} has a valid path and is considered verified.'))
            return 'public'

        elif email_domain == origin_domain:
            logger.info(green(f'[origin type: original] Origin domain {origin_domain} matches email domain {email_domain}.'))
            return 'original'

        else:
            logger.error(yellow(f'Origin {origin_netloc} neither same as email domain nor including some url.'))
            raise OriginIsNeitherSameAsEmailNorIncludingUrlError

    @staticmethod
    def get_start_billing_date() -> datetime:
        utc_now = datetime.now(pytz.utc)
        return utc_now

    @staticmethod
    def get_billing_dates() -> Tuple[datetime, datetime]:
        start_billing = User.get_start_billing_date()
        next_billing = User.calculate_next_billing_date(start_billing)
        return start_billing, next_billing

    @staticmethod
    def calculate_next_billing_date(start_date: datetime) -> datetime:
        """
        Calculate the next billing date according to the billing schedule configuration.
        """
        if start_date.tzinfo is None or start_date.tzinfo.utcoffset(start_date) is None:
            raise ValueError(f"start_date must be timezone-aware and in UTC but {start_date} {start_date.tzinfo}")

        schedule = NEXT_BILLING_SCHEDULE
        if schedule == BillingSchedule.MONTHLY:
            one_month_later = start_date.replace(day=1) + timedelta(days=32)
            max_day_of_next_month = one_month_later.replace(day=1) - timedelta(days=1)

            if start_date.day > max_day_of_next_month.day:
                next_billing_date = max_day_of_next_month
            else:
                next_billing_date = start_date.replace(month=one_month_later.month, year=one_month_later.year, day=start_date.day)
        elif schedule == BillingSchedule.MINUTES_5:
            next_billing_date = start_date + timedelta(minutes=5)
        elif schedule == BillingSchedule.MINUTES_1:
            next_billing_date = start_date + timedelta(minutes=1)
        elif schedule == BillingSchedule.SECONDS_30:
            next_billing_date = start_date + timedelta(seconds=30)
        else:
            logger.error(red(f"Unsupported billing schedule: {schedule}"))
            raise ValueError(f"Unsupported billing schedule: {schedule}")

        logger.info(cyan(f"Next billing date for {schedule.value} is set to: {next_billing_date} {next_billing_date.tzinfo}"))
        return next_billing_date.astimezone(pytz.utc)

    def retrieve_billing_history(self):
        try:
            if not self.stripe_customer_id:
                raise ValueError("No Stripe customer ID associated with this user.")
            
            # Retrieve all invoices for the customer
            invoices = stripe.Invoice.list(customer=self.stripe_customer_id)
            return invoices
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error occurred: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to retrieve billing history: {e}")
            raise

    def execute_billing_charge(self, price, currency="usd", description="Charge for service"):
        try:
            if not self.stripe_customer_id:
                raise ValueError("No Stripe customer ID associated with this user.")
            
            # Retrieve the current payment method from Stripe
            payment_methods = stripe.PaymentMethod.list(
                customer=self.stripe_customer_id,
                type='card'
            )
            if not payment_methods.data:
                raise ValueError("No valid payment methods found for customer.")

            current_payment_method_id = payment_methods.data[0].id
            logger.info(f'payment_methods for user {self.id} -> {current_payment_method_id}')

            # If the payment method has changed, update the user and log the change
            if self.payment_method_id != current_payment_method_id:
                self.update_stripe_payment_method_id(current_payment_method_id)
            else:
                logger.info(f'payment method for user {self.id} is already up to date.')

            payment_intent = stripe.PaymentIntent.create(
                amount=int(price * 100),  # Convert price to cents
                currency='usd',
                customer=self.stripe_customer_id,
                payment_method=self.payment_method_id,
                automatic_payment_methods={"enabled": True},
                receipt_email=self.email,
                off_session=True,
                confirm=True,
                description=description,
                metadata={
                    "email": self.email
                }
            )
            if not payment_intent or 'id' not in payment_intent:
                raise ValueError("Failed to create a valid payment intent.")

            return payment_intent
        except stripe.error.CardError as e:
            logger.error(yellow(e))
            payment_intent_id = e.error.payment_intent['id']
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            self.last_payment_intent_id = payment_intent_id
            self.last_payment_status = PaymentStatus.CARD_DECLINED.value
            self.last_payment_date = datetime.now(pytz.utc)
            self.last_payment_error = str(e)
            self.save()
            raise
        except stripe.error.StripeError as e:
            logger.error(red(f"Stripe API error occurred during charge: {e}"))
            self.last_payment_intent_id = None
            self.last_payment_status = PaymentStatus.STRIPE_ERROR.value
            self.last_payment_date = datetime.now(pytz.utc)
            self.last_payment_error = str(e)
            self.save()
            raise
        except Exception as e:
            logger.error(red(f"Failed to execute charge: {e}"))
            self.last_payment_intent_id = None
            self.last_payment_status = PaymentStatus.UNKNOWN_ERROR.value
            self.last_payment_date = datetime.now(pytz.utc)
            self.last_payment_error = str(e)
            self.save()
            raise

    def schedule_payment(self, lang, execute_now=False):
        from web_tasks_server.tasks import echo, run_payment 
        if not self.next_billing:
            logger.warning(yellow("Cannot schedule payment without a next billing date."))
            return False

        if not self.stripe_customer_id:
            logger.warning(yellow("No Stripe customer ID in user. This may occur in the start using the service."))

        try:
            if execute_now:
                task = run_payment.apply_async(
                    args=[str(self.id), lang],
                )
            else:
                task = run_payment.apply_async(
                    args=[str(self.id), lang],
                    eta=self.next_billing
                )
            task_id = task.id
            logger.info(green(f"Payment scheduled for user {self.id} on {self.next_billing}, task ID: {task_id}"))
            return task_id  # Return the task ID to the caller

        except CeleryError as e:
            logger.error(red(f"Failed to schedule payment task for user {self.id}: {e}"))
            return None 