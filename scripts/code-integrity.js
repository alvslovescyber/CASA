const https = require('https');
const url = require('url');
const crypto = require('crypto');

module.exports = function checkCodeIntegrity(targetUrl) {
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
        // Check for common code integrity issues
        const checks = [
          {
            name: 'Source Maps',
            check: () => !data.includes('.map'),
            recommendation: 'Remove source maps from production'
          },
          {
            name: 'Debug Code',
            check: () => !data.includes('console.log') && !data.includes('debugger'),
            recommendation: 'Remove debug code from production'
          },
          {
            name: 'Hardcoded Secrets',
            check: () => !data.match(/password|secret|key|token/i),
            recommendation: 'Remove hardcoded secrets'
          },
          {
            name: 'Minification',
            check: () => data.length < 1000000, // Simple check for minification
            recommendation: 'Minify JavaScript code'
          },
          {
            name: 'Content Security',
            check: () => !!res.headers['content-security-policy'],
            recommendation: 'Implement Content Security Policy'
          }
        ];

        const results = checks.map(check => ({
          name: check.name,
          passed: check.check(),
          recommendation: check.passed ? null : check.recommendation
        }));

        // Check for integrity attributes
        const scripts = data.match(/<script[^>]*>/g) || [];
        scripts.forEach(script => {
          if (!script.includes('integrity=')) {
            vulnerabilities.push('Script missing integrity attribute');
          }
        });

        const allPassed = results.every(r => r.passed) && vulnerabilities.length === 0;
        let output = `Code Integrity Check Results for ${targetUrl}:\n\n`;

        if (allPassed) {
          output += 'No code integrity issues detected.\n\n';
        } else {
          output += 'Potential code integrity issues found:\n\n';
          results.forEach(r => {
            if (!r.passed) {
              output += `- ${r.name}: ${r.recommendation}\n`;
            }
          });
          vulnerabilities.forEach(v => {
            output += `- ${v}\n`;
          });
          output += '\n';
        }

        output += 'Recommendations:\n';
        output += '1. Remove all source maps from production code\n';
        output += '2. Remove debug code and console statements\n';
        output += '3. Never hardcode secrets in client-side code\n';
        output += '4. Minify and obfuscate JavaScript code\n';
        output += '5. Add integrity attributes to all scripts\n';
        output += '6. Implement Content Security Policy\n';
        output += '7. Use Subresource Integrity (SRI) for external resources\n';

        resolve({
          name: "Code Integrity Check",
          success: allPassed,
          command: `Checking code integrity on ${targetUrl}`,
          output: output
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: "Code Integrity Check",
        success: false,
        command: `Checking code integrity on ${targetUrl}`,
        output: `Error checking code integrity: ${error.message}`
      });
    });

    req.end();
  });
}; 