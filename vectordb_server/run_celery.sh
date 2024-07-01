#!/bin/bash
source /src/quantz-web/vectordb_server/venv/bin/activate

export PYTHONPATH="/src/quantz-web/vectordb_server/venv/lib/python3.9/site-packages:$PYTHONPATH"

# Use Python directly to run the celery module
exec /src/quantz-web/vectordb_server/venv/bin/python -m celery -A run:celery_app worker -l info -Q echo,vectordb_save,vectordb_update,vectordb_delete,vectordb_delete_collection,vectordb_create_collection