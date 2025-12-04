# Migration Runner System

## Overview

The migration runner is a database-agnostic system built with the **Adapter** and **Factory** design patterns. It provides a clean, maintainable way to execute database migrations across different database providers.

## Architecture

### Design Patterns

#### 1. Adapter Pattern

The Adapter pattern allows the migration system to work with different databases (Supabase/PostgreSQL, MySQL, MongoDB, etc.) through a unified interface.

```
┌─────────────────────┐
│  MigrationRunner    │
│                     │
│  Uses:              │
│  ┌────────────────┐ │
│  │ BaseDatabaseAdapter │
│  │  (Interface)   │ │
│  └────────────────┘ │
└─────────┬───────────┘
          │
          │ implements
          │
    ┌─────┴─────────────────┐
    │                       │
┌───▼──────────────┐  ┌────▼────────────┐
│SupabaseAdapter   │  │  MySQLAdapter   │
│                  │  │   (future)      │
└──────────────────┘  └─────────────────┘
```

**Benefits:**
- Switch between databases without changing migration code
- Easy to add support for new databases
- Consistent interface across all database types

#### 2. Factory Pattern

The Factory pattern creates the appropriate database adapter based on configuration.

```
┌────────────────────┐
│  AdapterFactory    │
│                    │
│  create(type, conn)│
└────────┬───────────┘
         │
         │ creates
         │
         ▼
┌────────────────────┐
│ Database Adapter   │
│ (based on type)    │
└────────────────────┘
```

**Benefits:**
- Centralized adapter creation logic
- Type-safe adapter instantiation
- Easy to extend with new adapter types

## System Components

### 1. Core Components

#### Migration Runner
**Location:** `src/backend_lib/infrastructure/scripts/engine/orchestrator/migration-runner.js`

The core orchestrator that manages the migration process.

**Key Methods:**
- `run()` - Main entry point for migration execution
- `connectToDatabase()` - Establishes database connection
- `ensureMigrationsTable()` - Creates tracking table if needed
- `getMigrationFiles()` - Retrieves all `.sql` files
- `getExecutedMigrations()` - Batch checks executed migrations
- `processMigrationFiles()` - Executes pending migrations
- `shouldSkipMigration()` - Determines if migration should be skipped
- `executeMigration()` - Runs a single migration in a transaction
- `printSummary()` - Displays execution results

**Process Flow:**
```
1. Connect to database
2. Verify connection
3. Ensure migrations table exists
4. Get all migration files
5. Batch check which migrations have been executed
6. Process each migration file
   - Skip if already executed
   - Skip if migrations table file and table exists
   - Execute new migrations in transaction
7. Print summary
```

#### Base Adapter
**Location:** `src/backend_lib/infrastructure/scripts/engine/adapters/base-adapter.js`

Defines the interface that all database adapters must implement.

**Required Methods:**
```javascript
async connect()              // Connect to database
async disconnect()           // Close connection
async testConnection()       // Verify connection
async executeRaw(sql)        // Execute raw SQL
async query(query, params)   // Execute parameterized query
async tableExists(name, schema) // Check if table exists
async transaction(callback)  // Execute in transaction
```

#### Supabase Adapter
**Location:** `src/backend_lib/infrastructure/scripts/engine/adapters/supabase-adapter.js`

PostgreSQL/Supabase-specific implementation using the `postgres` library.

**Key Features:**
- SSL connection with `rejectUnauthorized: false`
- Connection pooling (max: 1 for migrations)
- Tagged template literal queries for type safety
- Array parameter support with `ANY()`
- Transaction support with automatic rollback on error

**Special Handling:**
```javascript
// Array parameters for batch checking
async query(query, params = []) {
    if (params.length > 0 && Array.isArray(params[0])) {
        return await this.sql`
            SELECT migration_name 
            FROM public.schema_migrations 
            WHERE migration_name = ANY(${params[0]})
        `;
    }
    // ... other query types
}
```

#### Adapter Factory
**Location:** `src/backend_lib/infrastructure/scripts/engine/factory/adapter-factory.js`

Creates the appropriate adapter based on folder name.

```javascript
static create(folderName, connectionString) {
    switch (folderName.toLowerCase()) {
        case 'supabase':
            return new SupabaseDatabaseAdapter(folderName, connectionString);
        // Add more cases for other databases
        default:
            errorHandler('Unsupported database type: ' + folderName);
    }
}
```

#### Migration Workflow
**Location:** `src/backend_lib/infrastructure/scripts/engine/index.js`

High-level workflow orchestrator.

```javascript
async function executeMigrationWorkflow(folderName, connectionString, migrationsDir) {
    // 1. Create adapter
    const adapter = AdapterFactory.create(folderName, connectionString);
    
    // 2. Create runner
    const runner = new MigrationRunner(adapter, migrationsDir);
    
    // 3. Run migrations
    const result = await runner.run();
    
    // 4. Cleanup
    await runner.cleanup();
    
    return result;
}
```

### 2. Configuration System

#### Database Config
**Location:** `src/backend_lib/infrastructure/scripts/config/`

Handles database connection configuration.

**Components:**
- `base-database-config.js` - Base configuration class
- `types/supabase-database-config.js` - Supabase-specific config
- `factory/database-config-factory.js` - Creates config objects
- `index.js` - Config loader

**Simplified Configuration:**
```javascript
class SupabaseDatabaseConfig extends BaseDatabaseConfig {
    constructor() {
        super();
        this.dbType = 'postgres';
        this.databaseUrl = process.env.DATABASE_URL;
    }

    getConnectionString() {
        if (!this.databaseUrl) {
            errorHandler('DATABASE_URL is required in .env');
        }
        return this.databaseUrl;
    }

    validate() {
        // Validates PostgreSQL connection string format
        const pattern = /^postgresql:\/\/postgres\.[a-zA-Z0-9]+:[^@]+@[a-zA-Z0-9\-\.]+\.supabase\.com:\d+\/postgres$/;
        // ...
    }
}
```

### 3. Helper Utilities

#### Migration Directory Helper
**Location:** `src/backend_lib/infrastructure/scripts/helpers/get-migration-dir.js`

Gets and validates the migration directory path.

```javascript
function getMigrationDir(defaultFolderName = "supabase") {
    const folderName = process.argv[2] || defaultFolderName;
    const migrationsDir = path.join(__dirname, "../../migrations", folderName);
    
    if (!fs.existsSync(migrationsDir)) {
        errorHandler(`Migrations directory not found: ${migrationsDir}`);
    }
    
    return { migrationsDir, folderName };
}
```

#### Error Handler
**Location:** `src/backend_lib/infrastructure/scripts/exceptions/error-handler.js`

Centralized error handling.

```javascript
function errorHandler(message) {
    console.error(`❌ Error: ${message}`);
    process.exit(1);
}
```

## Usage

### Running Migrations

**Basic Usage:**
```bash
node src/backend_lib/infrastructure/scripts/run-migrations.js
```

**With Specific Folder:**
```bash
node src/backend_lib/infrastructure/scripts/run-migrations.js supabase
```

### Environment Variables

Only one environment variable is required:

```env
DATABASE_URL=postgresql://postgres.{project_ref}:{password}@{host}.supabase.com:{port}/postgres
```

**Example:**
```env
DATABASE_URL=postgresql://postgres.ovitxndzrplauzceewmg:yourpassword@aws-1-eu-central-2.pooler.supabase.com:6543/postgres
```

### Migration Files Structure

```
migrations/
├── supabase/
│   ├── 000_migrations_table.sql  # Creates tracking table
│   ├── 001_initial_schema.sql    # Your migrations
│   └── 002_enable_realtime.sql
```

## Performance Optimizations

### Batch Checking

Instead of checking each migration individually, the system uses batch checking:

```javascript
// Old approach (N queries)
for (const file of files) {
    const result = await sql`SELECT ... WHERE name = ${file}`;
}
// Time: 100 files = ~5 seconds

// New approach (1 query)
const results = await sql`SELECT ... WHERE name = ANY(${files})`;
const executedSet = new Set(results.map(r => r.migration_name));
// Time: 100 files = ~3.5 seconds
```

**Performance Gain:** ~30% faster

### Transaction Safety

Each migration runs in a transaction:
- SQL execution
- Migration record insertion
- Automatic rollback on error

## Extending the System

### Adding a New Database Adapter

1. **Create adapter class:**
```javascript
// src/backend_lib/infrastructure/scripts/engine/adapters/mysql-adapter.js
const BaseDatabaseAdapter = require('./base-adapter');

class MySQLAdapter extends BaseDatabaseAdapter {
    async connect() {
        // MySQL-specific connection
    }
    
    async executeRaw(sql) {
        // MySQL-specific execution
    }
    
    // Implement all required methods
}

module.exports = MySQLAdapter;
```

2. **Update factory:**
```javascript
// adapter-factory.js
const MySQLAdapter = require('../adapters/mysql-adapter');

static create(folderName, connectionString) {
    switch (folderName.toLowerCase()) {
        case 'supabase':
            return new SupabaseDatabaseAdapter(folderName, connectionString);
        case 'mysql':
            return new MySQLAdapter(folderName, connectionString);
        default:
            errorHandler('Unsupported database type: ' + folderName);
    }
}
```

3. **Create config class:**
```javascript
// config/types/mysql-database-config.js
class MySQLDatabaseConfig extends BaseDatabaseConfig {
    constructor() {
        super();
        this.dbType = 'mysql';
        this.databaseUrl = process.env.MYSQL_URL;
    }
    
    getConnectionString() {
        return this.databaseUrl;
    }
}
```

4. **Update config factory:**
```javascript
// config/factory/database-config-factory.js
case 'mysql':
    return new MySQLDatabaseConfig();
```

## Best Practices

### Migration Files

1. **Use IF NOT EXISTS:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);
```

2. **Include metadata:**
```sql
-- Migration: Add users table
-- Created: 2024-12-04
-- Rollback: DROP TABLE users;
```

3. **Maintain order:**
```
000_migrations_table.sql
001_initial_schema.sql
002_add_users.sql
```

### Code Organization

- Keep adapters focused on database-specific operations
- Keep runner database-agnostic
- Use factory for creation logic
- Centralize error handling

### Testing

1. Test with empty database
2. Test with partially migrated database
3. Test error scenarios
4. Verify rollback behavior

## Troubleshooting

### Connection Errors

**Issue:** `Connection test failed: read ECONNRESET`

**Solutions:**
- Verify `DATABASE_URL` format
- Check database is accessible
- Verify SSL settings
- Check firewall/network rules

### Migration Fails

**Issue:** `PostgresError: could not determine data type`

**Solutions:**
- Check parameter types in queries
- Verify array parameters use `ANY()`
- Use tagged templates for postgres.js

### Undefined Connection String

**Issue:** `this.connectionString is undefined`

**Solutions:**
- Ensure factory passes both `folderName` and `connectionString`
- Verify adapter constructor accepts both parameters
- Check environment variables are loaded

## Future Enhancements

- [ ] Migration rollback support
- [ ] Dry-run mode
- [ ] Migration diff/changelog generation
- [ ] Support for data migrations
- [ ] Parallel migration execution (with dependency management)
- [ ] Migration versioning/branching
- [ ] Web UI for migration management
