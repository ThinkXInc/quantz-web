#!/bin/bash

# Displays the status of Redis session service using different methods

echo "Using systemctl to check Redis session status:"
sudo systemctl status redis_session

echo "Listing all units related to Redis session:"
systemctl list-units --type=service | grep redis_session

echo "Checking Redis session processes:"
ps aux | grep redis_session | grep -v grep

echo "Displaying the last 3000 log lines for Redis session:"
journalctl -u redis_session.service --no-pager | tail -n 3000
