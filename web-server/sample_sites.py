from flask import Flask, render_template, request, g, jsonify, Blueprint
from flask_httpauth import HTTPBasicAuth
import stripe
import json
import pytz
from datetime import datetime, timezone

# Web API Tools
from libcommon.web.flask_helpers import language_wrapper

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'DEFAULT_LANG',
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

DEFAULT_LANG = Config.DEFAULT_LANG

# Locale
from libcommon.locale import Locale, COMMON_LOCALES_FILE_PATHS
LOCALES_ROOT = Config.LOCALES_ROOT
locale = Locale([
    ] + COMMON_LOCALES_FILE_PATHS
)

auth = HTTPBasicAuth()
basic_auth_users = {
    "citywalk": "klawytic"
}

blueprint_sample_sites = Blueprint('sample_sites', __name__)

@blueprint_sample_sites.route('/samples/basicA')
@language_wrapper
def samples_basicA_handler(lang, lang_name):
    return render_template(
        'sample_sites/basic_A.html',
        lang=lang,
        lang_name=lang_name)
 
@blueprint_sample_sites.route('/samples/basicA_')
@language_wrapper
def samples_basicA_plane_handler(lang, lang_name):
    return render_template(
        'sample_sites/basic_A_plane.html',
        lang=lang,
        lang_name=lang_name)

# tech school
@blueprint_sample_sites.route('/samples/techschool')
@language_wrapper
def samples_techschool_handler(lang, lang_name):
    return render_template(
        'sample_sites/tech_school.html',
        lang=lang,
        lang_name=lang_name)

@blueprint_sample_sites.route('/samples/techschool_')
@language_wrapper
def samples_blue_handler(lang, lang_name):
    return render_template(
        'sample_sites/blue.html',
        lang=lang,
        lang_name=lang_name)
 
# 6th mobile
@blueprint_sample_sites.route('/samples/6thmobile')
@language_wrapper
def samples_6thmobile_handler(lang, lang_name):
    return render_template(
        'sample_sites/6thmobile.html',
        lang=lang,
        lang_name=lang_name)

@blueprint_sample_sites.route('/samples/6thmobilejp')
@language_wrapper
def samples_6thmobilejp_handler(lang, lang_name):
    return render_template(
        'sample_sites/6thmobilejp.html',
        lang=lang,
        lang_name=lang_name)
 
@blueprint_sample_sites.route('/samples/6thmobile_')
@language_wrapper
def samples_6thmobile_with_button_handler(lang, lang_name):
    return render_template(
        'sample_sites/6thmobile_with_button.html',
        lang=lang,
        lang_name=lang_name)

@blueprint_sample_sites.route('/samples/6thmobilejp_')
@language_wrapper
def samples_6thmobilejp_with_button_handler(lang, lang_name):
    return render_template(
        'sample_sites/6thmobilejp_with_button.html',
        lang=lang,
        lang_name=lang_name)

# sushi universe
@blueprint_sample_sites.route('/samples/sushi')
@language_wrapper
def samples_sushi_handler(lang, lang_name):
    return render_template(
        'sample_sites/sushi.html',
        lang=lang,
        lang_name=lang_name)

@blueprint_sample_sites.route('/samples/sushi_')
@language_wrapper
def samples_sushi_with_button_handler(lang, lang_name):
    return render_template(
        'sample_sites/sushi_with_button.html',
        lang=lang,
        lang_name=lang_name)

@blueprint_sample_sites.route('/samples/sushijp')
@language_wrapper
def samples_sushijp_handler(lang, lang_name):
    return render_template(
        'sample_sites/sushijp.html',
        lang=lang,
        lang_name=lang_name)

@blueprint_sample_sites.route('/samples/sushijp_')
@language_wrapper
def samples_sushijp_with_button_handler(lang, lang_name):
    return render_template(
        'sample_sites/sushijp_with_button.html',
        lang=lang,
        lang_name=lang_name)

# jessica online store

@blueprint_sample_sites.route('/jessicas')
@language_wrapper
def samples_jessica_onlinestore_handler(lang, lang_name):
    return render_template(
        'sample_sites/jessica_onlinestore.html',
        lang=lang,
        lang_name=lang_name)


