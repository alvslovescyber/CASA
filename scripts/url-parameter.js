const { exec } = require('child_process');
const { URL } = require('url');

module.exports = function URLParameter(targetUrl) {
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

            // URL parameter test patterns
            const paramPatterns = [
                '\\?[^\\s]*=',
                '\\&[^\\s]*=',
                'location\\.search',
                'URLSearchParams',
                'window\\.location',
                'document\\.location',
                '\\?[^\\s]*\\[',
                '\\&[^\\s]*\\['
            ].join('|');

            // Use curl to test for URL parameter handling
            const cmd = `curl -sL -A "Mozilla/5.0" "${targetUrl}" | grep -iE '${paramPatterns}'`;
            
            exec(cmd, (err, stdout, stderr) => {
                if (err && err.code !== 1) { // grep returns 1 when no matches found
                    resolve({
                        name: "URL Parameter Security Check",
                        success: false,
                        command: cmd,
                        output: `Error executing command: ${err.message}`
                    });
                    return;
                }

                const output = stdout || stderr;
                const success = output.length === 0; // Success if no parameter handling found

                // Prepare detailed explanation
                let explanation = '\nURL Parameter Security Guidelines:\n';
                explanation += '1. Validate all URL parameters\n';
                explanation += '2. Sanitize parameter values\n';
                explanation += '3. Use proper encoding/decoding\n';
                explanation += '4. Implement parameter length limits\n';
                explanation += '5. Use secure parameter handling\n';
                explanation += '6. Avoid sensitive data in URLs\n';
                explanation += '7. Implement proper error handling\n';
                explanation += '8. Regular security testing\n';
                
                // Analyze findings if any
                let analysis = '';
                if (!success) {
                    analysis = '\nPotential URL Parameter Security Issues Found:\n';
                    const lines = output.trim().split('\n');
                    const uniqueIssues = new Set();
                    
                    lines.forEach(line => {
                        if (line.includes('location.search')) {
                            uniqueIssues.add('- Direct location.search usage detected');
                        }
                        if (line.includes('URLSearchParams')) {
                            uniqueIssues.add('- URLSearchParams usage detected');
                        }
                        if (line.includes('window.location')) {
                            uniqueIssues.add('- Window location manipulation detected');
                        }
                        if (line.includes('document.location')) {
                            uniqueIssues.add('- Document location manipulation detected');
                        }
                        if (line.includes('?') || line.includes('&')) {
                            uniqueIssues.add('- URL parameter handling detected');
                        }
                    });

                    analysis += Array.from(uniqueIssues).join('\n');
                }

                resolve({ 
                    name: "URL Parameter Security Check", 
                    success,
                    command: cmd,
                    output: success ? 
                        `Command: ${cmd}\nResult: No URL parameter security issues found\nResponse: No matches found${explanation}` : 
                        `Command: ${cmd}\nResult: Warning: Found potential URL parameter security issues\nResponse: ${output.trim()}\n${analysis}${explanation}`
                });
            });
        } catch (error) {
            resolve({
                name: "URL Parameter Security Check",
                success: false,
                command: '',
                output: `Error: ${error.message}`
            });
        }
    });
}; 