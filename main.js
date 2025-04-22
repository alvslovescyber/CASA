const { app, BrowserWindow, ipcMain, Menu, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Set the app name
app.name = 'CASA Security Tester';

let mainWindow;
let lastResults = null;

// Create menu template
const createMenu = () => {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about', label: `About ${app.name}` },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: `About ${app.name}`,
                    click: async () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            title: `About ${app.name}`,
                            message: `${app.name}`,
                            detail: 'A comprehensive security assessment tool for web applications.\nVersion ' + app.getVersion(),
                            buttons: ['OK'],
                            icon: path.join(__dirname, 'build/icons/png/1024x1024.png')
                        });
                    }
                }
            ]
        }
    ];
    return Menu.buildFromTemplate(template);
};

function createWindow() {
    const iconPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'build/icons/mac/icon.icns')
        : path.join(__dirname, 'build/icons/png/1024x1024.png');

    if (process.platform === 'darwin' && !app.isPackaged) {
        app.dock.setIcon(path.join(__dirname, 'build/icons/png/1024x1024.png'));
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true,
        title: app.name,
        titleBarStyle: 'default',
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff'
    });

    mainWindow.loadFile('index.html');
    
    // Add keyboard shortcut to toggle DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        }
    });

    // Listen for dark mode changes
    nativeTheme.on('updated', () => {
        mainWindow.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff');
    });
}

app.whenReady().then(() => {
    createWindow();
    Menu.setApplicationMenu(createMenu());
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Mock test results for development
const mockTestResult = (scriptPath) => {
    const scriptName = path.basename(scriptPath, '.js');
    return {
        success: Math.random() > 0.3, // 70% chance of success
        output: `Test completed for ${scriptName}`
    };
};

// IPC Handlers
ipcMain.handle('run-command', async (event, command) => {
    return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && error.code !== 0) {
                console.error('Command execution error:', error);
                resolve({
                    success: false,
                    stdout: stdout || '',
                    stderr: stderr || error.message,
                    exitCode: error.code
                });
            } else {
                resolve({
                    success: true,
                    stdout: stdout || '',
                    stderr: stderr || '',
                    exitCode: 0
                });
            }
        });
    });
});

ipcMain.handle('run-tests', async (event, targetUrl) => {
    try {
        if (!targetUrl) {
            throw new Error('Please provide a target URL');
        }

        // Validate URL format
        try {
            new URL(targetUrl);
        } catch (e) {
            throw new Error('Invalid URL format. Please enter a valid URL (e.g., https://example.com)');
        }

        // Import all security check scripts
        const scripts = {
            'SSL/TLS': './scripts/ssl-check.js',
            'Security Headers': './scripts/secure-headers.js',
            'Storage Data': './scripts/storage-data.js',
            'API Security': './scripts/api-security.js',
            'Code Integrity': './scripts/code-integrity.js',
            'Cookie Security': './scripts/cookie-security.js',
            'CSRF Protection': './scripts/csrf-check.js',
            'XSS Vulnerability': './scripts/xss-check.js',
            'SQL Injection': './scripts/sql-injection.js',
            'Debug Mode': './scripts/debug-mode.js',
            'Deprecated Client': './scripts/deprecated-client.js',
            'Directory Browsing': './scripts/directory-browse.js',
            'URL Parameter': './scripts/url-data.js'
        };

        const results = [];
        const errors = [];

        for (const [name, path] of Object.entries(scripts)) {
            try {
                const script = require(path);
                const result = await script(targetUrl);
                results.push(result);
            } catch (error) {
                errors.push({
                    name,
                    error: error.message || 'Script execution failed'
                });
            }
        }

        if (errors.length > 0) {
            console.error('Script execution errors:', errors);
            // Add error results to the output
            errors.forEach(error => {
                results.push({
                    name: error.name,
                    success: false,
                    command: `Running ${error.name} check`,
                    output: `Error: ${error.error}`
                });
            });
        }

        return results;
    } catch (error) {
        console.error('Error running security tests:', error);
        return [{
            name: "Security Scan",
            success: false,
            command: "Running security checks",
            output: `Error: ${error.message || 'Failed to run security checks'}`
        }];
    }
});

ipcMain.handle('save-results', async (event, results) => {
    try {
        const resultsDir = path.join(app.getPath('userData'), 'scan-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(resultsDir, `scan-${timestamp}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
        return { success: true, message: 'Results saved successfully' };
    } catch (error) {
        console.error('Error saving results:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('load-history', async (event) => {
    try {
        const resultsDir = path.join(app.getPath('userData'), 'scan-results');
        if (!fs.existsSync(resultsDir)) {
            return { success: true, history: [] };
        }

        const files = fs.readdirSync(resultsDir)
            .filter(file => file.endsWith('.json'))
            .sort()
            .reverse();

        const history = files.map(file => {
            const filePath = path.join(resultsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                timestamp: file.replace('scan-', '').replace('.json', ''),
                results: JSON.parse(content)
            };
        });

        return { success: true, history };
    } catch (error) {
        console.error('Error loading history:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('clear-results', async (event) => {
    try {
        const resultsDir = path.join(app.getPath('userData'), 'scan-results');
        if (fs.existsSync(resultsDir)) {
            fs.readdirSync(resultsDir).forEach(file => {
                fs.unlinkSync(path.join(resultsDir, file));
            });
        }
        return { success: true, message: 'Results cleared successfully' };
    } catch (error) {
        console.error('Error clearing results:', error);
        return { success: false, message: error.message };
    }
});

// Window control handlers
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.restore();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});

// Add IPC handlers after other ipcMain handlers
ipcMain.handle('load-script-analysis', async () => {
    try {
        const scriptsDir = path.join(__dirname, 'scripts');
        const files = fs.readdirSync(scriptsDir);
        
        const analysisResults = [];
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(scriptsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Basic analysis
                const lines = content.split('\n');
                const totalLines = lines.length;
                const emptyLines = lines.filter(line => line.trim() === '').length;
                const commentLines = lines.filter(line => line.trim().startsWith('//')).length;
                const codeLines = totalLines - emptyLines - commentLines;
                
                // Check for common security patterns
                const hasErrorHandling = content.includes('try') && content.includes('catch');
                const hasInputValidation = content.includes('validate') || content.includes('check');
                const hasSecurityChecks = content.includes('security') || content.includes('secure');
                
                analysisResults.push({
                    name: file,
                    path: filePath,
                    stats: {
                        totalLines,
                        emptyLines,
                        commentLines,
                        codeLines
                    },
                    security: {
                        hasErrorHandling,
                        hasInputValidation,
                        hasSecurityChecks
                    }
                });
            }
        }
        
        return {
            success: true,
            results: analysisResults
        };
    } catch (error) {
        console.error('Error loading script analysis:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

function getScriptDescription(filename) {
    const descriptions = {
        'sql_injection.js': 'SQL Injection Vulnerability Scanner',
        'xss_scanner.js': 'Cross-Site Scripting (XSS) Scanner',
        'csrf_check.js': 'CSRF Protection Checker',
        'header_security.js': 'Security Headers Analyzer',
        'ssl_tls_check.js': 'SSL/TLS Configuration Scanner',
        // Add more descriptions as needed
    };
    return descriptions[filename] || `Security Check: ${filename}`;
}