const fs = require('fs');
const path = require('path');
const errorHandler = require("../exceptions/error-handler");

/**
 * Retrieves the migration folder name from command line arguments.
 * 
 * It expects the folder name to be the third argument (index 2) in process.argv.
 * If not provided, it falls back to the default folder name.
 * 
 * It also validates that the migration folder exists in the migrations directory.
 * If the folder does not exist, the process exits with an error.
 * 
 * NOTE: This function is synchronous.
 * Reason: This is initialization logic that runs once at the start of the script.
 * Blocking the event loop here is acceptable and simplifies the usage (no await needed).
 * 
 * Example process.argv:
 * [
 *   '.../node.exe',
 *   '.../run-migrations2.js',
 *   'subapase' // This is the value we want
 * ]
 * 
 * NOTE: Proirity for process.argv not the function argument passing
 * 
 * @param {string} [defaultFolderName="subapase"] - The default folder name to use if no argument is provided.
 * @returns {string} The path of the migration folder to use.
 */
module.exports = function getMigrationDir(defaultFolderName = "supabase") {
    // NOTE: Proirity for process.argv not the function argument passing
    const folderName = process.argv[2] || defaultFolderName;

    const migrationsDir = path.join(__dirname, "../../../migrations", folderName);

    if (!fs.existsSync(migrationsDir)) {
        errorHandler(`Migrations directory not found: ${migrationsDir}`);
    }

    return { migrationsDir, folderName };
}