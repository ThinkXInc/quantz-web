#!/bin/bash

# Stops the Redis session service

stop_service() {
    sudo systemctl stop redis_session.service
}

check_service_status() {
    echo "Checking the status of Redis session service..."
    systemctl status redis_session.service
}

stop_service
check_service_status
