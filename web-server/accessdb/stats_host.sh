#!/bin/bash

# Connect to Redis. Update these variables if your Redis setup is different.
REDIS_CLI="redis-cli"
#HOST="-h localhost"
HOST="-h 192.168.1.9"
PORT="-p 6376"

# Function to fetch and display access log stats
function fetch_access_log_stats() {
    echo "Fetching access log stats..."

    # Fetch and display Host ID and Origin mappings
    echo "Host ID and Origin Mappings:"
    $REDIS_CLI $HOST $PORT keys "host:*" | while read -r line ; do
        echo "Key: $line"
        host_info=$($REDIS_CLI $HOST $PORT get "$line")
        echo "Host Info: $host_info"
    done

    echo "--------------------------------------"

    # Fetch and display host usage logs
    echo "Host Usage Logs:"
    $REDIS_CLI $HOST $PORT keys "host_usage:*" | while read -r line ; do
        echo "Key: $line"
        usage_count=$($REDIS_CLI $HOST $PORT get "$line")
        echo "Usage Count: $usage_count"
    done

    echo "======================================"
}

# Loop indefinitely, fetching and displaying stats every 2 seconds
while true; do
    fetch_access_log_stats
    sleep 2
done