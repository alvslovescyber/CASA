// Main Test Runner Script
const path = require('path');
const fs = require('fs');

// Security check scripts
const securityChecks = [
    { name: 'Cookie Security', script: require('./cookie-security') },
    { name: 'Storage Data', script: require('./storagedata') },
    { name: 'XSS Check', script: require('./xss-check') },
    { name: 'SQL Injection', script: require('./sql-injection') },
    { name: 'CSRF Check', script: require('./csrf-check') },
    { name: 'API Security', script: require('./api-security') },
    { name: 'Code Integrity', script: require('./code-integrity') }
];

module.exports = async function runTests(targetUrl) {
    try {
        // Validate URL
        if (!targetUrl) {
            throw new Error('Target URL is required');
        }

        // Run all security checks
        const results = await Promise.all(
            securityChecks.map(async (check) => {
                try {
                    return await check.script(targetUrl);
                } catch (error) {
                    return {
                        name: check.name,
                        success: false,
                        command: '',
                        output: `Error running ${check.name}: ${error.message}`
                    };
                }
            })
        );

        return {
            success: results.every(result => result.success),
            results: results
        };
    } catch (error) {
        return {
            success: false,
            results: [{
                name: 'Test Runner',
                success: false,
                command: '',
                output: `Error: ${error.message}`
            }]
        };
    }
}; 