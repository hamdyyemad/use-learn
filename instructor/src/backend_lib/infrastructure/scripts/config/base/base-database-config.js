const errorHandler = require('../../exceptions/error-handler');
/**
 * Base Database Configuration Class
 */
class BaseDatabaseConfig {
    constructor() {
        this.dbType = 'postgres';
        this.connectionString = null;
    }

    /**
     * Get the database type
     * @returns {string}
     */
    getDbType() {
        return this.dbType;
    }

    /**
     * Get the connection string
     * @returns {string}
     */
    getConnectionString() {
        throw new Error('getConnectionString() must be implemented');
    }

    /**
     * Get masked connection string for logging
     * @returns {string}
     */
    getMaskedConnectionString() {
        const conn = this.getConnectionString();
        return conn.replace(/:([^@]+)@/, ':****@');
    }

    /**
     * Print debug information
     */
    printDebugInfo() {
        console.log('📊 Database Configuration:');
        console.log(`   Type: ${this.dbType}`);
        console.log(`   Config: ${this.constructor.name}`);
    }

    /**
     * Validate configuration
     */
    validate() {
        const conn = this.getConnectionString();
        if (!conn) {
            errorHandler('Connection string is required');
        }
    }

    /**
     * Encode URI component safely
     * @param {string} str
     * @returns {string}
     */
    encodePassword(str) {
        return encodeURIComponent(str);
    }
}

module.exports = BaseDatabaseConfig;
