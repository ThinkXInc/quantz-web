from celery import Celery

# Celery instance
celery_app = Celery('web-server')
celery_app.config_from_object('web_tasks_server.celery_config')  # name space folder must be unique in project

# Register tasks
import web_tasks_server.tasks  # This line is crutial !!  # tasks file name also must be unique