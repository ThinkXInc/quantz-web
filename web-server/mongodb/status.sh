#!/bin/bash

# Displays the status of MongoDB service using different methods

echo "=========================================================="
echo "sudo systemctl status mongodb.service --no-pager:"
echo "=========================================================="
sudo systemctl status mongodb.service --no-pager
echo ""
read -p "Press enter to continue..."

echo "=========================================================="
echo "systemctl list-units --type=service | grep mongodb:"
echo "=========================================================="
systemctl list-units --type=service | grep mongodb
echo ""
read -p "Press enter to continue..."

echo "=========================================================="
echo "ps aux | grep mongodb | grep -v grep:"
echo "=========================================================="
ps aux | grep mongodb | grep -v grep
echo ""
read -p "Press enter to continue..."

echo "=========================================================="
echo "netstat -tulnp | grep mongod:"
echo "=========================================================="
sudo netstat -tulnp | grep mongod
echo ""
read -p "Press enter to continue..."

echo "=========================================================="
echo "Displaying the last 3000 log lines for MongoDB:"
echo "=========================================================="
journalctl -u mongodb.service --no-pager | tail -n 3000
echo ""


