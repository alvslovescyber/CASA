const { contextBridge, ipcRenderer, clipboard } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
    runCommand: async (command) => {
        return await ipcRenderer.invoke('run-command', command);
    },
    runTests: async (targetUrl) => {
        return await ipcRenderer.invoke('run-tests', targetUrl);
    },
    saveResults: async (results) => {
        return await ipcRenderer.invoke('save-results', results);
    },
    loadHistory: async () => {
        return await ipcRenderer.invoke('load-history');
    },
    clearResults: async () => {
        return await ipcRenderer.invoke('clear-results');
    },
    loadScriptAnalysis: async () => {
        return await ipcRenderer.invoke('load-script-analysis');
    },
    maximize: () => {
        ipcRenderer.send('maximize');
    },
    clipboard: {
        writeText: (text) => clipboard.writeText(text),
        readText: () => clipboard.readText()
    }
});