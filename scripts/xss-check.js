// XSS Security Check Script
const { exec } = require('child_process');
const { URL } = require('url');

module.exports = function XSSCheck(targetUrl) {
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

            // XSS test patterns
            const xssPatterns = [
                '<script>alert(1)</script>',
                '"><script>alert(1)</script>',
                '"><img src=x onerror=alert(1)>',
                '"><svg onload=alert(1)>',
                'javascript:alert(1)',
                '"><iframe src=javascript:alert(1)>',
                '"><input autofocus onfocus=alert(1)>',
                '"><details open ontoggle=alert(1)>'
            ].map(pattern => encodeURIComponent(pattern)).join('|');

            // Use curl to test for XSS vulnerabilities
            const cmd = `curl -sL -A "Mozilla/5.0" "${targetUrl}" | grep -iE '${xssPatterns}'`;
            
            exec(cmd, (err, stdout, stderr) => {
                if (err && err.code !== 1) { // grep returns 1 when no matches found
                    resolve({
                        name: "XSS Security Check",
                        success: false,
                        command: cmd,
                        output: `Error executing command: ${err.message}`
                    });
                    return;
                }

                const output = stdout || stderr;
                const success = output.length === 0;

                // Prepare detailed explanation
                let explanation = '\nXSS Security Guidelines:\n';
                explanation += '1. Implement proper input validation\n';
                explanation += '2. Use output encoding for all user input\n';
                explanation += '3. Implement Content Security Policy (CSP)\n';
                explanation += '4. Use secure frameworks and libraries\n';
                explanation += '5. Sanitize all user input\n';
                explanation += '6. Use HTTP-only cookies\n';
                explanation += '7. Implement proper error handling\n';
                explanation += '8. Regular security testing\n';
                
                // Analyze findings if any
                let analysis = '';
                if (!success) {
                    analysis = '\nPotential XSS Vulnerabilities Found:\n';
                    const lines = output.trim().split('\n');
                    const uniqueIssues = new Set();
                    
                    lines.forEach(line => {
                        if (line.includes('<script>')) {
                            uniqueIssues.add('- Script tag injection possible');
                        }
                        if (line.includes('onerror=') || line.includes('onload=')) {
                            uniqueIssues.add('- Event handler injection possible');
                        }
                        if (line.includes('javascript:')) {
                            uniqueIssues.add('- JavaScript protocol injection possible');
                        }
                        if (line.includes('<iframe>')) {
                            uniqueIssues.add('- Iframe injection possible');
                        }
                        if (line.includes('autofocus') || line.includes('ontoggle')) {
                            uniqueIssues.add('- HTML5 event handler injection possible');
                        }
                    });

                    analysis += Array.from(uniqueIssues).join('\n');
                }

                resolve({ 
                    name: "XSS Security Check", 
                    success,
                    command: cmd,
                    output: success ? 
                        `Command: ${cmd}\nResult: No XSS vulnerabilities found\nResponse: No matches found${explanation}` : 
                        `Command: ${cmd}\nResult: Warning: Found potential XSS vulnerabilities\nResponse: ${output.trim()}\n${analysis}${explanation}`
                });
            });
        } catch (error) {
            resolve({
                name: "XSS Security Check",
                success: false,
                command: '',
                output: `Error: ${error.message}`
            });
        }
    });
}; 