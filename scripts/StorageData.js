// 8.2.2 Check for sensitive data in local/session storage

const { exec } = require("child_process");
const { URL } = require('url');

module.exports = function StorageData(targetUrl) {
  return new Promise((resolve) => {
    try {
      // Validate URL
      if (!targetUrl) {
        throw new Error('Target URL is required');
      }

      // Validate URL format
      try {
        new URL(targetUrl);
      } catch (e) {
        throw new Error('Invalid URL format');
      }

      // Storage test patterns
      const storagePatterns = [
        'localStorage\\.',
        'sessionStorage\\.',
        'setItem\\(',
        'getItem\\(',
        'removeItem\\(',
        '\\.clear\\(',
        'storage\\.set',
        'storage\\.get',
        'window\\.storage',
        'document\\.storage',
        'storage\\.remove',
        'storage\\.clear'
      ].join('|');

      // Use curl to test for storage usage
      const cmd = `curl -sL -A "Mozilla/5.0" "${targetUrl}" | grep -iE '${storagePatterns}'`;
      
      exec(cmd, (err, stdout, stderr) => {
        if (err && err.code !== 1) { // grep returns 1 when no matches found
          resolve({
            name: "Client Storage Security Check",
            success: false,
            command: cmd,
            output: `Error executing command: ${err.message}`
          });
          return;
        }

        const output = stdout || stderr;
        const success = output.length === 0; // Success if no storage usage found

        // Prepare detailed explanation
        let explanation = '\nClient Storage Security Guidelines:\n';
        explanation += '1. Avoid storing sensitive data in client storage\n';
        explanation += '2. Use secure storage mechanisms\n';
        explanation += '3. Implement proper data encryption\n';
        explanation += '4. Set appropriate expiration times\n';
        explanation += '5. Use secure flags for cookies\n';
        explanation += '6. Implement proper access controls\n';
        explanation += '7. Regular security audits\n';
        explanation += '8. Follow data protection regulations\n';
        
        // Analyze findings if any
        let analysis = '';
        if (!success) {
          analysis = '\nPotential Storage Security Issues Found:\n';
          const lines = output.trim().split('\n');
          const uniqueIssues = new Set();
          
          lines.forEach(line => {
            if (line.includes('localStorage')) {
              uniqueIssues.add('- Local storage usage detected');
            }
            if (line.includes('sessionStorage')) {
              uniqueIssues.add('- Session storage usage detected');
            }
            if (line.includes('setItem')) {
              uniqueIssues.add('- Data storage operations detected');
            }
            if (line.includes('getItem')) {
              uniqueIssues.add('- Data retrieval operations detected');
            }
            if (line.includes('clear')) {
              uniqueIssues.add('- Storage clearing operations detected');
            }
          });

          analysis += Array.from(uniqueIssues).join('\n');
        }

        resolve({ 
          name: "Client Storage Security Check", 
          success,
          command: cmd,
          output: success ? 
            `Command: ${cmd}\nResult: No storage security issues found\nResponse: No matches found${explanation}` : 
            `Command: ${cmd}\nResult: Warning: Found potential storage security issues\nResponse: ${output.trim()}\n${analysis}${explanation}`
        });
      });
    } catch (error) {
      resolve({
        name: "Client Storage Security Check",
        success: false,
        command: '',
        output: `Error: ${error.message}`
      });
    }
  });
};
