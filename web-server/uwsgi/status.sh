#!/bin/bash

# Displays the status of uwsgi service using different methods

echo "=========================================================="
echo "Using systemctl to check uwsgi status:"
echo "=========================================================="
sudo systemctl status uwsgi.service --no-pager
echo ""

echo "=========================================================="
echo "Listing all units related to uwsgi:"
echo "=========================================================="
systemctl list-units --type=service | grep uwsgi
echo ""

echo "=========================================================="
echo "Checking uwsgi processes:"
echo "=========================================================="
ps aux | grep uwsgi | grep -v grep
echo ""

echo "=========================================================="
echo "Displaying the last 3000 log lines for uwsgi:"
echo "=========================================================="
journalctl -u uwsgi.service --no-pager | tail -n 3000
echo ""

echo "=========================================================="
echo "Alternatively, you can inspect uwsgi logs using screen:"
echo "=========================================================="
echo "cd /src/quantz/web-server/uwsgi"
echo "screen -c .screenrc_log"
