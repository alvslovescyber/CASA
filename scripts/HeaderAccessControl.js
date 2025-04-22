// 14.5.2 Don't use Origin header for access control

const { exec } = require("child_process");

module.exports = function HeaderAccessControl() {
  return new Promise((resolve) => {
    const cmd = 'curl -s -I -H "Origin: evil.com" https://dev.example.com';
    exec(cmd, (err, stdout, stderr) => {
      const output = stdout || stderr;
      const success = !/Access-Control-Allow-Origin: \*/i.test(output);
      resolve({ 
        name: "Header Access-Control Check", 
        success, 
        output: success ? 
          `Command: ${cmd}\nResult: CORS headers are properly configured\nResponse: ${output.trim()}` : 
          `Command: ${cmd}\nResult: Warning: CORS headers are too permissive\nResponse: ${output.trim()}`
      });
    });
  });
};
