const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');

module.exports = function ScriptAnalysis() {
    return new Promise((resolve) => {
        // Patterns to check for common security issues
        const patterns = [
            'eval\\(',                  // eval usage
            'setTimeout\\(',            // setTimeout with string
            'setInterval\\(',           // setInterval with string
            'Function\\(',              // Function constructor
            'new Function\\(',          // Function constructor
            'document\\.write\\(',      // document.write
            'innerHTML\\s*=',           // innerHTML assignment
            'outerHTML\\s*=',           // outerHTML assignment
            'insertAdjacentHTML',       // insertAdjacentHTML
            '\\$\\s*\\(',              // jQuery selector
            '\\$\\.get\\(',            // jQuery get
            '\\$\\.post\\(',           // jQuery post
            '\\$\\.ajax\\(',           // jQuery ajax
            'fetch\\(',                // fetch API
            'XMLHttpRequest',          // XHR
            'localStorage',            // localStorage
            'sessionStorage',          // sessionStorage
            'document\\.cookie',       // cookie manipulation
            'window\\.location',       // location manipulation
            'window\\.open\\(',        // window.open
            'require\\(',              // require
            'import\\s+',              // import
            'export\\s+',              // export
            'process\\.env',           // environment variables
            'console\\.log',            // console.log
            'debugger;',               // debugger statement
            '\\/\\*\\s*TODO',         // TODO comments
            '\\/\\/\\s*TODO',         // TODO comments
            '\\/\\*\\s*FIXME',        // FIXME comments
            '\\/\\/\\s*FIXME'         // FIXME comments
        ].join('|');

        // Get all JavaScript files in the current directory and subdirectories
        const findJsFiles = `find . -type f -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*"`;
        
        exec(findJsFiles, (err, files) => {
            if (err) {
                resolve({
                    name: "Script Analysis",
                    success: false,
                    command: findJsFiles,
                    output: `Error finding JavaScript files: ${err.message}`
                });
                return;
            }

            const jsFiles = files.trim().split('\n');
            let analysis = '';
            let issuesFound = false;

            jsFiles.forEach(file => {
                if (!file) return;

                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const lines = content.split('\n');
                    let fileIssues = [];

                    lines.forEach((line, index) => {
                        if (new RegExp(patterns).test(line)) {
                            const issue = line.trim();
                            fileIssues.push({
                                line: index + 1,
                                issue: issue
                            });
                        }
                    });

                    if (fileIssues.length > 0) {
                        issuesFound = true;
                        analysis += `\nIssues found in ${file}:\n`;
                        fileIssues.forEach(({line, issue}) => {
                            analysis += `  Line ${line}: ${issue}\n`;
                        });
                    }
                } catch (readErr) {
                    analysis += `\nError reading file ${file}: ${readErr.message}\n`;
                }
            });

            const explanation = '\nScript Analysis Guidelines:\n' +
                '1. Avoid using eval() and Function constructor\n' +
                '2. Use proper DOM manipulation methods instead of innerHTML\n' +
                '3. Sanitize all user inputs before processing\n' +
                '4. Use secure alternatives for data storage\n' +
                '5. Implement proper error handling\n' +
                '6. Remove debug statements before production\n' +
                '7. Use secure communication methods\n' +
                '8. Follow security best practices for file operations\n';

            resolve({
                name: "Script Analysis",
                success: !issuesFound,
                command: "Script analysis completed",
                output: issuesFound ? 
                    `Script Analysis Results:\n${analysis}${explanation}` :
                    `Script Analysis Results:\nNo security issues found in JavaScript files.${explanation}`
            });
        });
    });
}; 