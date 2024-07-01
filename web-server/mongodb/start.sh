#!/bin/bash

# Starts the mongodb service

start_service() {
    sudo systemctl start mongodb.service
}

check_service_status() {
    echo "Checking the status of mongodb service..."
    systemctl status mongodb.service
}

start_service
check_service_status
