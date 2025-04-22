const { exec } = require("child_process");
const chalk = require('chalk');

module.exports = function URLParams() {
    return new Promise((resolve) => {
        // Patterns to check for URL parameter vulnerabilities
        const patterns = [
            'window\\.location',        // Direct location access
            'document\\.URL',           // URL access
            'document\\.location',      // Location access
            '\\?[^\\s]*=',             // URL parameters
            '\\&[^\\s]*=',             // URL parameters
            'decodeURIComponent',       // URL decoding
            'encodeURIComponent',       // URL encoding
            'new URL\\(',              // URL object creation
            'URLSearchParams',         // URL parameter manipulation
            '\\.[a-zA-Z]+\\?',         // File extensions with parameters
            '\\.[a-zA-Z]+\\&',         // File extensions with parameters
            '\\.[a-zA-Z]+\\#',         // File extensions with fragments
            '\\.[a-zA-Z]+\\/'          // File extensions with paths
        ].join('|');

        const cmd = `curl -sL https://dev.example.com | grep -iE '${patterns}'`;
        
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                resolve({
                    name: "URL Parameter Security Check",
                    success: false,
                    command: cmd,
                    output: chalk.red(`Error: ${err.message}\n\nThis could be due to:\n1. Network connectivity issues\n2. Invalid URL\n3. Server not responding\n4. SSL/TLS certificate issues\n\nPlease check your network connection and try again.`)
                });
                return;
            }

            const output = stdout || stderr;
            const success = output.length === 0;

            // Prepare detailed explanation with dark mode support
            let explanation = '\nURL Parameter Security Guidelines:\n';
            explanation += chalk.cyan('1. Validate all URL parameters on the server side\n');
            explanation += chalk.cyan('2. Use parameterized queries for database operations\n');
            explanation += chalk.cyan('3. Implement proper input sanitization\n');
            explanation += chalk.cyan('4. Use HTTPS for all URL communications\n');
            explanation += chalk.cyan('5. Implement proper error handling for invalid parameters\n');
            explanation += chalk.cyan('6. Avoid exposing sensitive information in URLs\n');
            explanation += chalk.cyan('7. Use POST instead of GET for sensitive data\n');
            explanation += chalk.cyan('8. Implement rate limiting for URL parameter access\n');
            
            // Analyze findings if any
            let analysis = '';
            if (!success) {
                analysis = '\nPotential Issues Found:\n';
                const lines = output.trim().split('\n');
                lines.forEach(line => {
                    if (line.includes('window.location') || line.includes('document.URL') || line.includes('document.location')) {
                        analysis += chalk.yellow('- Direct URL manipulation detected\n');
                    }
                    if (line.includes('decodeURIComponent')) {
                        analysis += chalk.yellow('- URL decoding detected (potential for parameter manipulation)\n');
                    }
                    if (line.includes('URLSearchParams')) {
                        analysis += chalk.yellow('- URL parameter manipulation detected\n');
                    }
                    if (line.match(/\.(php|asp|aspx|jsp|do|action)\?/i)) {
                        analysis += chalk.yellow('- Dynamic file extension with parameters detected\n');
                    }
                    if (line.includes('?') || line.includes('&')) {
                        analysis += chalk.yellow('- URL parameters detected (ensure proper validation)\n');
                    }
                });
            }

            resolve({ 
                name: "URL Parameter Security Check", 
                success,
                command: cmd,
                output: success ? 
                    chalk.green(`Command: ${cmd}\nResult: No URL parameter security issues found\nResponse: No matches found${explanation}`) : 
                    chalk.yellow(`Command: ${cmd}\nResult: Warning: Found potential URL parameter security issues\nResponse: ${output.trim()}${analysis}${explanation}`)
            });
        });
    });
}; 