const AdapterFactory = require('./factory/adapter-factory');
const MigrationRunner = require('./orchestrator/migration-runner');

/**
 * Executes the complete migration process: creates the adapter,
 * initializes the runner, runs migrations, and performs cleanup.
 *
 * @param {string} dbType - The type of database (e.g., 'supabase', 'mysql').
 * @param {string} connectionString - The database connection string.
 * @param {string} migrationsDir - The directory containing migration files.
 * @returns {Promise<any>} The result of the migration run.
 */
async function executeMigrationWorkflow(folderName, connectionString, migrationsDir) {
    // 1. Create database adapter based on DB type
    const adapter = AdapterFactory.create(folderName, connectionString);

    // 2. Create migration runner
    const runner = new MigrationRunner(adapter, migrationsDir);
    console.log(`Starting migrations for DB type: ${folderName}`);

    // 3. Run migrations
    const result = await runner.run();
    console.log(`Migrations finished. Result: ${JSON.stringify(result)}`);

    // 4. Cleanup
    await runner.cleanup();

    return result;
}

module.exports = executeMigrationWorkflow;