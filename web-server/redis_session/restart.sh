#!/bin/bash

# Restarts the Redis session service

restart_service() {
    sudo systemctl restart redis_session.service
}

check_service_status() {
    echo "Checking the status of Redis session service..."
    systemctl status redis_session.service
}

restart_service
#check_service_status
