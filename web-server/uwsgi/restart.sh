#!/bin/bash

# Restarts the uwsgi service

restart_service() {
    sudo systemctl restart uwsgi.service
}

check_service_status() {
    echo "Checking the status of uwsgi service..."
    systemctl status uwsgi.service
}

restart_service
#check_service_status
