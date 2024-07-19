#!/bin/bash

# Usage instructions
usage() {
  echo "Usage: . ./restart.sh [-r] <service_name|all>"
  echo "  -r: Reload daemon before restarting the service."
  echo "  <service_name|all>: Specify 'billing_scheduler', 'report' or 'all' to restart all services."
}

# Check for the presence of at least one argument
if [ $# -eq 0 ]; then
  usage
  return 1
fi

# Initialize variables
daemon_reload=false
service_names=()  # Initialize as an empty array

# Parse command line options
while getopts ":r" opt; do
  case $opt in
    r)
      daemon_reload=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      usage
      return 1
      ;;
  esac
done

# Shift off the option so only the service name remains
shift $((OPTIND-1))

# Check if a service name is provided
if [ -z "$1" ]; then
  echo "No service name provided."
  usage
  return 1
fi

# Handle the 'all' argument or specific service names
if [ "$1" == "all" ]; then
  service_names=("check_congestion.service")
else
  # Map the friendly service name to the actual systemd service name
  case $1 in
    check_congestion)
      service_names=("check_congestion.service")
      ;;
    *)
      echo "Unknown service: $1"
      return 1
      ;;
  esac
fi

# Reload systemd daemon if requested
if $daemon_reload; then
  echo "Reloading systemd daemon..."
  sudo systemctl daemon-reload
fi

# Perform the restart operation for the systemd services
for service in "${service_names[@]}"; do
  echo "Restarting $service..."
  sudo systemctl restart $service
done
