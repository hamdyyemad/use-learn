const BaseDatabaseConfig = require("../base/base-database-config");
const errorHandler = require("../../exceptions/error-handler");

class SupabaseDatabaseConfig extends BaseDatabaseConfig {
    constructor() {
        super();
        this.dbType = 'postgres';
        this.databaseUrl = process.env.DATABASE_URL;
    }

    getConnectionString() {
        // If DATABASE_URL is provided with placeholders, substitute them
        if (this.databaseUrl) {
            return this.databaseUrl;
        }

        errorHandler('DATABASE_URL is required in .env');
    }

    /**
     * Validate the DATABASE_URL format
     * Expected format: postgresql://postgres.{url}:{password}@{host}.supabase.com:{port}/postgres
     * Example: postgresql://postgres.ovitxndzrplauzceewmg:mypassword@aws-1-eu-central-2.pooler.supabase.com:6543/postgres
     */
    validate() {
        const conn = this.getConnectionString();
        if (!conn) {
            errorHandler('DATABASE_URL is required in .env');
        }

        // PostgreSQL connection string pattern for Supabase
        // Format: postgresql://postgres.{project_ref}:{password}@{host}.supabase.com:{port}/postgres
        const pattern = /^postgresql:\/\/postgres\.[a-zA-Z0-9]+:[^@]+@[a-zA-Z0-9\-\.]+\.supabase\.com:\d+\/postgres$/;

        if (!pattern.test(conn)) {
            errorHandler(
                'Invalid DATABASE_URL format. Expected format:\n' +
                '  postgresql://postgres.{project_ref}:{password}@{host}.supabase.com:{port}/postgres\n' +
                '  Example: postgresql://postgres.ovitxndzrplauzceewmg:mypass@aws-1-eu-central-2.pooler.supabase.com:6543/postgres'
            );
        }
    }
}

module.exports = SupabaseDatabaseConfig;