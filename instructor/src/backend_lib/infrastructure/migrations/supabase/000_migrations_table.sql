-- Migration tracking table
-- This table keeps track of which migrations have been executed
-- to prevent running the same migration multiple times

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON schema_migrations(migration_name);
