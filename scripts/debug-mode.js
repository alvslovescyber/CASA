const https = require('https');
const url = require('url');

module.exports = function checkDebugMode(targetUrl) {
    return new Promise((resolve) => {
        const parsedUrl = new URL(targetUrl);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname || '/',
            method: 'GET',
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'SecurityScanner/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            let vulnerabilities = [];

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                // Check for common debug indicators
                const debugChecks = [
                    {
                        pattern: /console\.(log|debug|info)/i,
                        message: 'Console logging statements found in production code'
                    },
                    {
                        pattern: /debugger;/,
                        message: 'Debugger statements found in code'
                    },
                    {
                        pattern: /(DEBUG|DEVELOPMENT)(_MODE)?(\s*=\s*true)/i,
                        message: 'Debug/Development mode flags found'
                    },
                    {
                        pattern: /stack trace|debug mode|development mode/i,
                        message: 'Debug/Development mode indicators found'
                    },
                    {
                        pattern: /verbose error|detailed error/i,
                        message: 'Detailed error messages exposed'
                    }
                ];

                // Check response headers for debug indicators
                const headers = res.headers;
                if (headers['x-debug'] || headers['debug-mode']) {
                    vulnerabilities.push('Debug headers exposed in response');
                }

                // Check for debug indicators in response body
                debugChecks.forEach(check => {
                    if (check.pattern.test(data)) {
                        vulnerabilities.push(check.message);
                    }
                });

                const success = vulnerabilities.length === 0;
                let output = `Debug Mode Security Check Results for ${targetUrl}:\n\n`;

                if (success) {
                    output += 'No debug mode vulnerabilities detected.\n\n';
                } else {
                    output += 'Debug mode vulnerabilities found:\n\n';
                    vulnerabilities.forEach(v => {
                        output += `- ${v}\n`;
                    });
                    output += '\n';
                }

                output += 'Recommendations:\n';
                output += '1. Remove all console logging statements from production code\n';
                output += '2. Remove debugger statements\n';
                output += '3. Ensure debug mode is disabled in production\n';
                output += '4. Configure proper error handling for production\n';
                output += '5. Remove any debug headers from responses\n';
                output += '6. Use appropriate logging levels for production\n';

                resolve({
                    name: "Debug Mode Check",
                    success: success,
                    command: `Checking debug mode on ${targetUrl}`,
                    output: output
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                name: "Debug Mode Check",
                success: false,
                command: `Checking debug mode on ${targetUrl}`,
                output: `Error checking debug mode: ${error.message}`
            });
        });

        req.end();
    });
}; 