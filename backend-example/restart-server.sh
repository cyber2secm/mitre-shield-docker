#!/bin/bash

echo "Restarting MITRE Shield Backend Server..."

# Kill existing processes
echo "Stopping existing server..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Start the server again
echo "Starting server..."
exec ./start-server.sh 