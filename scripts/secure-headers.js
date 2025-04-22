const https = require('https');

module.exports = function checkSecureHeaders() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'dev.example.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      rejectUnauthorized: false // Allow self-signed certificates
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      
      // Check for important security headers
      const checks = {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'strict-transport-security': headers['strict-transport-security'],
        'x-xss-protection': headers['x-xss-protection'],
        'content-security-policy': headers['content-security-policy'],
        'referrer-policy': headers['referrer-policy']
      };
      
      const results = Object.entries(checks).map(([header, value]) => ({
        header,
        present: !!value,
        value: value || 'Not set'
      }));

      const missingHeaders = results.filter(r => !r.present).map(r => r.header);
      const allHeadersPresent = missingHeaders.length === 0;
      
      // Create detailed output
      const output = results.map(r => 
        `${r.header}: ${r.present ? r.value : 'Missing'}`
      ).join('\n');

      resolve({
        name: "Security Headers Check",
        success: allHeadersPresent,
        command: "HTTPS HEAD request to dev.example.com",
        output: allHeadersPresent ?
          `All required security headers are present\n${output}` :
          `Missing security headers: ${missingHeaders.join(', ')}\n\nDetailed Results:\n${output}`
      });
    });

    req.on('error', (error) => {
      resolve({
        name: "Security Headers Check",
        success: false,
        command: "HTTPS HEAD request to dev.example.com",
        output: `Error checking security headers: ${error.message}`
      });
    });

    req.end();
  });
}; 