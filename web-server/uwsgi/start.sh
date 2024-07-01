#!/bin/bash

# Starts the uwsgi service

start_service() {
    sudo systemctl start uwsgi.service
}

check_service_status() {
    echo "Checking the status of uwsgi service..."
    systemctl status uwsgi.service
}

start_service
check_service_status
