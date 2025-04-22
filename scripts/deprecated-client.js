const https = require('https');
const url = require('url');

module.exports = function checkDeprecatedClient(targetUrl) {
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
                // Check for deprecated libraries and versions
                const deprecatedChecks = [
                    {
                        pattern: /jquery[.-]?([1-2]\.[0-9]+\.[0-9]+)/i,
                        message: 'Outdated jQuery version detected'
                    },
                    {
                        pattern: /bootstrap[.-]?([1-3]\.[0-9]+\.[0-9]+)/i,
                        message: 'Outdated Bootstrap version detected'
                    },
                    {
                        pattern: /angular[.-]?(1\.[0-9]+\.[0-9]+)/i,
                        message: 'Outdated AngularJS version detected'
                    },
                    {
                        pattern: /react[.-]?([0-9]+\.[0-9]+\.[0-9]+)/i,
                        check: (version) => {
                            const [major] = version.split('.');
                            return parseInt(major) < 16;
                        },
                        message: 'Outdated React version detected'
                    },
                    {
                        pattern: /prototype\.js|mootools|scriptaculous/i,
                        message: 'Deprecated JavaScript library detected'
                    },
                    {
                        pattern: /moment[.-]?([0-9]+\.[0-9]+\.[0-9]+)/i,
                        message: 'Consider using modern alternatives to Moment.js'
                    }
                ];

                // Check for insecure practices
                const insecurePatterns = [
                    {
                        pattern: /document\.write/i,
                        message: 'Usage of deprecated document.write()'
                    },
                    {
                        pattern: /eval\s*\(/i,
                        message: 'Usage of unsafe eval() function'
                    },
                    {
                        pattern: /innerHTML\s*=/i,
                        message: 'Direct innerHTML manipulation detected'
                    }
                ];

                // Check for deprecated libraries
                deprecatedChecks.forEach(check => {
                    const match = data.match(check.pattern);
                    if (match) {
                        if (!check.check || check.check(match[1])) {
                            vulnerabilities.push(check.message);
                        }
                    }
                });

                // Check for insecure practices
                insecurePatterns.forEach(check => {
                    if (check.pattern.test(data)) {
                        vulnerabilities.push(check.message);
                    }
                });

                const success = vulnerabilities.length === 0;
                let output = `Deprecated Client Libraries Check Results for ${targetUrl}:\n\n`;

                if (success) {
                    output += 'No deprecated libraries or insecure practices detected.\n\n';
                } else {
                    output += 'Issues found:\n\n';
                    vulnerabilities.forEach(v => {
                        output += `- ${v}\n`;
                    });
                    output += '\n';
                }

                output += 'Recommendations:\n';
                output += '1. Update all client-side libraries to their latest stable versions\n';
                output += '2. Replace deprecated libraries with modern alternatives\n';
                output += '3. Use modern DOM manipulation methods instead of deprecated ones\n';
                output += '4. Implement proper Content Security Policy (CSP)\n';
                output += '5. Use package managers and version lock files\n';
                output += '6. Regularly audit and update dependencies\n';

                resolve({
                    name: "Deprecated Client Check",
                    success: success,
                    command: `Checking deprecated client libraries on ${targetUrl}`,
                    output: output
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                name: "Deprecated Client Check",
                success: false,
                command: `Checking deprecated client libraries on ${targetUrl}`,
                output: `Error checking deprecated clients: ${error.message}`
            });
        });

        req.end();
    });
}; 