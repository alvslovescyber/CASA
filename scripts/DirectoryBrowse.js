// 4.3.2 Directory browsing check

const { exec } = require("child_process");

module.exports = function DirectoryBrowse() {
  return new Promise((resolve) => {
    // Test common directories that shouldn't be accessible
    const testDirs = ['/admin/', '/backup/', '/config/', '/logs/', '/test/'];
    let completed = 0;
    let accessible = [];
    let responses = [];

    testDirs.forEach(dir => {
      const cmd = `curl -s -I https://dev.example.com${dir}`;
      exec(cmd, (err, stdout, stderr) => {
        completed++;
        const output = stdout || stderr;
        const statusCode = output.split('\n')[0].trim();
        responses.push(`Directory: ${dir}\nCommand: ${cmd}\nResponse: ${output.trim()}\n`);
        
        if (statusCode.includes('200') || statusCode.includes('301') || statusCode.includes('302')) {
          accessible.push(dir);
        }

        if (completed === testDirs.length) {
          const success = accessible.length === 0;
          resolve({ 
            name: "Directory Browsing Check", 
            success,
            output: success ? 
              `Result: No directory browsing vulnerabilities found\n\n${responses.join('\n')}` : 
              `Result: Warning: The following directories are accessible: ${accessible.join(', ')}\n\n${responses.join('\n')}`
          });
        }
      });
    });
  });
};
