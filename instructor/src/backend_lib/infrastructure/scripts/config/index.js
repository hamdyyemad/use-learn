const DatabaseConfigFactory = require("./factory/database-config-factory");

function loadConfig(folderName) {
    // FACTORY PATTERN: Create config based on folder name
    const config = DatabaseConfigFactory.create(folderName);

    // Print debug info
    config.printDebugInfo();

    // Validate configuration
    config.validate();

    // Get connection string and database type
    const connectionString = config.getConnectionString();
    const dbType = config.getDbType();

    const maskedConnectionString = config.getMaskedConnectionString();

    return { dbType, connectionString, maskedConnectionString };
}

module.exports = loadConfig;