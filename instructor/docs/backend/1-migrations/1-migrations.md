# Database Migrations

## Overview
This project uses a custom migration system to manage database schema changes. Migrations are SQL files stored in `src/backend_lib/infrastructure/migrations/` and are executed in alphabetical order.

## Migration System

### How It Works
1. **Migration Files**: SQL files in the migrations folder (e.g., `001_initial_schema.sql`)
2. **Migration Tracking**: A `schema_migrations` table tracks which migrations have been executed
3. **Idempotent**: Migrations that have already been executed are skipped
4. **Ordered Execution**: Files are executed in alphabetical order (hence the numeric prefix)

### Migration Tracking Table
The `schema_migrations` table is created by `000_migrations_table.sql` and has the following structure:

```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Running Migrations

### Automatic (On Build)
Migrations run automatically before the build process:

```bash
pnpm build
```

This executes the `prebuild` script which runs migrations.

### Manual Execution
To run migrations manually:

```bash
pnpm migrate
```

Or with a specific folder:

```bash
pnpm migrate supabase
```

Or directly:

```bash
node src/backend_lib/infrastructure/scripts/subapase/run-migrations.js [folderName]
```

## Creating New Migrations

### Naming Convention
Migration files must follow this naming pattern:

```
XXX_description.sql
```

Where:
- `XXX` is a zero-padded number (e.g., `001`, `002`, `010`)
- `description` is a brief description of the migration (e.g., `initial_schema`, `add_users_table`)

Examples:
- `000_migrations_table.sql`
- `001_initial_schema.sql`
- `002_add_user_profiles.sql`

### Best Practices

1. **Use IF NOT EXISTS**: Always use `CREATE TABLE IF NOT EXISTS` to make migrations idempotent
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL
   );
   ```

2. **One Migration Per Feature**: Keep migrations focused on a single feature or change

3. **Include Rollback Comments**: Document how to rollback the migration
   ```sql
   -- Rollback: DROP TABLE users;
   ```

4. **Test Locally First**: Always test migrations locally before deploying

5. **Never Modify Executed Migrations**: Once a migration has been executed in production, create a new migration to make changes

## Migration Folders

The migration system supports multiple folders for different environments or providers:

- `subapase/` - Default folder for Supabase migrations (note the typo in the original folder name)
- You can create additional folders for different environments

To run migrations from a specific folder:

```bash
node src/backend_lib/infrastructure/scripts/run-migrations.js my-folder
```

## Environment Variables

The migration script requires the following environment variables in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Troubleshooting

### Migration Fails
- Check that your `.env` file has the correct Supabase credentials
- Verify the SQL syntax is correct
- Check Supabase logs for detailed error messages

### Migration Runs Twice
- The `schema_migrations` table prevents this automatically
- If you need to re-run a migration, delete its entry from `schema_migrations`

### Manual Migration Execution
Due to Supabase JavaScript client limitations, some migrations may need to be run manually in the Supabase SQL Editor. The script will log which migrations need manual execution.

## Example Migration

Here's a complete example of a migration file:

```sql
-- Migration: Add user profiles table
-- Created: 2024-01-01
-- Rollback: DROP TABLE user_profiles;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on user_profiles" ON user_profiles
  FOR SELECT USING (true);
```

## Advanced Usage

### Checking Migration Status
To see which migrations have been executed:

```sql
SELECT * FROM schema_migrations ORDER BY executed_at;
```

### Manually Marking a Migration as Executed
If you've run a migration manually in the SQL Editor:

```sql
INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema.sql');
```

### Rolling Back a Migration
1. Run the rollback SQL (documented in the migration file)
2. Remove the entry from `schema_migrations`:
   ```sql
   DELETE FROM schema_migrations WHERE migration_name = '001_initial_schema.sql';
   ```
