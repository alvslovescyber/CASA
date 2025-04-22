// 14.3.2 Debug mode off in production

const { exec } = require("child_process");

module.exports = function DebugMode() {
  return new Promise((resolve) => {
    const cmd = "curl -s https://dev.example.com | grep -i 'debug\\|console\\.log\\|debugger'";
    exec(cmd, (err, stdout, stderr) => {
      const output = stdout || stderr;
      const success = output.length === 0;
      resolve({ 
        name: "Debug Mode Check", 
        success, 
        output: success ? 
          `Command: ${cmd}\nResult: No debug mode references found\nResponse: No matches found` : 
          `Command: ${cmd}\nResult: Debug mode references found in the response\nResponse: ${output.trim()}`
      });
    });
  });
};
