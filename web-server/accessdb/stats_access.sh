#!/bin/bash

# Connect to Redis. Update these variables if your Redis setup is different.
REDIS_CLI="redis-cli"
HOST="-h 192.168.1.9"
PORT="-p 6376"

# Function to fetch and display access log stats
function fetch_access_log_stats() {
    echo "Fetching access log stats..."

    # Fetch and display IP-based access log stats
    echo "IP-based Access Logs:"
    $REDIS_CLI $HOST $PORT keys "access_log::ip::*" | while read -r line ; do
        echo "Key: $line"
        log_count=$($REDIS_CLI $HOST $PORT zcount "$line" "-inf" "+inf")
        echo "Number of logs: $log_count"
    done

    echo "--------------------------------------"

    # Fetch and display Client ID-based access log stats
    echo "Client ID-based Access Logs:"
    $REDIS_CLI $HOST $PORT keys "access_log::client_id::*" | while read -r line ; do
        echo "Key: $line"
        log_count=$($REDIS_CLI $HOST $PORT zcount "$line" "-inf" "+inf")
        echo "Number of logs: $log_count"
    done

    echo "--------------------------------------"
}

# Loop indefinitely, fetching and displaying stats every 2 seconds
while true; do
    fetch_access_log_stats
    sleep 2
done
