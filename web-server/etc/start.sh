#!/bin/bash

# Usage Examples:
# . ./start.sh uwsgi                 - Starts the uwsgi service
# . ./start.sh nginx                 - Starts the nginx service
# . ./start.sh mongodb               - Starts the mongodb service
# . ./start.sh redis_session         - Starts the Redis for session service
# . ./start.sh all                  - Starts all services except processing-server and gateway-server

# Check if a service name is provided
if [ -z "$1" ]; then
  echo "Usage: . ./start.sh <service_name>"
  return 1
fi

start_service() {
    case $1 in
        uwsgi) service_name="uwsgi.service" ;;
        redis_session) service_name="redis_session.service" ;;
        nginx) service_name="nginx.service" ;;
        mongodb) service_name="mongodb.service" ;;
        *) 
            echo "Unknown service: $1"
            return 1
            ;;
    esac

    sudo systemctl start $service_name
}

check_service_status() {
    echo "Checking the status of services..."
    ./status.sh  # Assuming status_check.sh is in the same directory and executable
}

# Map the friendly service name to the actual systemd service name or Docker container
if [ "$1" == "all" ]; then
    services=("mongodb" "redis_session" "nginx" "uwsgi")
    for service in "${services[@]}"; do
        start_service "$service"
    done
    sleep 5  # Delay for 5 seconds; adjust as needed
    check_service_status
else
    start_service "$1"
    sleep 5  # Delay for 5 seconds; adjust as needed
    check_service_status
fi