#!/bin/bash

echo "Starting MongoDB with auto-restore..."

# Start MongoDB in the background
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db --bind_ip_all

# Run our restore script
/docker-entrypoint-initdb.d/restore-db.sh

# Stop the background MongoDB process
mongod --shutdown --dbpath /data/db

# Start MongoDB in the foreground (this keeps the container running)
exec mongod --dbpath /data/db --bind_ip_all 