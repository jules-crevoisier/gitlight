#!/bin/bash

# Initialize database and run migrations
# This script is used during Docker startup

set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h ${DB_HOST:-db} -p ${DB_PORT:-5432} -U ${DB_USER:-gitlight}; do
    sleep 1
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Database initialization complete"
