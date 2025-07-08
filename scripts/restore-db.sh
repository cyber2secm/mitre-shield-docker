#!/bin/bash

echo "Starting database restoration check..."

# Wait for MongoDB to be ready
until mongosh --host localhost --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to be ready..."
    sleep 2
done

# Check if database has data (specifically mitretechniques collection)
TECHNIQUE_COUNT=$(mongosh --host localhost --quiet --eval "db.mitretechniques.countDocuments()" mitre-shield)

if [ "$TECHNIQUE_COUNT" -eq 0 ]; then
    echo "Database is empty. Restoring database from backup..."
    mongorestore --host localhost --db mitre-shield /docker-entrypoint-initdb.d/backup/mitre-shield/
    echo "Database restoration completed!"
else
    echo "Database already contains $TECHNIQUE_COUNT techniques. Skipping restoration."
fi

echo "Database check completed!" 