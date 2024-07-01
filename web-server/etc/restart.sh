#!/bin/bash

# Usage Examples:
# . ./restart.sh uwsgi             - Restarts the uwsgi service
# . ./restart.sh nginx             - Restarts the nginx service
# . ./restart.sh mongodb           - Restarts the mongodb service
# . ./restart.sh redis_session     - Restarts the Redis for session service

# Check if a service name is provided
if [ -z "$1" ]; then
  echo "Usage: . ./restart.sh <service_name>"
  return 1
fi

# Map the friendly service name to the actual systemd service name or Docker container
case $1 in
  uwsgi)
    service_name="uwsgi.service"
    ;;
  redis_session)
    service_name="redis_session.service"
    ;;
  nginx)
    service_name="nginx.service"
    ;;
  mongodb)
    service_name="mongodb.service"
    ;;
  *)
    echo "Unknown service: $1"
    return 1
    ;;
esac

# Perform the restart operation for systemd services
sudo systemctl restart $service_name
