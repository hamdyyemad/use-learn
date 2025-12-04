/**
 * Handles critical application errors, logs the provided message to the console
 * (stderr), and exits the Node.js process with a non-zero exit code (1) to 
 * signal that a failure occurred.
 * * @param {string} msg - The error message to be logged before exiting.
 */
function errorHandler(msg) {
    console.error("❌ Error: " + msg);
    process.exit(1);
};

module.exports = errorHandler;

// This generic function can now be used by specific error wrappers,
// e.g., for unsupported configuration:

// module.exports.handleUnsupportedFolderError = (folderName, supportedFolders) => {
//     const supportedList = supportedFolders.join(', ');
//     const errorMsg = `Unsupported database folder: "${folderName}". Supported: ${supportedList}`;
//     module.exports.errorHandler(errorMsg);
// };