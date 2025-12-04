const BaseDatabaseAdapter = require('./base-adapter');
const postgres = require('postgres');

/**
 * Supabase Database Adapter
 * Implements PostgreSQL-specific operations for Supabase
 */
class SupabaseDatabaseAdapter extends BaseDatabaseAdapter {
    constructor(folderName, connectionString) {
        super();
        this.folderName = folderName;
        this.connectionString = connectionString;
        this.sql = null;
    }

    /**
     * Connect to the database
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.sql) {
            return; // Already connected
        }

        this.sql = postgres(this.connectionString, {
            ssl: { rejectUnauthorized: false },
            max: 1,
            onnotice: () => { }, // Silence notices
        });
    }

    /**
     * Disconnect from the database
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.sql) {
            await this.sql.end();
            this.sql = null;
        }
    }

    /**
     * Test the database connection
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        if (!this.sql) {
            console.error('Connection test failed: SQL client not initialized');
            return false;
        }

        try {
            await this.sql`SELECT 1`;
            return true;
        } catch (error) {
            console.error('Connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Execute raw SQL
     * @param {string} sqlString - SQL query to execute
     * @returns {Promise<any>}
     */
    async executeRaw(sqlString) {
        return await this.sql.unsafe(sqlString);
    }

    /**
     * Execute a query with parameters
     * For postgres.js, we use the sql template tag for proper parameter handling
     * @param {string} query - Parameterized query (not used for array queries)
     * @param {any[]} params - Query parameters
     * @returns {Promise<any>}
     */
    async query(query, params = []) {
        // Special handling for migration names array query
        if (params.length > 0 && Array.isArray(params[0])) {
            // Use postgres.js template tag for proper array handling with ANY()
            return await this.sql`
                SELECT migration_name 
                FROM public.schema_migrations 
                WHERE migration_name = ANY(${params[0]})
            `;
        }

        // Fallback for other queries
        if (params.length === 0) {
            return await this.sql.unsafe(query);
        }

        return await this.sql.unsafe(query, ...params);
    }

    /**
     * Check if a table exists
     * @param {string} tableName
     * @param {string} schema
     * @returns {Promise<boolean>}
     */
    async tableExists(tableName, schema = 'public') {
        const [result] = await this.sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = ${schema}
                AND table_name = ${tableName}
            )
        `;
        return result.exists;
    }

    /**
     * Begin a transaction
     * @param {Function} callback - Transaction callback
     * @returns {Promise<any>}
     */
    async transaction(callback) {
        return await this.sql.begin(async (sql) => {
            // Create a temporary adapter wrapper for the transaction
            const txAdapter = {
                executeRaw: async (sqlString) => await sql.unsafe(sqlString),
                insertMigrationRecord: async (migrationName) => {
                    await sql`
                        INSERT INTO public.schema_migrations (migration_name) 
                        VALUES (${migrationName}) 
                        ON CONFLICT (migration_name) DO NOTHING
                    `;
                }
            };

            await callback(txAdapter);
        });
    }

    /**
     * Insert a migration record
     * @param {string} migrationName
     * @returns {Promise<void>}
     */
    async insertMigrationRecord(migrationName) {
        await this.sql`
            INSERT INTO public.schema_migrations (migration_name) 
            VALUES (${migrationName}) 
            ON CONFLICT (migration_name) DO NOTHING
        `;
    }
}

module.exports = SupabaseDatabaseAdapter;