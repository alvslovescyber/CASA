// CSRF Security Check Script
const { exec } = require('child_process');
const { URL } = require('url');

module.exports = function CSRFCheck(targetUrl) {
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

            // CSRF test patterns
            const csrfPatterns = [
                'csrf-token',
                'csrf_token',
                'X-CSRF-Token',
                'X-CSRF-TOKEN',
                'X-XSRF-Token',
                'X-XSRF-TOKEN',
                'authenticity_token',
                'anti-forgery-token',
                'csrfmiddlewaretoken',
                'csrf_protection',
                'csrf_validation',
                'csrf_verify'
            ].join('|');

            // Use curl to test for CSRF protection
            const cmd = `curl -sL -A "Mozilla/5.0" "${targetUrl}" | grep -iE '${csrfPatterns}'`;
            
            exec(cmd, (err, stdout, stderr) => {
                if (err && err.code !== 1) { // grep returns 1 when no matches found
                    resolve({
                        name: "CSRF Security Check",
                        success: false,
                        command: cmd,
                        output: `Error executing command: ${err.message}`
                    });
                    return;
                }

                const output = stdout || stderr;
                const success = output.length > 0; // Success if CSRF protection found

                // Prepare detailed explanation
                let explanation = '\nCSRF Security Guidelines:\n';
                explanation += '1. Implement CSRF tokens in all forms\n';
                explanation += '2. Use SameSite cookie attribute\n';
                explanation += '3. Validate Origin/Referer headers\n';
                explanation += '4. Use secure random tokens\n';
                explanation += '5. Implement proper token validation\n';
                explanation += '6. Set appropriate token expiration\n';
                explanation += '7. Use HTTPS for all requests\n';
                explanation += '8. Regular security testing\n';
                
                // Analyze findings
                let analysis = '';
                if (!success) {
                    analysis = '\nPotential CSRF Security Issues Found:\n';
                    analysis += '- No CSRF protection mechanisms detected\n';
                    analysis += '- Forms may be vulnerable to CSRF attacks\n';
                } else {
                    analysis = '\nCSRF Protection Mechanisms Found:\n';
                    const lines = output.trim().split('\n');
                    const uniqueMechanisms = new Set();
                    
                    lines.forEach(line => {
                        if (line.includes('csrf-token')) {
                            uniqueMechanisms.add('- CSRF token implementation detected');
                        }
                        if (line.includes('X-CSRF')) {
                            uniqueMechanisms.add('- CSRF header protection detected');
                        }
                        if (line.includes('authenticity_token')) {
                            uniqueMechanisms.add('- Authenticity token protection detected');
                        }
                        if (line.includes('csrfmiddlewaretoken')) {
                            uniqueMechanisms.add('- Django CSRF protection detected');
                        }
                    });

                    analysis += Array.from(uniqueMechanisms).join('\n');
                }

                resolve({ 
                    name: "CSRF Security Check", 
                    success,
                    command: cmd,
                    output: success ? 
                        `Command: ${cmd}\nResult: CSRF protection mechanisms found\nResponse: ${output.trim()}\n${analysis}${explanation}` : 
                        `Command: ${cmd}\nResult: Warning: No CSRF protection detected\nResponse: No matches found\n${analysis}${explanation}`
                });
            });
        } catch (error) {
            resolve({
                name: "CSRF Security Check",
                success: false,
                command: '',
                output: `Error: ${error.message}`
            });
        }
    });
}; 