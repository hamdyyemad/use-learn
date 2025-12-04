// src/db/adapters/base-adapter.js
/**
 * Base Database Adapter Interface
 * All database adapters must implement these methods
 */
class BaseDatabaseAdapter {
    /**
     * Connect to the database
     * @returns {Promise<void>}
     */
    async connect() {
        throw new Error('connect() must be implemented');
    }

    /**
     * Disconnect from the database
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('disconnect() must be implemented');
    }

    /**
     * Test the database connection
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        throw new Error('testConnection() must be implemented');
    }

    /**
     * Execute raw SQL
     * @param {string} sql - SQL query to execute
     * @returns {Promise<any>}
     */
    async executeRaw(sql) {
        throw new Error('executeRaw() must be implemented');
    }

    /**
     * Execute a query with parameters
     * @param {string} query - Parameterized query
     * @param {any[]} params - Query parameters
     * @returns {Promise<any>}
     */
    async query(query, params = []) {
        throw new Error('query() must be implemented');
    }

    /**
     * Check if a table exists
     * @param {string} tableName
     * @param {string} schema
     * @returns {Promise<boolean>}
     */
    async tableExists(tableName, schema = 'public') {
        throw new Error('tableExists() must be implemented');
    }

    /**
     * Begin a transaction
     * @param {Function} callback - Transaction callback
     * @returns {Promise<any>}
     */
    async transaction(callback) {
        throw new Error('transaction() must be implemented');
    }
}

module.exports = BaseDatabaseAdapter;