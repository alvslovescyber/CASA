// 13.1.3 API URLs shouldnt leak sensitive info

const { exec } = require("child_process");
const https = require('https');
const http = require('http');

/**
 * Performs security checks on API endpoints
 * @param {string} targetUrl - The URL to test
 * @returns {Promise<Object>} Test results
 */
module.exports = async function runTest(targetUrl) {
    try {
        const url = new URL(targetUrl);
        const results = [];
        
        // Check HTTPS
        results.push({
            check: 'HTTPS Protocol',
            status: url.protocol === 'https:' ? 'pass' : 'fail',
            details: url.protocol === 'https:' 
                ? 'Site uses HTTPS protocol'
                : 'Site is not using HTTPS protocol - this is a security risk'
        });

        // Check response headers
        const headers = await checkHeaders(url);
        results.push(...headers);

        // Determine overall success
        const hasFailures = results.some(r => r.status === 'fail');

        return {
            success: !hasFailures,
            output: formatResults(results)
        };
    } catch (error) {
        return {
            success: false,
            output: `Error performing API security checks: ${error.message}`
        };
    }
};

async function checkHeaders(url) {
    return new Promise((resolve) => {
        const protocol = url.protocol === 'https:' ? https : http;
        
        const req = protocol.get(url.href, (res) => {
            const results = [];
            
            // Check security headers
            const headers = res.headers;
            
            // Content Security Policy
            results.push({
                check: 'Content-Security-Policy',
                status: headers['content-security-policy'] ? 'pass' : 'fail',
                details: headers['content-security-policy']
                    ? 'CSP header is configured'
                    : 'Missing Content Security Policy header'
            });

            // X-Frame-Options
            results.push({
                check: 'X-Frame-Options',
                status: headers['x-frame-options'] ? 'pass' : 'fail',
                details: headers['x-frame-options']
                    ? `X-Frame-Options is set to: ${headers['x-frame-options']}`
                    : 'Missing X-Frame-Options header'
            });

            // X-Content-Type-Options
            results.push({
                check: 'X-Content-Type-Options',
                status: headers['x-content-type-options'] === 'nosniff' ? 'pass' : 'fail',
                details: headers['x-content-type-options'] === 'nosniff'
                    ? 'X-Content-Type-Options is properly set to nosniff'
                    : 'Missing or incorrect X-Content-Type-Options header'
            });

            resolve(results);
        });

        req.on('error', (error) => {
            resolve([{
                check: 'Connection Test',
                status: 'fail',
                details: `Failed to connect: ${error.message}`
            }]);
        });

        // Set a timeout of 10 seconds
        req.setTimeout(10000, () => {
            req.destroy();
            resolve([{
                check: 'Connection Test',
                status: 'fail',
                details: 'Request timed out after 10 seconds'
            }]);
        });
    });
}

function formatResults(results) {
    return results.map(result => {
        const icon = result.status === 'pass' ? '✓' : '✗';
        const color = result.status === 'pass' ? 'green' : 'red';
        return `${icon} ${result.check}: ${result.details}`;
    }).join('\n');
}
