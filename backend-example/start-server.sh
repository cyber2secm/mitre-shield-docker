#!/bin/bash

echo "Starting MITRE Shield Backend Server..."

# Kill any existing node processes on port 3000
echo "Checking for existing processes on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Killing existing processes on port 3000..."
    pkill -f "node.*server.js" 2>/dev/null || true
    sleep 2
fi

# Check if port is now free
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "ERROR: Port 3000 is still in use. Please manually kill processes or use a different port."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "WARNING: MongoDB doesn't appear to be running. Starting MongoDB..."
    brew services start mongodb/brew/mongodb-community > /dev/null 2>&1 || echo "Could not start MongoDB automatically. Please start it manually."
fi

# Start the server
echo "Starting Node.js server..."
cd "$(dirname "$0")"
NODE_ENV=development node server.js 