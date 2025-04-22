// SQL Injection Security Check Script
const { exec } = require('child_process');
const { URL } = require('url');

module.exports = function SQLInjection(targetUrl) {
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

            // SQL Injection test patterns
            const sqlPatterns = [
                "' OR '1'='1",
                "' OR '1'='1' --",
                "' OR '1'='1' #",
                "' OR '1'='1'/*",
                "admin' --",
                "admin' #",
                "admin'/*",
                "' UNION SELECT",
                "' UNION ALL SELECT",
                "'; DROP TABLE",
                "' OR 1=1",
                "' OR 'x'='x"
            ].map(pattern => encodeURIComponent(pattern)).join('|');

            // Use curl to test for SQL injection vulnerabilities
            const cmd = `curl -sL -A "Mozilla/5.0" "${targetUrl}" | grep -iE '${sqlPatterns}'`;
            
            exec(cmd, (err, stdout, stderr) => {
                if (err && err.code !== 1) { // grep returns 1 when no matches found
                    resolve({
                        name: "SQL Injection Security Check",
                        success: false,
                        command: cmd,
                        output: `Error executing command: ${err.message}`
                    });
                    return;
                }

                const output = stdout || stderr;
                const success = output.length === 0;

                // Prepare detailed explanation
                let explanation = '\nSQL Injection Security Guidelines:\n';
                explanation += '1. Use parameterized queries or prepared statements\n';
                explanation += '2. Implement proper input validation\n';
                explanation += '3. Use stored procedures\n';
                explanation += '4. Implement proper error handling\n';
                explanation += '5. Use ORM frameworks\n';
                explanation += '6. Implement proper access controls\n';
                explanation += '7. Regular security testing\n';
                explanation += '8. Use database-specific security features\n';
                
                // Analyze findings if any
                let analysis = '';
                if (!success) {
                    analysis = '\nPotential SQL Injection Vulnerabilities Found:\n';
                    const lines = output.trim().split('\n');
                    const uniqueIssues = new Set();
                    
                    lines.forEach(line => {
                        if (line.includes("' OR '1'='1")) {
                            uniqueIssues.add('- Basic SQL injection possible');
                        }
                        if (line.includes('UNION SELECT')) {
                            uniqueIssues.add('- UNION-based SQL injection possible');
                        }
                        if (line.includes('DROP TABLE')) {
                            uniqueIssues.add('- Destructive SQL injection possible');
                        }
                        if (line.includes('OR 1=1')) {
                            uniqueIssues.add('- Boolean-based SQL injection possible');
                        }
                    });

                    analysis += Array.from(uniqueIssues).join('\n');
                }

                resolve({ 
                    name: "SQL Injection Security Check", 
                    success,
                    command: cmd,
                    output: success ? 
                        `Command: ${cmd}\nResult: No SQL injection vulnerabilities found\nResponse: No matches found${explanation}` : 
                        `Command: ${cmd}\nResult: Warning: Found potential SQL injection vulnerabilities\nResponse: ${output.trim()}\n${analysis}${explanation}`
                });
            });
        } catch (error) {
            resolve({
                name: "SQL Injection Security Check",
                success: false,
                command: '',
                output: `Error: ${error.message}`
            });
        }
    });
}; 