const https = require('https');
const url = require('url');

module.exports = function checkDirectoryBrowsing(targetUrl) {
    return new Promise((resolve) => {
        const parsedUrl = new URL(targetUrl);
        const commonDirs = [
            '/images/',
            '/uploads/',
            '/assets/',
            '/backup/',
            '/files/',
            '/temp/',
            '/logs/',
            '/admin/',
            '/config/',
            '/includes/'
        ];

        let completedChecks = 0;
        let vulnerabilities = [];

        const checkDirectory = (dir) => {
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: dir,
                method: 'GET',
                rejectUnauthorized: false,
                headers: {
                    'User-Agent': 'SecurityScanner/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    // Check if directory listing is enabled
                    const isDirectoryListing = 
                        res.statusCode === 200 && 
                        (data.includes('Index of') || 
                         data.includes('Directory listing') ||
                         data.match(/<pre>.*Parent Directory.*<\/pre>/i));

                    if (isDirectoryListing) {
                        vulnerabilities.push(`Directory browsing enabled for ${dir}`);
                    }

                    completedChecks++;
                    if (completedChecks === commonDirs.length) {
                        finishCheck();
                    }
                });
            });

            req.on('error', () => {
                completedChecks++;
                if (completedChecks === commonDirs.length) {
                    finishCheck();
                }
            });

            req.end();
        };

        const finishCheck = () => {
            const success = vulnerabilities.length === 0;
            let output = `Directory Browsing Check Results for ${targetUrl}:\n\n`;

            if (success) {
                output += 'No directory browsing vulnerabilities detected.\n\n';
            } else {
                output += 'Directory browsing vulnerabilities found:\n\n';
                vulnerabilities.forEach(v => {
                    output += `- ${v}\n`;
                });
                output += '\n';
            }

            output += 'Recommendations:\n';
            output += '1. Disable directory browsing in web server configuration\n';
            output += '2. Add appropriate index files to all directories\n';
            output += '3. Use .htaccess or web.config to restrict directory access\n';
            output += '4. Implement proper access controls\n';
            output += '5. Move sensitive directories outside web root\n';
            output += '6. Configure proper file permissions\n';

            resolve({
                name: "Directory Browsing Check",
                success: success,
                command: `Checking directory browsing on ${targetUrl}`,
                output: output
            });
        };

        // Start checking all directories
        commonDirs.forEach(dir => {
            checkDirectory(dir);
        });
    });
}; 