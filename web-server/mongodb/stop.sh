#!/bin/bash

# Stops the mongodb service

stop_service() {
    sudo systemctl stop mongodb.service
}

check_service_status() {
    echo "Checking the status of mongodb service..."
    systemctl status mongodb.service
}

stop_service
check_service_status
