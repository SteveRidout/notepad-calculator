#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
cd web && npm install --prune
cd ../server && npm install --prune
cd ..

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
cd server && npx knex migrate:latest
cd ..

# Start the development server
exec sh dev.sh