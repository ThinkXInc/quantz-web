#!/bin/bash

# Define the service name
SERVICE_NAME="vectordb_server.service"

echo "Attempting to restart the service: $SERVICE_NAME"

# Restart the service
sudo systemctl restart $SERVICE_NAME

# Check the status of the service
#echo "Checking the status of the service:"
#sudo systemctl status $SERVICE_NAME
