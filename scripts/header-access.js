const https = require('https');
const url = require('url');

module.exports = function checkSecurityHeaders(targetUrl) {
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
            const headers = res.headers;
            let vulnerabilities = [];

            // Required security headers
            const securityHeaders = {
                'strict-transport-security': {
                    required: true,
                    recommendation: 'Add Strict-Transport-Security header with appropriate max-age'
                },
                'content-security-policy': {
                    required: true,
                    recommendation: 'Implement Content Security Policy'
                },
                'x-frame-options': {
                    required: true,
                    recommendation: 'Set X-Frame-Options to prevent clickjacking'
                },
                'x-content-type-options': {
                    required: true,
                    recommendation: 'Set X-Content-Type-Options to nosniff'
                },
                'referrer-policy': {
                    required: true,
                    recommendation: 'Configure appropriate Referrer-Policy'
                },
                'permissions-policy': {
                    required: false,
                    recommendation: 'Consider implementing Permissions-Policy'
                },
                'x-xss-protection': {
                    required: true,
                    recommendation: 'Enable X-XSS-Protection header'
                }
            };

            // Check for missing required headers
            Object.entries(securityHeaders).forEach(([header, config]) => {
                if (config.required && !headers[header]) {
                    vulnerabilities.push({
                        header,
                        message: `Missing ${header}`,
                        recommendation: config.recommendation
                    });
                }
            });

            // Check specific header values
            if (headers['x-frame-options'] && 
                !['DENY', 'SAMEORIGIN'].includes(headers['x-frame-options'].toUpperCase())) {
                vulnerabilities.push({
                    header: 'x-frame-options',
                    message: 'Weak X-Frame-Options configuration',
                    recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN'
                });
            }

            if (headers['x-content-type-options'] !== 'nosniff') {
                vulnerabilities.push({
                    header: 'x-content-type-options',
                    message: 'Incorrect X-Content-Type-Options value',
                    recommendation: 'Set X-Content-Type-Options to nosniff'
                });
            }

            const success = vulnerabilities.length === 0;
            let output = `Security Headers Check Results for ${targetUrl}:\n\n`;

            if (success) {
                output += 'All required security headers are properly configured.\n\n';
            } else {
                output += 'Security header issues found:\n\n';
                vulnerabilities.forEach(v => {
                    output += `- ${v.message}\n  Recommendation: ${v.recommendation}\n`;
                });
                output += '\n';
            }

            output += 'Recommendations:\n';
            output += '1. Implement all missing security headers\n';
            output += '2. Configure appropriate values for existing headers\n';
            output += '3. Use secure defaults for all security headers\n';
            output += '4. Regularly review and update security header configurations\n';
            output += '5. Test security headers using online tools\n';
            output += '6. Monitor for new security headers and best practices\n';

            resolve({
                name: "Security Headers Check",
                success: success,
                command: `Checking security headers on ${targetUrl}`,
                output: output
            });
        });

        req.on('error', (error) => {
            resolve({
                name: "Security Headers Check",
                success: false,
                command: `Checking security headers on ${targetUrl}`,
                output: `Error checking security headers: ${error.message}`
            });
        });

        req.end();
    });
}; 