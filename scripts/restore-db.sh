#!/bin/bash

echo "Starting database restoration..."

# Wait for MongoDB to be ready
until mongosh --host localhost --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to be ready..."
    sleep 2
done

# Restore the database from backup
echo "Restoring database from backup..."
mongorestore --host localhost --db mitre-shield /docker-entrypoint-initdb.d/backup/mitre-shield/

echo "Database restoration completed!" 