require('dotenv').config();
const { verifyAuthentication, runApiTests, logger } = require('./authTest');
const chalk = require('chalk');
const path = require('path');

async function runChecks() {
    try {
        logger.log('Starting security and API checks...', 'INFO');
        logger.log(`Log file: ${path.relative(process.cwd(), logger.logFile)}`, 'INFO');

        // Step 1: Authenticate and get session cookie
        logger.log('Step 1: Authentication', 'INFO');
        const authData = await verifyAuthentication();
        
        if (!authData || !authData.sessionCookie) {
            logger.log('Authentication failed - no valid session data returned', 'ERROR');
            process.exit(1);
        }

        // Step 2: Run API tests
        logger.log('Step 2: API Tests', 'INFO');
        const apiTestsSuccess = await runApiTests(authData);
        
        if (!apiTestsSuccess) {
            logger.log('API tests failed - check the logs for details', 'ERROR');
            process.exit(1);
        }

        logger.log('All checks completed successfully!', 'SUCCESS');
        logger.log(`Full logs available at: ${path.relative(process.cwd(), logger.logFile)}`, 'INFO');
    } catch (error) {
        logger.log('Error during test execution:', 'ERROR');
        logger.log(error.stack || error.message, 'ERROR');
        process.exit(1);
    }
}

// Run the checks
if (require.main === module) {
    runChecks();
}

module.exports = runChecks; 