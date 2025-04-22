// Cookie Security Check Script
const { exec } = require('child_process');
const { URL } = require('url');

module.exports = function CookieSecurity(targetUrl) {
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

            // Use curl to get cookie information
            const cmd = `curl -sL -I -A "Mozilla/5.0" "${targetUrl}" | grep -i "set-cookie\\|cookie"`;
            
            exec(cmd, (err, stdout, stderr) => {
                if (err && err.code !== 1) { // grep returns 1 when no matches found
                    resolve({
                        name: "Cookie Security Check",
                        success: false,
                        command: cmd,
                        output: `Error executing command: ${err.message}`
                    });
                    return;
                }

                const output = stdout || stderr;
                const success = output.length === 0;

                // Prepare detailed explanation
                let explanation = '\nCookie Security Guidelines:\n';
                explanation += '1. Use Secure flag for all cookies\n';
                explanation += '2. Use HttpOnly flag for session cookies\n';
                explanation += '3. Set appropriate SameSite attribute\n';
                explanation += '4. Use proper cookie expiration times\n';
                explanation += '5. Avoid storing sensitive data in cookies\n';
                explanation += '6. Implement proper cookie encryption\n';
                explanation += '7. Use secure cookie prefixes\n';
                explanation += '8. Regularly audit cookie usage\n';
                
                // Analyze findings if any
                let analysis = '';
                if (!success) {
                    analysis = '\nPotential Issues Found:\n';
                    const lines = output.trim().split('\n');
                    const uniqueIssues = new Set();
                    
                    lines.forEach(line => {
                        const cookie = line.toLowerCase();
                        if (!cookie.includes('secure')) {
                            uniqueIssues.add('- Cookie missing Secure flag');
                        }
                        if (!cookie.includes('httponly')) {
                            uniqueIssues.add('- Cookie missing HttpOnly flag');
                        }
                        if (!cookie.includes('samesite')) {
                            uniqueIssues.add('- Cookie missing SameSite attribute');
                        }
                        if (cookie.includes('expires=') && cookie.includes('session')) {
                            uniqueIssues.add('- Session cookie with expiration date');
                        }
                        if (cookie.includes('domain=') && cookie.includes('localhost')) {
                            uniqueIssues.add('- Cookie set for localhost domain');
                        }
                    });

                    analysis += Array.from(uniqueIssues).join('\n');
                }

                resolve({ 
                    name: "Cookie Security Check", 
                    success,
                    command: cmd,
                    output: success ? 
                        `Command: ${cmd}\nResult: No cookie security issues found\nResponse: No matches found${explanation}` : 
                        `Command: ${cmd}\nResult: Warning: Found potential cookie security issues\nResponse: ${output.trim()}\n${analysis}${explanation}`
                });
            });
        } catch (error) {
            resolve({
                name: "Cookie Security Check",
                success: false,
                command: '',
                output: `Error: ${error.message}`
            });
        }
    });
}; 