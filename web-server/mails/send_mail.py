from datetime import datetime
import pytz
from os.path import dirname, abspath
from flask import Flask, render_template
import sys
sys.path.append('../')
from models.data.user import User
from system_status.models.system_status import GeneralSystemStatus

import argparse

# Config
from config import Config, check_config
REQUIRED_KEYS_IN_CONFIG = [
    'HOST_URL',
    'MAIL_NOREPLY',
    'MAIL_SUPPORT',
    'MAIL_SYSTEM',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_DEFAULT_REGION',
    'UNIT_PRICE_USD'
]
check_config(Config, REQUIRED_KEYS_IN_CONFIG)

HOST_URL = Config.HOST_URL
MAIL_NOREPLY = Config.MAIL_NOREPLY
MAIL_SUPPORT = Config.MAIL_SUPPORT
MAIL_SYSTEM = Config.MAIL_SYSTEM
SENDER = MAIL_NOREPLY
REPLY_TO = MAIL_SUPPORT
UNIT_PRICE_USD = Config.UNIT_PRICE_USD

# Set logger
from libcommon.logger import Logger
logger = Logger()
logger.setLevel(logger.DEBUG)
from libcommon.color import *

# Local
from libcommon.locale import Locale
LOCALES_ROOT = Config.LOCALES_ROOT
EMAILS_LOCALE_FILE_PATH = f'{LOCALES_ROOT}/emails.json'
locale = Locale([EMAILS_LOCALE_FILE_PATH])

# Email
from libcommon.mail import Mail, MailSendError
mail = Mail(
    aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
    region_name=Config.AWS_DEFAULT_REGION)

# NOTE:
# In main.py, template root folder is added as:
# app.jinja_loader = ChoiceLoader([
#     FileSystemLoader(['views/templates', 'mails/templates']),
# ])
# then, proj_root/mails/templates/html/page.html can be specified as 'html/page.html'

# N-13: 旧コードはこの2ブロックを **モジュールレベル**で実行し、import のたびに本番 SES で
# 実メール2通を送信していた(本番 creds で起動のたび送信 + boto3 リトライで import ハング)。
# import 副作用を除くため関数化し、手動テスト用途は __main__ の --smoke_test で保存する。
def _smoke_test_mail_client():
    """SES メールクライアントの手動スモーク(テストメール2通を送る)。__main__ からのみ呼ぶ。"""
    # Basic test
    try:
        response = mail.send(
            sender=SENDER,
            reply_to=REPLY_TO,
            recipient='quantzdev@gmail.com',
            subject='Mail Client Test 1',
            text='This is a SES mail client test.',
            html='<body>This is a SES mail client test.</body>',
        )
        logger.info(f"Send Mail Test: success - {response}")
    except Exception as e:
        logger.error(red(f"Send Mail Test: An error occurred: {e}"))

    # Test outside flask (celery worker)
    try:
        flask_app = Flask(__name__, template_folder='templates')
        with flask_app.app_context(): # celery worker process needs context
            html = render_template(
                'html/notify_card_issue.html',
                body1="Test", url=f"https://quantz.thinkxinc.com", click="Click", body2="Test", team="Quantz Team")
            response = mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient='quantzdev@gmail.com',
                subject='Mail Client Test 2',
                text='This is a SES mail client test.',
                html=html
            )
    except Exception as e:
        logger.error(red(f"Send Mail Test: An error occurred: {e}"))

# send mails
def send_welcome_email(
    lang,
    user: User,
    verification_code: str):

    subject = locale.get('welcome_subject', lang)
    html_content = render_template(
        'html/welcome.html',
        welcome_to_quantz=locale.get('welcome_to_quantz', lang),
        body2=locale.get('welcome_body2', lang),
        verification_code=verification_code,
        enter_this_code=locale.get('welcome_enter_this_code', lang),
        team=locale.get('team', lang)
        )
    text_content = render_template(
        'plain/welcome.txt',
        welcome_to_quantz=locale.get('welcome_to_quantz', lang),
        body2=locale.get('welcome_body2', lang),
        verification_code=verification_code,
        enter_this_code=locale.get('welcome_enter_this_code', lang),
        team=locale.get('team', lang)
        )

    try:
        mail.send(
            sender=SENDER,
            reply_to=REPLY_TO,
            recipient=user.email if user.email else user.suspended_email,
            subject=subject,
            text=text_content,
            html=html_content,
            bcc=[MAIL_SYSTEM]
        )
        logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
    except MailSendError as e:
        raise MailSendError

def send_verification_email(
    lang,
    user: User,
    verification_code: str):

    subject = locale.get('verification_subject', lang)

    html_content = render_template(
        'html/verification.html',
        body1=locale.get('verification_body1', lang),
        body2=locale.get('verification_body2', lang),
        verification_code=verification_code,
        team=locale.get('team', lang)
    )
    text_content = render_template(
        'plain/verification.txt',
        body1=locale.get('verification_body1', lang),
        body2=locale.get('verification_body2', lang),
        verification_code=verification_code,
        team=locale.get('team', lang)
    )

    try:
        mail.send(
            sender=SENDER,
            reply_to=REPLY_TO,
            recipient=user.suspended_email,
            subject=subject,
            text=text_content,
            html=html_content,
            bcc=[MAIL_SYSTEM]
        )
        logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
    except MailSendError as e:
        raise MailSendError

def send_password_reset_email(
    lang,
    user: User,
    password_reset_code: str,
    password_reset_code_expiration: datetime):

    subject = locale.get('password_reset_subject', lang)

    password_reset_url = f'https://quantz.thinkxinc.com/v1/{lang}/signin?page=reset&reset_code={password_reset_code}&email={user.email}'
    password_reset_date = password_reset_code_expiration.strftime("%Y %m/%d %H:%M")

    html_content = render_template(
        'html/password_reset.html',
        body1=locale.get('password_reset_body1', lang),
        password_reset_url=password_reset_url,
        password_reset_link_text=locale.get('password_reset_link_text', lang),
        body2=locale.get('password_reset_body2', lang, [password_reset_date]),
        body3=locale.get('password_reset_body3', lang),
        team=locale.get('team', lang)
    )

    text_content = render_template(
        'plain/welcome.txt',  # Assuming you are reusing or have a template for plain text
        body1=locale.get('password_reset_body1', lang),
        password_reset_url=password_reset_url,
        password_reset_link_text=locale.get('password_reset_link_text', lang),
        body2=locale.get('password_reset_body2', lang, [password_reset_date]),
        body3=locale.get('password_reset_body3', lang),
        team=locale.get('team', lang)
    )

    try:
        mail.send(
            sender=SENDER,
            reply_to=REPLY_TO,
            recipient=user.email,
            subject=subject,
            text=text_content,
            html=html_content,
            bcc=[MAIL_SYSTEM]
        )
        logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
    except MailSendError as e:
        raise MailSendError


def send_notify_card_issue_email(user: User):
    """Run in celery worker"""
    lang = user.lang
    flask_app = Flask(__name__, template_folder='templates')  # mails/ is root
    logger.debug(flask_app.jinja_loader.searchpath)
    with flask_app.app_context(): # celery worker process needs context
        subject = locale.get('notify_card_issue_subject', lang)
        html_content = render_template(
            'html/notify_card_issue.html',
            body1=locale.get('notify_card_issue_body1', lang),
            url=f"https://quantz.thinkxinc.com/v1/{lang}/home?page=settings&key=card",
            click=locale.get('notify_card_issue_click', lang),
            body2=locale.get('notify_card_issue_body2', lang),
            #body3=locale.get('notify_card_issue_body3', lang),
            team=locale.get('team', lang)
            )
        text_content = render_template(
            'plain/notify_card_issue.txt',
            body1=locale.get('notify_card_issue_body1', lang),
            url=f"https://quantz.thinkxinc.com/v1/{lang}/home?page=settings&key=card",
            click=locale.get('notify_card_issue_click', lang),
            body2=locale.get('notify_card_issue_body2', lang),
            #body3=locale.get('notify_card_issue_body3', lang),
            team=locale.get('team', lang)
            )

        try:
            mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient=user.email,
                subject=subject,
                text=text_content,
                html=html_content,
                bcc=[MAIL_SYSTEM]
            )
            logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
        except MailSendError as e:
            raise MailSendError

def send_free_call_given_email(user: User):
    """Run in celery worker"""
    lang = user.lang
    flask_app = Flask(__name__, template_folder='templates')  # mails/ is root
    logger.debug(flask_app.jinja_loader.searchpath)
    with flask_app.app_context(): # celery worker process needs context
        free_call_in_usd = UNIT_PRICE_USD * user.free_call
        subject = locale.get('free_call_given_subject', lang, [str(user.free_call*free_call_in_usd)])
        html_content = render_template(
            'html/free_call_given.html',
            body1=locale.get('free_call_given_body1', lang),
            body2=locale.get('free_call_given_body2', lang, [str(user.free_call*free_call_in_usd)]),
            body3=locale.get('free_call_given_body3', lang),
            team=locale.get('team', lang)
            )
        text_content = render_template(
            'plain/free_call_given.txt',
            body1=locale.get('free_call_given_body1', lang),
            body2=locale.get('free_call_given_body2', lang, [str(user.free_call*free_call_in_usd)]),
            body3=locale.get('free_call_given_body3', lang),
            team=locale.get('team', lang)
            )

        try:
            mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient=user.email,
                subject=subject,
                text=text_content,
                html=html_content,
                bcc=[MAIL_SYSTEM]
            )
            logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
        except MailSendError as e:
            raise MailSendError


def format_history(parsed_history: list, locale: Locale, lang: str) -> (str, str):
    # To replace user: or assistant: in locale
    user_label = locale.get("chatdata_user_label", lang)
    assistant_label = locale.get("chatdata_assistant_label", lang)

    # Initialize output strings for text and HTML formats.
    text_output = ""
    html_output = '<ul style="padding-left: 0; list-style: none;">'

    # HTML styles
    user_style = 'style="color:#52b0bd;"'
    assistant_style = 'style="color:#aaa;"'
    text_style = 'style="color:#333;"'

    # Iterate through each dialog in the history
    for dialog in parsed_history:
        speaker = dialog['speaker']
        text = dialog['text']

        if speaker == 'human':
            # Formatting for text version
            text_output += f"{user_label}: {text}\n"
            
            # Formatting for HTML version
            html_output += f'<li style="padding-bottom: 8px;">'
            html_output += f'<span {user_style}>{user_label}: </span><span {text_style}>{text}</span>'
            html_output += '</li>'
        elif speaker == 'bot':
            # Formatting for text version
            text_output += f"{assistant_label}: {text}\n"

            # Formatting for HTML version
            html_output += f'<li style="padding-bottom: 8px;">'
            html_output += f'<span {assistant_style}>{assistant_label}: </span><span {text_style}>{text}</span>'
            html_output += '</li>'

    # Close the HTML list
    html_output += '</ul>'

    return text_output, html_output

def send_chatdata_report_email(parsed_history: list, start_time: datetime, user: User):
    lang = user.lang
    flask_app = Flask(__name__, template_folder='templates')  # mails/ is root
    logger.debug(flask_app.jinja_loader.searchpath)
    with flask_app.app_context(): # celery worker process needs context
        subject = locale.get('chatdata_report_subject', lang)
        history_text, history_html = format_history(parsed_history, locale, lang)
        html_content = render_template(
            'html/chatdata_report.html',
            #body1=locale.get('chatdata_report_body1', lang),
            time_label=locale.get('chatdata_report_time_label', lang),
            time_str=start_time.strftime("%Y %m/%d %H:%M"),
            history=history_html,
            team=locale.get('team', lang)
            )
        text_content = render_template(
            'plain/chatdata_report.txt',
            #body1=locale.get('chatdata_report_body1', lang),
            time_label=locale.get('chatdata_report_time_label', lang),
            time_str=start_time.strftime("%Y %m/%d %H:%M"),
            history=history_text,
            team=locale.get('team', lang)
            )

        try:
            mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient=user.email,
                subject=subject,
                text=text_content,
                html=html_content,
                bcc=[MAIL_SYSTEM]
            )
            logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
        except MailSendError as e:
            raise MailSendError

def send_invitation_for_wait_list_user_email(user: User):
    lang = user.lang
    flask_app = Flask(__name__, template_folder='templates')  # mails/ is root
    logger.debug(flask_app.jinja_loader.searchpath)
    with flask_app.app_context(): # celery worker process needs context
        subject = locale.get('invitation_for_wait_list_user_subject', lang)
        html_content = render_template(
            'html/invitation_for_wait_list_user.html',
            body1=locale.get('invitation_for_wait_list_user_body1', lang),
            body2=locale.get('invitation_for_wait_list_user_body2', lang, [user.email]),
            link=f'https://quantz.thinkxinc.com/v1/{lang}/signup',
            button=locale.get('invitation_for_wait_list_user_button', lang),
            team=locale.get('team', lang)
            )
        text_content = render_template(
            'plain/invitation_for_wait_list_user.txt',
            body1=locale.get('invitation_for_wait_list_user_body1', lang),
            body2=locale.get('invitation_for_wait_list_user_body2', lang, [user.email]),
            link=f'https://quantz.thinkxinc.com/v1/{lang}/signup',
            button=locale.get('invitation_for_wait_list_user_button', lang),
            team=locale.get('team', lang)
            )
        try:
            mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient=user.email,
                subject=subject,
                text=text_content,
                html=html_content,
                bcc=[MAIL_SYSTEM]
            )
            logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
        except MailSendError as e:
            raise MailSendError

def send_added_to_wait_list_email(general_status: GeneralSystemStatus, user: User):
    lang = 'ja'#user.lang
    n_wait_list = len(general_status.wait_list_emails)
    flask_app = Flask(__name__, template_folder='templates')  # mails/ is root
    logger.debug(flask_app.jinja_loader.searchpath)
    with flask_app.app_context(): # celery worker process needs context
        subject = locale.get('added_to_wait_list_subject', lang, [n_wait_list])
        html_content = render_template(
            'html/added_to_wait_list.html',
            subject=subject,
            body1=locale.get('added_to_wait_list_body1', lang),
            body2=locale.get('added_to_wait_list_body2', lang, [n_wait_list]),
            body3=locale.get('added_to_wait_list_body3', lang),
            team=locale.get('team', lang)
            )
        text_content = render_template(
            'plain/added_to_wait_list.txt',
            subject=subject,
            body1=locale.get('added_to_wait_list_body1', lang),
            body2=locale.get('added_to_wait_list_body2', lang, [n_wait_list]),
            body3=locale.get('added_to_wait_list_body3', lang),
            team=locale.get('team', lang)
            )
        try:
            mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient=user.email,
                subject=subject,
                text=text_content,
                html=html_content,
                bcc=[MAIL_SYSTEM]
            )
            logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
        except MailSendError as e:
            raise MailSendError

def generate_interview_result_template(interview: 'InteractionModel', metadata: dict, body1, body2, date_label='Date', name_label='Name', email_label='Email', video_all_label="Full video", lang='en'):
    # Parse and format the date
    start_datetime_str = metadata.get("startDatetime")
    if start_datetime_str.endswith("Z"):
        start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M:%S.%fZ")
    else:
        start_datetime = datetime.fromisoformat(start_datetime_str)
    formatted_date = start_datetime.strftime("%Y/%m/%d %H:%M")

    # Get name and email
    user_info = metadata.get("userInfo", {})
    name = user_info.get("name", "")
    email = user_info.get("email", "")

    # Get video and screenshot paths
    video_path_all = metadata.get("videoPathAll", "")
    screen_shot_url_all = metadata.get("screenShotPathAll", "")

    # Get events
    events = metadata.get("events", [])

    logger.info(magenta(interview))
    logger.info(magenta(str(interview.id)))

    client_id = metadata.get("client_id", "")

    # Prepare the data for the template
    return render_template(
        'html/interview_result.html',
        body1=body1,
        body2=body2,
        host_url=HOST_URL,
        interview_id=str(interview.id),
        client_id=client_id,
        formatted_date=formatted_date,
        date_label=date_label,
        name_label=name_label,
        email_label=email_label,
        video_all_label=video_all_label,
        name=name,
        email=email,
        video_path_all=video_path_all,
        screen_shot_url_all=screen_shot_url_all,
        events=events,
        team=locale.get('team', lang)
    )

def generate_interview_result_text(interview: 'InteractionModel', metadata: dict, body1, body2, date_label='Date', name_label='Name', email_label='Email', lang='en'):
    from datetime import datetime

    # Parse and format the date
    start_datetime_str = metadata.get("startDatetime")
    if start_datetime_str.endswith("Z"):
        start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M:%S.%fZ")
    else:
        start_datetime = datetime.fromisoformat(start_datetime_str)
    formatted_date = start_datetime.strftime("%Y/%m/%d %H:%M")

    # Get name and email
    user_info = metadata.get("userInfo", {})
    name = user_info.get("name", "")
    email = user_info.get("email", "")

    # Initialize the text content
    lines = []
    lines.append(body1)
    lines.append(f"{date_label}: {formatted_date}\n")
    lines.append(f"{name_label}: {name}")
    lines.append(f"{email_label}: {email}\n")

    # Get events
    events = metadata.get("events", [])
    for event in events:
        speaker = event.get("speaker", "")
        message = event.get("message", "")
        lines.append(f"{speaker}: {message}")

    lines.append(body2)
    lines.append(locale.get('team', lang))
    # Join all lines into a single string
    text_content = '\n'.join(lines)
    return text_content

def send_interview_result_email(user: User, metadata: dict, interview: "InteractionModel", lang: str):
    flask_app = Flask(__name__, template_folder='templates')  # mails/ is root
    logger.debug(flask_app.jinja_loader.searchpath)

    lang = "en"

    with flask_app.app_context(): # celery worker process needs context
        title = interview.title
        name = metadata["userInfo"]["name"]
        subject = locale.get('email_interview_result_subject', lang, [title, name])
        body1 = locale.get('email_interview_result_body1', lang)
        body2 = locale.get('email_interview_result_body2', lang)
        date_label = locale.get('email_interview_result_date_label', lang)
        name_label = locale.get('email_interview_result_name_label', lang)
        email_label = locale.get('email_interview_result_email_label', lang)
        video_all_label = locale.get('email_interview_result_video_all_label', lang)
        html_content = generate_interview_result_template(interview, metadata, body1, body2, date_label, name_label, email_label, video_all_label, lang)
        text_content = generate_interview_result_text(interview, metadata, body1, body2, date_label, name_label, email_label, lang)

        try:
            mail.send(
                sender=SENDER,
                reply_to=REPLY_TO,
                recipient=user.email,
                subject=subject,
                text=text_content,
                html=html_content,
                bcc=[MAIL_SYSTEM]
            )
            logger.info(light_green(f'Email "{subject}" sent to {user.email}'))
        except MailSendError as e:
            raise MailSendError




if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send various types of emails.")
    parser.add_argument('--welcome', action='store_true', help="Send a welcome email.")
    parser.add_argument('--invitation', action='store_true', help="Send an invitation email to a user on the wait list.")
    parser.add_argument('--added_to_wait_list', action='store_true', help="Send email notifying a user they are added to wait list.")
    parser.add_argument('--smoke_test', action='store_true', help="Run the SES mail client smoke test (sends 2 test emails).")
    parser.add_argument('--email', type=str, required=True, help="Email of the user to send the email to.")
    parser.add_argument('--verification_code', type=str, default='123456', help="Verification code for the email, if applicable.")
    
    args = parser.parse_args()

    if args.smoke_test:
        _smoke_test_mail_client()

    # MongoDB
    from init_mongodb import connect

    user = User.find_user_by_email(args.email)
    if user is None:
        logger.error(red("User not found."))
        exit(1)

    if args.welcome:
        send_welcome_email(user, args.verification_code)
    if args.invitation:
        send_invitation_for_wait_list_user_email(user)
    if args.added_to_wait_list:
        try:
            general_status, created = GeneralSystemStatus.get_or_create()
        except Exception as e:
            logger.error(red(f'failed to get GeneralSystemStatus'))
        send_added_to_wait_list_email(general_status, user)

#def render_email_change_verification(
#        user: User, mail_confirmation_code: str,
#        lang='en', html=True, hosturl=HOST_URL):
#    if html:
#        return render_template(html_path(
#            'email_change_verification', lang),
#            user=user,
#            mail_confirmation_code=mail_confirmation_code,
#            hosturl=hosturl)
#    else:
#        return plain_text(
#            plain_path('email_change_verification', lang),
#            user=user,
#            mail_confirmation_code=mail_confirmation_code,
#            hosturl=hosturl)
#
#def render_email_change_success(
#        user: User, lang='en', html=True, hosturl=HOST_URL):
#    if html:
#        return render_template(
#            html_path('email_change_success', lang),
#            user=user,
#            hosturl=hosturl)
#    else:
#        return plain_text(
#            plain_path('email_change_success', lang),
#            user=user,
#            hosturl=hosturl)
#
#def render_password_reset(
#        user: User, password_reset_code: str, lang='en', html=True,
#        hosturl=HOST_URL):
#    if html:
#        return render_template(
#            html_path('password_reset', lang),
#            user=user,
#            password_reset_code=password_reset_code,
#            hosturl=hosturl)
#    else:
#        return plain_text(
#            plain_path('password_reset', lang),
#            user=user,
#            password_reset_code=password_reset_code,
#            hosturl=hosturl)
#
#def render_password_change_success(
#        user: User, lang='en', html=True,
#        hosturl=HOST_URL):
#    if html:
#        return render_template(
#            html_path('password_change_success', lang),
#            user=user,
#            hosturl=hosturl)
#    else:
#        return plain_text(
#            plain_path('password_change_success', lang),
#            user=user,
#            hosturl=hosturl)