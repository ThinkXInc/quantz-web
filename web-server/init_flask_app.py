from flask import Flask, render_template, request, g, jsonify
from jinja2 import ChoiceLoader, FileSystemLoader

# Web API tools
from libcommon.web.session import RedisSessionInterface, Session
from libcommon.web.flask_helpers import configure_flask_helpers

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'SESSION_COOKIE_NAME',
    'FLASK_APP_SECRET_KEY',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

# Q-4(L-1 追随): libcommon 新初期化 API へ配線(app 起動時に config 値を注入)。
Session.configure(
    Config.REDIS_SESSION_HOST, Config.REDIS_SESSION_PORT, Config.REDIS_SESSION_DB_NUMBER)
configure_flask_helpers(
    Config.DEFAULT_LANG, Config.SUPPORTED_LANGS,
    Config.BASIC_AUTH_USERNAME, Config.BASIC_AUTH_PASSWORD)

app = Flask(__name__)
app.jinja_loader = ChoiceLoader([
    FileSystemLoader(['views/templates', 'mails/templates']),
])
app.session_interface = RedisSessionInterface(
    Config.REDIS_SESSION_HOST, Config.REDIS_SESSION_PORT,
    Config.REDIS_SESSION_DB_NUMBER, Config.REDIS_SESSION_EXPIRATION_TIME_SEC)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SESSION_COOKIE_NAME'] = Config.SESSION_COOKIE_NAME
app.config['SECRET_KEY'] = Config.FLASK_APP_SECRET_KEY