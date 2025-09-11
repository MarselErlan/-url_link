#!/bin/bash

# Database migration script
echo "🔄 Starting database migration to assign all links to ericabram33@gmail.com..."

# Set the password environment variable
export PGPASSWORD=OZNHVfQlRwGhcUBFmkVluOzTonqTpIKa

# Run the migration using psql
psql -h interchange.proxy.rlwy.net -U postgres -p 30153 -d railway -f migrate-database.sql

echo "✅ Migration completed!"
