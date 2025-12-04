const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../../../../../.env"),
});

const getMigrationDir = require("./helpers/get-migration-dir");
const loadConfig = require("./config");
const executeMigrationWorkflow = require("./engine");

async function main() {
    console.log('🗄️  Running Database Migration Tool');

    // 1. Checking for the Dir name if exist and then return its path
    // NOTE: Proirity for process.argv not the function argument passing
    const { migrationsDir, folderName } = getMigrationDir();
    console.log(`📁  Step 1 - Migration Folder: "${folderName}", with Path: "${migrationsDir}"`);

    // 2. FACTORY PATTERN: Create config based on folder name
    const { connectionString, maskedConnectionString } = loadConfig(folderName);
    console.log(`🔗  Step 2 - Connection String: "${maskedConnectionString}"`);

    // 3. Execute migration workflow
    const result = await executeMigrationWorkflow(folderName, connectionString, migrationsDir);
    console.log(`📤  Step 3 - Migration result: ${JSON.stringify(result)}`);

    // Exit with success
    console.log('👍 All done!');
    process.exit(0);
}

// Run the main function
// Using .catch() here ensures any unhandled errors are caught
// See explanation below for why we don't use .then()

main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});

/**
 * WHY USE .catch() INSTEAD OF .then()?
 * 
 * The pattern:
 *   main().catch(error => { ... })
 * 
 * Is preferred over:
 *   main().then(() => { ... }).catch(error => { ... })
 * 
 * Reasons:
 * 1. The main() function already handles success (process.exit(0))
 * 2. We only need to catch UNEXPECTED errors that escape main's try-catch
 * 3. Using .then() would be redundant since main() has no return value
 * 4. This pattern is cleaner and more concise for scripts
 * 5. If main() succeeds, the script exits; if it fails, .catch() handles it
 * 
 * If we used .then():
 *   main()
 *     .then(() => {
 *       // This never runs because main() calls process.exit(0)
 *       console.log('Success!');
 *     })
 *     .catch(error => {
 *       // Handle errors
 *     });
 * 
 * The .then() block would never execute because process.exit(0) terminates
 * the Node.js process before the promise chain continues.
 */