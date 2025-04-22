// 10.3.2 Use Code Integrity Checks, (SRI, code signing.)

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function check() {
    try {
        const cmd = "curl -sL https://dev.example.com | grep -i 'integrity=' || echo 'No integrity attributes found'";
        const { stdout } = await execAsync(cmd);
        const success = stdout.includes('No integrity attributes found');

        return {
            success,
            command: cmd,
            output: stdout.trim()
        };
    } catch (error) {
        return {
            success: false,
            command: "curl -sL https://dev.example.com | grep -i 'integrity=' || echo 'No integrity attributes found'",
            output: error.message
        };
    }
}

module.exports = check;
