# web-server/tests/config_test.py
#
# Q-1 テスト用 Config。main.py の import 連鎖(全 blueprint + init_* + submodule libcommon)が
# 起動時に check_config で要求する全キーを埋める。
#
# 方式: check_config が要求する必須キーと、import 時に直接アクセスされるキーを**明示列挙**する。
# catch-all は置かない — optional キー(`getattr(config, X, default)` でデフォルトを持つもの。
# 例: submodule logger.py の LOGGER_FORMAT_DEBUG)を不在にして、正しくデフォルトを効かせるため。
# 欠落キーは MissingKeyError / AttributeError で顕在化し、反復で補う。
#
# 本番の config.py は編集しない。conftest が `sys.modules['config'] = config_test` で差し込む
# (src 変更ゼロ。計画 Q-1「config 選択」の実装)。

import os
from enum import Enum

_LOCALES_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'locales')


class BillingSchedule(Enum):
    MONTHLY = 'monthly'
    MINUTES_5 = '5min'
    MINUTES_1 = '1min'
    SECONDS_30 = '30sec'


class Config:
    ENV = 'test'
    DEFAULT_LANG = 'en'
    SUPPORTED_LANGS = ['en', 'ja', 'zh', 'ru', 'es', 'ar', 'fr']
    HOST_URL = 'http://localhost'
    LOCALES_ROOT = _LOCALES_ROOT
    SESSION_COOKIE_NAME = 'session'
    MAIL_SUPPORT = 'support@example.com'
    FLASK_APP_SECRET_KEY = 'test-flask-app-secret-key'
    PASSWORD_ENCRYPT_KEY = '0123456789abcdef0123456789abcdef'  # 32 bytes(AES 想定)
    GOOGLE_OAUTH_CLIENT_ID = 'test-google-oauth-client-id.apps.googleusercontent.com'
    BASIC_AUTH_USERNAME = 'testuser'
    BASIC_AUTH_PASSWORD = 'testpass'

    # 課金・LLM 系(数値)
    FIRST_MONTH_FREE_CREDIT = 0
    UNIT_PRICE_USD = 0.01
    USAGE_LIMIT_DEFAULT = 100
    GENERAL_CREDIT_PER_RESPONSE = 1
    INTERVIEW_CREDIT_PER_RESPONSE = 1
    MONTHLY_FREE_CREDIT = 0
    PAYMENT_MAX_RETRIES = 3
    PAYMENT_RETRY_DELAY = 1

    # メール送信(SES)
    SENDER = 'noreply@example.com'
    REPLY_TO = 'support@example.com'
    SES_AWS_REGION = 'us-east-1'
    MAIL_NOREPLY = 'noreply@example.com'
    MAIL_SYSTEM = 'system@example.com'
    NEXT_BILLING_SCHEDULE = BillingSchedule.MONTHLY
    VERIFICATION_CODE_EXPIRED_HOUR = 24
    LLM_CHECKPOINT = 'test-llm-checkpoint'
    LLM_MAX_CONTEXT = 2048
    LLM_MAX_TOKENS = 512

    # MongoDB
    MONGO_DB_HOST = 'localhost'
    MONGO_DB_PORT = 27017
    MONGO_DB_USER = 'testuser'
    MONGO_DB_PASSWORD = 'testpass'
    MONGO_DB_NAME = 'service_test'

    # Stripe / AWS
    STRIPE_SECRET_KEY = 'sk_test_dummy'
    AWS_ACCESS_KEY_ID = 'test-access-key-id'
    AWS_SECRET_ACCESS_KEY = 'test-secret-access-key'
    AWS_DEFAULT_REGION = 'us-east-1'

    # VectorDB
    VECTORDB_HOST = 'localhost'
    VECTORDB_PORT = 6333
    VECTORDB_EMBEDDING_DIM = 768
    VECTORDB_ENCODER_CHECKPOINT = 'test-encoder-checkpoint'

    # Redis(session はセッション、それ以外は各用途)。DB_NUMBER/PORT/SEC は数値。
    REDIS_SESSION_HOST = 'localhost'
    REDIS_SESSION_PORT = 6379
    REDIS_SESSION_DB_NUMBER = 0
    REDIS_SESSION_EXPIRATION_TIME_SEC = 3600
    REDIS_SESSION_LOGLEVEL = 'DEBUG'
    REDIS_CHATDATA_QUEUE_NAME = 'test-chatdata-queue'

    # RabbitMQ
    RABBITMQ_WEB_HOST = 'localhost'
    RABBITMQ_WEB_PORT = 5672
    RABBITMQ_WEB_USER = 'testuser'
    RABBITMQ_WEB_PASSWORD = 'testpass'
    RABBITMQ_VECTORDB_HOST = 'localhost'
    RABBITMQ_VECTORDB_PORT = 5672
    RABBITMQ_VECTORDB_USER = 'testuser'
    RABBITMQ_VECTORDB_PASSWORD = 'testpass'


# 各用途の Redis グループを一括供給(HOST/PORT/DB_NUMBER/EXPIRATION_TIME_SEC/LOGLEVEL)。
# SESSION は上で明示済み。残りをここで補う。
for _g in ('ACCESS', 'BASIC_CONFIG', 'CHATDATA', 'INTERACTION_MODEL', 'RESULTS_VECTORDB', 'RESULTS_WEB'):
    setattr(Config, f'REDIS_{_g}_HOST', 'localhost')
    setattr(Config, f'REDIS_{_g}_PORT', 6379)
    setattr(Config, f'REDIS_{_g}_DB_NUMBER', 0)
    setattr(Config, f'REDIS_{_g}_EXPIRATION_TIME_SEC', 3600)
    setattr(Config, f'REDIS_{_g}_LOGLEVEL', 'DEBUG')


class MissingKeyError(Exception):
    """本番 config_helper.check_config と同契約。"""
    pass


def check_config(config, required_keys):
    """欠落 or None のキーがあれば MissingKeyError。config_test では全て通る想定。"""
    missing_or_none_keys = [
        key for key in required_keys
        if not hasattr(config, key) or getattr(config, key) is None
    ]
    if missing_or_none_keys:
        raise MissingKeyError(
            f"Missing or None configuration keys: {', '.join(missing_or_none_keys)}"
        )
