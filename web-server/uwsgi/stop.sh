#!/bin/bash

# Stops the uwsgi service

stop_service() {
    sudo systemctl stop uwsgi.service
}

check_service_status() {
    echo "Checking the status of uwsgi service..."
    systemctl status uwsgi.service
}

stop_service
#check_service_status
