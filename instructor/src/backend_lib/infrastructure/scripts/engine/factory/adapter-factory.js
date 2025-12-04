// src/db/adapter-factory.js
const errorHandler = require('../../exceptions/error-handler');
const SupabaseDatabaseAdapter = require('../adapters/supabase-adapter');
// const MySQLAdapter = require('./adapters/mysql-adapter');
// const MongoDBAdapter = require('./adapters/mongodb-adapter');

/**
 * Database Adapter Factory
 * Creates the appropriate database adapter based on configuration
 */
class AdapterFactory {
    /**
     * Create a database adapter
     * @param {string} folderName - Folder name (e.g., 'supabase')
     * @param {string} connectionString - Database connection string
     * @returns {BaseDatabaseAdapter}
     */
    static create(folderName, connectionString) {
        switch (folderName.toLowerCase()) {
            case 'supabase':
                // Pass both folderName and connectionString to the adapter
                return new SupabaseDatabaseAdapter(folderName, connectionString);

            default:
                errorHandler('Unsupported database type: ' + folderName);
        }
    }

    /**
     * Auto-detect database type from connection string
     * @param {string} connectionString
     * @returns {string}
     */
    static detectType(connectionString) {
        if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
            return 'postgres';
        }
        if (connectionString.startsWith('mysql://')) {
            return 'mysql';
        }
        if (connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://')) {
            return 'mongodb';
        }
        throw new Error('Could not detect database type from connection string');
    }
}

module.exports = AdapterFactory;