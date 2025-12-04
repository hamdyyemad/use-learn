const errorHandler = require("../../exceptions/error-handler");
const SupabaseDatabaseConfig = require("../types/supabase-database-config");

/**
 * Database Configuration Factory
 * Creates the appropriate config based on folder name
 */
class DatabaseConfigFactory {
    /**
     * Create a database configuration based on folder name
     * @param {string} folderName - Name of the migrations folder
     * @returns {BaseDatabaseConfig}
     */
    static create(folderName) {
        // Normalize folder name
        const normalized = folderName.toLowerCase();

        // Map folder names to configuration classes
        const configMap = {
            'supabase': SupabaseDatabaseConfig,
        };

        // 1. Get the appropriate config class
        const ConfigClass = configMap[normalized];

        // 2. Check if a specific config class was found
        if (!ConfigClass) {
            // If the folder name is not found in the map, throw an error.
            const supportedFolders = Object.keys(configMap).join(', ');
            errorHandler(`Unsupported database folder: "${folderName}". Supported folders are: ${supportedFolders}.`);
        }

        // 3. Return a new instance of the found class
        return new ConfigClass();
    }
}

module.exports = DatabaseConfigFactory;