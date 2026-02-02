#!/bin/bash

# Production startup script
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Create repositories directory if it doesn't exist
mkdir -p /data/repositories

# Start the application
echo "Starting GitLight..."
exec node server.js
