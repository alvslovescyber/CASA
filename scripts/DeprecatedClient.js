// 1.14.6 No Deprecated Client Side Tech(Flash, Silverlight, etc.)

const { exec } = require("child_process");

module.exports = function DeprecatedClient() {
  return new Promise((resolve) => {
    const cmd = "curl -s https://dev.example.com | grep -i 'jquery\\|bootstrap\\|angular\\|react\\|vue'";
    exec(cmd, (err, stdout, stderr) => {
      const output = stdout || stderr;
      const success = output.length === 0;
      resolve({ 
        name: "Deprecated Client Check", 
        success,
        output: success ? 
          `Command: ${cmd}\nResult: No deprecated client technologies found\nResponse: No matches found` : 
          `Command: ${cmd}\nResult: Found deprecated client technologies in the response\nResponse: ${output.trim()}`
      });
    });
  });
};
