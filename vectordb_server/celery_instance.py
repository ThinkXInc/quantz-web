from celery import Celery

# Celery instance
celery_app = Celery('vectordb')
celery_app.config_from_object('vectordb_server.celery_config')