const https = require('https');
const url = require('url');

module.exports = function checkAPISecurity(targetUrl) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(targetUrl);
    const apiEndpoints = [
      '/api/users',
      '/api/data',
      '/api/auth',
      '/api/admin'
    ];

    let completedChecks = 0;
    let vulnerabilities = [];

    const checkEndpoint = (endpoint) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: endpoint,
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'SecurityScanner/1.0'
        }
      };

      const req = https.request(options, (res) => {
        const checks = {
          authentication: false,
          rateLimiting: false,
          cors: false,
          https: parsedUrl.protocol === 'https:',
          securityHeaders: false
        };

        // Check for authentication headers
        if (res.headers['www-authenticate'] || res.headers['authorization']) {
          checks.authentication = true;
        }

        // Check for rate limiting headers
        if (res.headers['x-ratelimit-limit'] || res.headers['x-ratelimit-remaining']) {
          checks.rateLimiting = true;
        }

        // Check for CORS headers
        if (res.headers['access-control-allow-origin']) {
          checks.cors = true;
        }

        // Check for security headers
        const securityHeaders = [
          'content-security-policy',
          'x-frame-options',
          'x-content-type-options',
          'strict-transport-security'
        ];

        checks.securityHeaders = securityHeaders.every(header => 
          res.headers[header] !== undefined
        );

        // Collect vulnerabilities
        if (!checks.authentication) {
          vulnerabilities.push(`${endpoint}: Missing authentication`);
        }
        if (!checks.rateLimiting) {
          vulnerabilities.push(`${endpoint}: Missing rate limiting`);
        }
        if (!checks.cors) {
          vulnerabilities.push(`${endpoint}: Missing CORS headers`);
        }
        if (!checks.https) {
          vulnerabilities.push(`${endpoint}: Not using HTTPS`);
        }
        if (!checks.securityHeaders) {
          vulnerabilities.push(`${endpoint}: Missing security headers`);
        }

        completedChecks++;
        if (completedChecks === apiEndpoints.length) {
          const success = vulnerabilities.length === 0;
          let output = `API Security Check Results for ${targetUrl}:\n\n`;

          if (success) {
            output += 'No API security vulnerabilities detected.\n\n';
          } else {
            output += 'Potential API security vulnerabilities found:\n\n';
            vulnerabilities.forEach(v => {
              output += `- ${v}\n`;
            });
            output += '\n';
          }

          output += 'Recommendations:\n';
          output += '1. Implement proper authentication for all API endpoints\n';
          output += '2. Add rate limiting to prevent abuse\n';
          output += '3. Configure CORS headers appropriately\n';
          output += '4. Use HTTPS for all API communications\n';
          output += '5. Add security headers to all API responses\n';
          output += '6. Implement input validation and sanitization\n';
          output += '7. Use proper error handling without exposing sensitive information\n';

          resolve({
            name: "API Security Check",
            success: success,
            command: `Testing API security on ${targetUrl}`,
            output: output
          });
        }
      });

      req.on('error', (error) => {
        completedChecks++;
        if (completedChecks === apiEndpoints.length) {
          resolve({
            name: "API Security Check",
            success: false,
            command: `Testing API security on ${targetUrl}`,
            output: `Error checking API security: ${error.message}`
          });
        }
      });

      req.end();
    };

    // Test all API endpoints
    apiEndpoints.forEach(endpoint => {
      checkEndpoint(endpoint);
    });
  });
}; 