#!/bin/bash

# Starts the Redis session service

start_service() {
    sudo systemctl start redis_session.service
}

check_service_status() {
    echo "Checking the status of Redis session service..."
    systemctl status redis_session.service
}

start_service
#check_service_status
