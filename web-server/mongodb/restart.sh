#!/bin/bash

# Restarts the mongodb service

restart_service() {
    sudo systemctl restart mongodb.service
}

check_service_status() {
    echo "Checking the status of mongodb service..."
    systemctl status mongodb.service
}

restart_service
check_service_status
