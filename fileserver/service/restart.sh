#!/bin/bash

# Usage Examples:
# . ./restart.sh fileserver            - Restarts the uwsgi service

# Check if a service name is provided
if [ -z "$1" ]; then
  echo "Usage: . ./restart.sh <service_name>"
  return 1
fi

# Map the friendly service name to the actual systemd service name or Docker container
case $1 in
  fileserver)
    service_name="fileserver.service"
    ;;
esac

# Perform the restart operation for systemd services
sudo systemctl restart $service_name
