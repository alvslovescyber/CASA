const { exec } = require("child_process");

module.exports = function URLData() {
  return new Promise((resolve) => {
    const cmd = 'curl -s -I "https://dev.example.com?secret=abc"';
    exec(cmd, (err, stdout, stderr) => {
      const output = stdout || stderr;
      const success = !/secret=abc/i.test(output);
      resolve({ 
        name: "URL Data Leak Check", 
        success,
        output: success ? 
          `Command: ${cmd}\nResult: No sensitive URL parameters are being echoed back\nResponse: ${output.trim()}` : 
          `Command: ${cmd}\nResult: Warning: Sensitive URL parameters are being echoed back in the response\nResponse: ${output.trim()}`
      });
    });
  });
};
