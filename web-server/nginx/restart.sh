#!/bin/bash

# Restarts the nginx service

restart_service() {
    sudo systemctl restart nginx.service
}

check_service_status() {
    echo "Checking the status of nginx service..."
    systemctl status nginx.service
}

restart_service
check_service_status
