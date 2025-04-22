Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
    at initializeEventListeners (renderer.js:594:51)
    at HTMLDocument.<anonymous>const { exec } = require("child_process");

module.exports = function StorageData() {
    return new Promise((resolve) => {
        // Enhanced grep patterns to catch storage and cookie-related patterns
        const patterns = [
            'localStorage\\.',           // Basic localStorage access
            'sessionStorage\\.',         // Basic sessionStorage access
            'setItem\\(',               // Setting items in storage
            'getItem\\(',               // Getting items from storage
            'removeItem\\(',            // Removing items from storage
            '\\.clear\\(\\)',           // Clearing storage
            'storage.set',              // Alternative storage patterns
            'storage.get',              // Alternative storage patterns
            'document\\.cookie',        // Cookie access
            'Set-Cookie:',             // Cookie headers
            'secure;',                 // Secure flag
            'HttpOnly;',               // HttpOnly flag
            'SameSite='                // SameSite attribute
        ].join('|');

        const cmd = `curl -sL https://dev.example.com | grep -iE '${patterns}'`;
        
        exec(cmd, (err, stdout, stderr) => {
            const output = stdout || stderr;
            const success = output.length === 0;

            // Prepare detailed explanation
            let explanation = '\nStorage and Cookie Security Guidelines:\n';
            explanation += '1. Avoid storing sensitive data in client-side storage\n';
            explanation += '2. Use server-side session management for sensitive data\n';
            explanation += '3. If storage is necessary, encrypt sensitive data before storing\n';
            explanation += '4. Clear storage when user logs out\n';
            explanation += '5. Set appropriate security headers\n';
            explanation += '6. Always use Secure flag for cookies\n';
            explanation += '7. Use HttpOnly flag for sensitive cookies\n';
            explanation += '8. Implement SameSite attribute for cookies\n';
            
            // Analyze findings if any
            let analysis = '';
            if (!success) {
                analysis = '\nPotential Issues Found:\n';
                const lines = output.trim().split('\n');
                lines.forEach(line => {
                    if (line.includes('localStorage')) {
                        analysis += '- localStorage usage detected (persistent storage)\n';
                    }
                    if (line.includes('sessionStorage')) {
                        analysis += '- sessionStorage usage detected (session-only storage)\n';
                    }
                    if (line.includes('setItem')) {
                        analysis += '- Data being stored in client-side storage\n';
                    }
                    if (line.includes('getItem')) {
                        analysis += '- Data being retrieved from client-side storage\n';
                    }
                    if (line.includes('document.cookie')) {
                        analysis += '- Direct cookie manipulation detected\n';
                    }
                    if (line.includes('Set-Cookie:')) {
                        if (!line.includes('secure;')) {
                            analysis += '- Cookie missing Secure flag\n';
                        }
                        if (!line.includes('HttpOnly;')) {
                            analysis += '- Cookie missing HttpOnly flag\n';
                        }
                        if (!line.includes('SameSite=')) {
                            analysis += '- Cookie missing SameSite attribute\n';
                        }
                    }
                });
            }

            resolve({ 
                name: "Storage and Cookie Security Check", 
                success,
                command: cmd,
                output: success ? 
                    `Command: ${cmd}\nResult: No client-side storage or cookie security issues found\nResponse: No matches found${explanation}` : 
                    `Command: ${cmd}\nResult: Warning: Found potential security issues\nResponse: ${output.trim()}${analysis}${explanation}`
            });
        });
    });
}; 