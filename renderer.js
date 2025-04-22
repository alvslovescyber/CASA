// DOM Elements and state management
let elements = {};
let views = {};
let isProcessing = false;

// Clear results function
function clearResults() {
    if (elements.consoleOutput) elements.consoleOutput.innerHTML = '';
    if (elements.analysisResults) elements.analysisResults.innerHTML = '';
    if (elements.statusText) elements.statusText.textContent = 'Ready to run security checks...';
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        // First try the modern Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        
        // Fallback for older browsers and Electron
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            document.body.removeChild(textArea);
            console.error('Failed to copy text: ', err);
            return false;
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    elements = {
        navButtons: document.querySelectorAll('.nav-button'),
        themeToggle: document.querySelector('.theme-toggle input'),
        startScanBtn: document.getElementById('startScan'),
        clearUrlBtn: document.getElementById('clearUrl'),
        clearConsoleBtn: document.getElementById('clearConsole'),
        saveResultsBtn: document.getElementById('saveResults'),
        copyOutputBtn: document.getElementById('copyOutput'),
        refreshHistoryBtn: document.getElementById('refreshHistory'),
        runAnalysisBtn: document.getElementById('runAnalysis'),
        statusText: document.getElementById('status'),
        output: document.getElementById('output'),
        resultsSection: document.querySelector('.results-section'),
        analysisResults: document.getElementById('analysis-results'),
        targetUrl: document.getElementById('targetUrl'),
        urlValidation: document.getElementById('urlValidation'),
        spinner: document.querySelector('.spinner'),
        historyContainer: document.getElementById('history-container'),
        consoleOutput: document.getElementById('console-output')
    };

    // Initialize views
    views = {
        dashboard: document.getElementById('dashboard-view'),
        history: document.getElementById('history-view'),
        'script-analysis': document.getElementById('script-analysis-view')
    };

    // Check if API is properly exposed
    if (!window.api) {
        console.error('API not properly exposed. Please check preload.js configuration.');
        if (elements.statusText) {
            elements.statusText.textContent = 'Application error: API not available';
        }
        return;
    }

    // Verify all required elements are present
    const requiredElements = [
        'startScanBtn',
        'clearUrlBtn',
        'clearConsoleBtn',
        'saveResultsBtn',
        'copyOutputBtn',
        'refreshHistoryBtn',
        'runAnalysisBtn',
        'statusText',
        'output',
        'resultsSection',
        'analysisResults',
        'targetUrl',
        'urlValidation',
        'spinner',
        'historyContainer'
    ];

    const missingElements = requiredElements
        .filter(key => !elements[key])
        .map(key => key);

    const missingViews = Object.entries(views)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        if (elements.statusText) {
            elements.statusText.textContent = `Missing required elements: ${missingElements.join(', ')}`;
        }
    }

    if (missingViews.length > 0) {
        console.error('Missing required views:', missingViews);
        if (elements.statusText) {
            elements.statusText.textContent = `Missing required views: ${missingViews.join(', ')}`;
        }
    }

    // Add all custom styles
    const style = document.createElement('style');
    style.textContent = `
        .analysis-summary {
            margin-bottom: 16px;
            padding: 16px;
        }
        
        .summary-stats {
            display: flex;
            gap: 24px;
            margin-top: 12px;
        }
        
        .stat {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stat .label {
            color: var(--text-secondary);
        }
        
        .stat .value {
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
        }
        
        .stat .value.success {
            background: rgba(34, 197, 94, 0.1);
            color: rgb(34, 197, 94);
        }
        
        .stat .value.warning {
            background: rgba(234, 179, 8, 0.1);
            color: rgb(234, 179, 8);
        }

        .script-info {
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 8px;
            margin: 8px 0;
        }
        
        .script-header {
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 8px;
        }
        
        .script-path {
            font-family: monospace;
            font-size: 0.9em;
            color: var(--text-secondary);
        }
        
        .script-description {
            font-size: 0.9em;
            color: var(--text-secondary);
            margin-top: 4px;
        }

        .error {
            color: #ef4444;
            padding: 12px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 8px;
            margin: 8px 0;
        }

        @keyframes scaleIn {
            from { transform: scale(1); }
            to { transform: scale(1.02); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .spin {
            animation: spin 1s linear infinite;
        }
        
        .card {
            transition: transform 0.2s ease-in-out;
        }
        
        .card:hover {
            transform: scale(1.02);
        }

        .button {
            position: relative;
            overflow: hidden;
            transform: translateZ(0);
            transition: background-color 0.2s ease-in-out;
        }

        .button:active {
            transform: translateY(1px);
        }

        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }

        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }

        .button:hover {
            background-color: var(--primary-darker);
        }

        .button.secondary:hover {
            background-color: var(--secondary-darker);
        }

        .nav-button {
            transition: all 0.2s ease-in-out;
            color: var(--text-primary);
        }

        .nav-button:hover {
            background-color: var(--primary);
            color: white;
        }

        .nav-button.active {
            color: var(--primary);
            font-weight: 600;
        }

        .nav-button.active:hover {
            background-color: var(--primary);
            color: white;
        }

        .test-result {
            margin-bottom: 16px;
            padding: 16px;
            border-radius: 8px;
            background: var(--card-bg);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .test-result.success {
            border-left: 4px solid #22c55e;
        }

        .test-result.error {
            border-left: 4px solid #ef4444;
        }

        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .test-header h4 {
            margin: 0;
            color: var(--text-primary);
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
        }

        .status-badge.success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
        }

        .status-badge.error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
        }

        .test-details {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .test-command {
            font-family: monospace;
            margin-bottom: 8px;
            color: var(--text-secondary);
        }

        .test-output {
            white-space: pre-wrap;
            margin-bottom: 8px;
        }

        .test-details-content {
            background: rgba(0, 0, 0, 0.05);
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }

        .output-content pre {
            margin: 0;
            padding: 16px;
            white-space: pre-wrap;
            font-family: monospace;
            color: var(--text-primary);
        }

        .vulnerability-info {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .vulnerability-info h4 {
            color: var(--text-primary);
            margin: 12px 0 8px 0;
            font-size: 0.95rem;
        }

        .vulnerability-info p {
            color: var(--text-secondary);
            margin: 8px 0;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .vulnerability-info ul {
            margin: 8px 0;
            padding-left: 20px;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .vulnerability-info li {
            margin: 4px 0;
        }

        .script-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .script-item {
            padding: 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f9f9f9;
        }
        .script-item h3 {
            margin: 0 0 0.5rem 0;
            color: #333;
        }
        .script-item p {
            margin: 0.5rem 0;
            color: #666;
        }
        .script-path {
            font-family: monospace;
            font-size: 0.9em;
            color: #888;
        }
        .error {
            color: #dc3545;
            padding: 1rem;
            border: 1px solid #dc3545;
            border-radius: 4px;
            background: #fff;
        }

        .analysis-results {
            background: var(--card-bg);
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
        }

        .analysis-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
        }

        .analysis-header h3 {
            margin: 0;
            color: var(--text-primary);
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: 500;
        }

        .status-badge.success {
            background-color: #28a745;
            color: white;
        }

        .status-badge.error {
            background-color: #dc3545;
            color: white;
        }

        .analysis-command {
            margin: 16px 0;
            padding: 12px;
            background: var(--code-bg);
            border-radius: 4px;
        }

        .analysis-command h4 {
            margin: 0 0 8px 0;
            color: var(--text-primary);
        }

        .analysis-command code {
            font-family: monospace;
            color: var(--text-secondary);
        }

        .analysis-output {
            margin: 16px 0;
        }

        .analysis-output h4 {
            margin: 0 0 8px 0;
            color: var(--text-primary);
        }

        .analysis-output pre {
            background: var(--code-bg);
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: monospace;
            color: var(--text-secondary);
            white-space: pre-wrap;
        }

        .error-message {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.2);
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
        }

        .error-message h3 {
            color: #dc3545;
            margin: 0 0 8px 0;
        }

        .error-message p {
            margin: 8px 0;
            color: var(--text-secondary);
        }
    `;
    document.head.appendChild(style);

    // Initialize event listeners
    initializeEventListeners();
    
    // Add smooth hover effects
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
    });

    // Add custom scrollbar behavior
    const scrollContainers = document.querySelectorAll('.output-container, .sidebar');
    scrollContainers.forEach(container => {
        let isScrolling;
        container.addEventListener('scroll', () => {
            container.classList.add('is-scrolling');
            clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                container.classList.remove('is-scrolling');
            }, 150);
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            
            button.appendChild(ripple);
            
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (elements.themeToggle) {
        elements.themeToggle.checked = savedTheme === 'dark';
        setTheme(savedTheme === 'dark');
    }
});

// URL validation
function validateUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

// Event listener initialization
function initializeEventListeners() {
    try {
        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('change', (e) => {
                setTheme(e.target.checked);
            });
        }

        // Navigation
        if (elements.navButtons && elements.navButtons.length > 0) {
            elements.navButtons.forEach(button => {
                if (button) {
                    button.addEventListener('click', () => {
                        if (isProcessing) return;
                        const viewId = button.dataset.view;
                        if (!viewId) return;

                        elements.navButtons.forEach(btn => {
                            if (btn) btn.classList.remove('active');
                        });
                        button.classList.add('active');
                        switchView(viewId);
                        
                        if (viewId === 'history') {
                            loadHistory();
                        } else if (viewId === 'script-analysis') {
                            loadScriptAnalysis();
                        }
                    });
                }
            });
        }

        // URL input validation
        if (elements.targetUrl) {
            elements.targetUrl.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                if (elements.startScanBtn) elements.startScanBtn.disabled = !url;
                
                if (!url) {
                    if (elements.urlValidation) {
                        elements.urlValidation.textContent = '';
                    }
                    elements.targetUrl.classList.remove('error');
                    return;
                }

                if (!validateUrl(url)) {
                    if (elements.urlValidation) {
                        elements.urlValidation.textContent = 'Please enter a valid HTTP or HTTPS URL';
                    }
                    elements.targetUrl.classList.add('error');
                    if (elements.startScanBtn) elements.startScanBtn.disabled = true;
                } else {
                    if (elements.urlValidation) {
                        elements.urlValidation.textContent = '';
                    }
                    elements.targetUrl.classList.remove('error');
                    if (elements.startScanBtn) elements.startScanBtn.disabled = false;
                }
            });
        }

        // Button click handlers
        if (elements.runTestsBtn) {
            elements.runTestsBtn.addEventListener('click', executeTests);
        }

        if (elements.clearConsoleBtn) {
            elements.clearConsoleBtn.addEventListener('click', async () => {
                if (isProcessing) return;
                try {
                    await window.api.clearResults();
                    if (elements.consoleOutput) elements.consoleOutput.innerHTML = '';
                    if (elements.analysisResults) elements.analysisResults.innerHTML = '';
                    if (elements.statusText) elements.statusText.textContent = 'Console cleared';
                } catch (error) {
                    console.error('Clear failed:', error);
                    if (elements.statusText) elements.statusText.textContent = 'Clear failed: ' + error.message;
                }
            });
        }

        if (elements.runAnalysisBtn) {
            elements.runAnalysisBtn.addEventListener('click', async () => {
                if (isProcessing) return;
                isProcessing = true;
                if (elements.statusText) elements.statusText.textContent = 'Running script analysis...';
                if (elements.analysisResults) elements.analysisResults.innerHTML = '';
                
                try {
                    await loadScriptAnalysis();
                } catch (error) {
                    console.error('Script analysis failed:', error);
                    if (elements.statusText) elements.statusText.textContent = 'Script analysis failed: ' + error.message;
                } finally {
                    isProcessing = false;
                }
            });
        }

        if (elements.saveResultsBtn) {
            elements.saveResultsBtn.addEventListener('click', async () => {
                if (isProcessing) return;
                const results = elements.consoleOutput ? elements.consoleOutput.innerHTML : '';
                try {
                    await window.api.saveResults(results);
                    if (elements.statusText) elements.statusText.textContent = 'Results saved successfully';
                } catch (error) {
                    console.error('Save failed:', error);
                    if (elements.statusText) elements.statusText.textContent = 'Save failed: ' + error.message;
                }
            });
        }

        if (elements.copyOutputBtn) {
            elements.copyOutputBtn.addEventListener('click', async () => {
                try {
                    const textToCopy = elements.resultsSection ? elements.resultsSection.innerText : 'No results to copy';
                    await copyToClipboard(textToCopy);
                    updateUI.setStatus('Results copied to clipboard', 'success');
                } catch (error) {
                    console.error('Copy failed:', error);
                    updateUI.setStatus('Failed to copy results: ' + error.message, 'error');
                }
            });
        }

        if (elements.refreshHistoryBtn) {
            elements.refreshHistoryBtn.addEventListener('click', async () => {
                if (isProcessing) return;
                isProcessing = true;
                if (elements.statusText) elements.statusText.textContent = 'Loading history...';
                if (elements.historyResults) elements.historyResults.innerHTML = '';
                
                try {
                    const history = await window.api.loadHistory();
                    displayHistory(history);
                } catch (error) {
                    console.error('History loading failed:', error);
                    if (elements.statusText) elements.statusText.textContent = 'History loading failed: ' + error.message;
                } finally {
                    isProcessing = false;
                }
            });
        }

        // Start scan button
        if (elements.startScanBtn) {
            elements.startScanBtn.addEventListener('click', async () => {
                const url = elements.targetUrl ? elements.targetUrl.value.trim() : '';
                
                if (!validateUrl(url)) {
                    if (elements.urlValidation) {
                        elements.urlValidation.textContent = 'Please enter a valid HTTP or HTTPS URL';
                    }
                    if (elements.targetUrl) {
                        elements.targetUrl.classList.add('error');
                    }
                    return;
                }
                
                await startScan(url);
            });
        }

        // Script analysis button
        const scriptAnalysisBtn = document.getElementById('script-analysis-btn');
        if (scriptAnalysisBtn) {
            scriptAnalysisBtn.addEventListener('click', async () => {
                try {
                    const result = await window.api.runScriptAnalysis();
                    displayResults(result);
                } catch (error) {
                    console.error('Script analysis error:', error);
                    displayError('Failed to run script analysis: ' + error.message);
                }
            });
        }
    } catch (error) {
        console.error('Error initializing event listeners:', error);
    }
}

// Security scripts configuration
const securityScripts = [
    { name: 'API Security Check', path: './scripts/api-security.js' },
    { name: 'Code Integrity Check', path: './scripts/code-integrity.js' },
    { name: 'Cookie Security Check', path: './scripts/cookie-security.js' },
    { name: 'CSRF Check', path: './scripts/csrf-check.js' },
    { name: 'XSS Check', path: './scripts/xss-check.js' },
    { name: 'SQL Injection Check', path: './scripts/sql-injection.js' },
    { name: 'Debug Mode Check', path: './scripts/debug-mode.js' },
    { name: 'Deprecated Client Check', path: './scripts/deprecated-client.js' },
    { name: 'Directory Browsing Check', path: './scripts/directory-browse.js' },
    { name: 'Security Headers Check', path: './scripts/header-access.js' },
    { name: 'Client Storage Security Check', path: './scripts/storage-data.js' },
    { name: 'URL Parameter Security Check', path: './scripts/url-data.js' }
];

// UI Update Functions
const updateUI = {
    createResultElement: (script, result) => {
        const element = document.createElement('div');
        element.className = 'test-result card';
        
        const status = result.success ? 'success' : 'warning';
        const statusText = result.success ? 'Success' : 'Warning';
        
        // Warning explanations for different security checks
        const warningDetails = {
            'APIChecks.js': {
                explanation: 'API endpoints may have security vulnerabilities that could expose sensitive data or allow unauthorized access.',
                recommendations: [
                    'Implement proper authentication for all API endpoints',
                    'Use HTTPS for all API communications',
                    'Add rate limiting to prevent abuse',
                    'Validate and sanitize all input data'
                ]
            },
            'CodeIntegrity.js': {
                explanation: 'Potential security vulnerabilities detected in the code that could be exploited.',
                recommendations: [
                    'Update dependencies to their latest secure versions',
                    'Remove any hardcoded credentials',
                    'Implement proper input validation',
                    'Add security headers'
                ]
            },
            'CookieSecureFlag.js': {
                explanation: 'Cookies are not properly secured, which could lead to data exposure or session hijacking.',
                recommendations: [
                    'Set the Secure flag for all sensitive cookies',
                    'Use HttpOnly flag for session cookies',
                    'Implement proper cookie expiration',
                    'Use SameSite attribute'
                ]
            },
            'CookiesHttpOnly.js': {
                explanation: 'Cookies are accessible via client-side JavaScript, potentially exposing sensitive data.',
                recommendations: [
                    'Set HttpOnly flag for all session cookies',
                    'Minimize data stored in cookies',
                    'Use secure session management',
                    'Implement proper cookie attributes'
                ]
            },
            'DebugMode.js': {
                explanation: 'Debug mode or development features are enabled in production, which could expose sensitive information.',
                recommendations: [
                    'Disable all debug features in production',
                    'Remove development endpoints',
                    'Configure proper error handling',
                    'Use production-appropriate logging levels'
                ]
            },
            'DeprecatedClient.js': {
                explanation: 'Usage of deprecated or insecure client libraries detected.',
                recommendations: [
                    'Update to the latest stable versions',
                    'Replace deprecated functions with secure alternatives',
                    'Review security advisories for used packages',
                    'Implement security patches'
                ]
            },
            'DirectoryBrowse.js': {
                explanation: 'Directory listing is enabled, which could expose sensitive files and information.',
                recommendations: [
                    'Disable directory browsing',
                    'Implement proper access controls',
                    'Use web.config or .htaccess rules',
                    'Configure proper file permissions'
                ]
            },
            'HeaderAccessControl.js': {
                explanation: 'Security headers are missing or improperly configured.',
                recommendations: [
                    'Implement Content-Security-Policy',
                    'Add X-Frame-Options header',
                    'Configure X-Content-Type-Options',
                    'Set Strict-Transport-Security header'
                ]
            },
            'StorageData.js': {
                explanation: 'Sensitive data may be exposed in client-side storage.',
                recommendations: [
                    'Avoid storing sensitive data in localStorage/sessionStorage',
                    'Implement proper data encryption',
                    'Use secure storage alternatives',
                    'Regular security audits of stored data'
                ]
            },
            'URLData.js': {
                explanation: 'Sensitive information might be exposed in URLs or query parameters.',
                recommendations: [
                    'Avoid passing sensitive data in URLs',
                    'Implement proper URL parameter validation',
                    'Use POST requests for sensitive operations',
                    'Encrypt sensitive URL parameters'
                ]
            }
        };

        const scriptName = script.path.split('/').pop();
        const warningInfo = !result.success && warningDetails[scriptName];
        
        element.innerHTML = `
            <div class="test-header">
                <h4>${script.name}</h4>
                <span class="status-badge ${status}">${statusText}</span>
            </div>
            <div class="script-info">
                <div class="script-header">Script Details</div>
                <div class="script-path">${script.path}</div>
                <div class="script-description">${script.description}</div>
            </div>
            <div class="test-details">
                <div class="test-output">${result.output || 'Completed'}</div>
                ${warningInfo ? `
                    <div class="warning-details">
                        <div class="warning-explanation">
                            <h4>Why is this an issue?</h4>
                            <p>${warningInfo.explanation}</p>
                        </div>
                        <div class="warning-recommendations">
                            <h4>Recommendations:</h4>
                            <ul>
                                ${warningInfo.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Add styles for warning details
        const style = document.createElement('style');
        style.textContent = `
            .warning-details {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .warning-explanation {
                margin-bottom: 16px;
            }
            
            .warning-explanation h4,
            .warning-recommendations h4 {
                color: #f59e0b;
                margin-bottom: 8px;
                font-size: 0.9em;
                font-weight: 600;
            }
            
            .warning-explanation p {
                color: var(--text-secondary);
                font-size: 0.9em;
                line-height: 1.5;
            }
            
            .warning-recommendations ul {
                list-style-type: none;
                padding: 0;
                margin: 0;
            }
            
            .warning-recommendations li {
                color: var(--text-secondary);
                font-size: 0.9em;
                padding: 4px 0;
                padding-left: 20px;
                position: relative;
            }
            
            .warning-recommendations li:before {
                content: "•";
                color: #f59e0b;
                position: absolute;
                left: 0;
            }
        `;
        document.head.appendChild(style);
        
        return element;
    },
    
    clearAll: () => {
        elements.resultsSection.innerHTML = '';
        elements.output.innerHTML = '';
        elements.analysisResults.innerHTML = '';
        elements.statusText.innerHTML = 'Ready to run security checks...';
    },
    
    setStatus: (message, type = 'info') => {
        elements.statusText.innerHTML = `<div class="status-badge ${type}">${message}</div>`;
    }
};

// Safe API call wrapper with URL parameter
const safeApiCall = async (script, targetUrl) => {
    try {
        const result = await window.api.runTests(script.path, targetUrl);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error(`Error running test for ${script.name}:`, error);
        return {
            success: false,
            error: error.message || 'Test execution failed'
        };
    }
};

// Test Execution Functions
const executeTests = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const targetUrl = document.getElementById('targetUrl').value.trim();
        if (!targetUrl) {
            throw new Error('Please enter a target URL');
        }

        updateUI.setStatus('Running security checks...', 'warning');
        
        // Run all security checks with the target URL
        const results = await window.api.runTests(targetUrl);
        
        // Display results
        await displaySecurityResults(results);
        
        updateUI.setStatus('Security checks completed', 'success');
    } catch (error) {
        console.error('Test execution error:', error);
        updateUI.setStatus(error.message, 'error');
    } finally {
        isProcessing = false;
    }
};

// View Management
const switchView = (viewId) => {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(`${viewId}-view`).classList.add('active');
};

// Theme Management
const setTheme = (isDark) => {
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Test Running Animation
const startTestAnimation = () => {
    elements.statusText.innerHTML = `
        <div class="status-badge warning">
            <svg class="icon spin" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
            Running Tests...
        </div>
    `;
};

const updateTestProgress = (testName, status, details, scriptInfo) => {
    const testElement = document.createElement('div');
    testElement.className = `test-result card`;
    
    const scriptDetails = scriptInfo ? `
        <div class="script-info">
            <div class="script-header">Script Information</div>
            <div class="script-path">Path: ${scriptInfo.path}</div>
            <div class="script-description">Description: ${scriptInfo.description || 'No description available'}</div>
        </div>
    ` : '';
    
    testElement.innerHTML = `
        <div class="test-header">
            <h4>${testName}</h4>
            <span class="status-badge ${status.toLowerCase()}">${status}</span>
        </div>
        ${scriptDetails}
        <div class="test-details">
            <div class="test-output">${details}</div>
        </div>
    `;
    
    elements.resultsSection.appendChild(testElement);
};

// History Management
const loadHistory = async () => {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) {
        console.error('History container not found');
        return;
    }
    historyContainer.innerHTML = '<div class="loading">Loading history...</div>';

    // Simulated history data - replace with actual API call
    setTimeout(() => {
        const mockHistory = [
            {
                date: new Date().toLocaleString(),
                tests: [
                    {
                        name: 'Authentication Check',
                        status: 'success',
                        command: 'Verifying authentication...',
                        output: 'All methods configured correctly'
                    },
                    {
                        name: 'Security Scan',
                        status: 'warning',
                        command: 'Running security scan...',
                        output: 'Minor issues detected'
                    }
                ]
            }
        ];

        historyContainer.innerHTML = mockHistory.map((entry, index) => `
            <div class="history-entry card" style="--index: ${index}">
                <div class="history-header">
                    <span class="history-date">${entry.date}</span>
                </div>
                <div class="history-content">
                    ${entry.tests.map(test => `
                        <div class="test-result">
                            <div class="test-header">
                                <h4>${test.name}</h4>
                                <span class="status-badge ${test.status}">${test.status}</span>
                            </div>
                            <div class="test-details">
                                <div class="test-command">${test.command}</div>
                                <div class="test-output">${test.output}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }, 1000);
};

// Script Analysis Management
async function loadScriptAnalysis() {
    try {
        if (!window.api) {
            throw new Error('API not available');
        }

        if (elements.analysisResults) {
            elements.analysisResults.innerHTML = '<div class="loading">Loading script analysis...</div>';
        }

        const response = await window.api.loadScriptAnalysis();
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to load script analysis');
        }

        if (elements.analysisResults) {
            if (response.results.length === 0) {
                elements.analysisResults.innerHTML = '<div class="error">No scripts found for analysis</div>';
                return;
            }

            let html = '<div class="analysis-summary">';
            html += '<h3>Script Analysis Summary</h3>';
            html += '<div class="summary-stats">';
            
            // Calculate summary statistics
            const totalScripts = response.results.length;
            const totalLines = response.results.reduce((sum, script) => sum + script.stats.totalLines, 0);
            const totalCodeLines = response.results.reduce((sum, script) => sum + script.stats.codeLines, 0);
            
            html += `<div class="stat"><span class="label">Total Scripts:</span><span class="value">${totalScripts}</span></div>`;
            html += `<div class="stat"><span class="label">Total Lines:</span><span class="value">${totalLines}</span></div>`;
            html += `<div class="stat"><span class="label">Code Lines:</span><span class="value">${totalCodeLines}</span></div>`;
            
            html += '</div></div>';

            // Add individual script analysis
            html += '<div class="script-analysis-details">';
            response.results.forEach(script => {
                html += `
                    <div class="script-info">
                        <div class="script-header">${script.name}</div>
                        <div class="script-path">${script.path}</div>
                        <div class="script-stats">
                            <div>Total Lines: ${script.stats.totalLines}</div>
                            <div>Code Lines: ${script.stats.codeLines}</div>
                            <div>Comment Lines: ${script.stats.commentLines}</div>
                            <div>Empty Lines: ${script.stats.emptyLines}</div>
                        </div>
                        <div class="script-security">
                            <div class="${script.security.hasErrorHandling ? 'success' : 'warning'}">Error Handling: ${script.security.hasErrorHandling ? '✓' : '✗'}</div>
                            <div class="${script.security.hasInputValidation ? 'success' : 'warning'}">Input Validation: ${script.security.hasInputValidation ? '✓' : '✗'}</div>
                            <div class="${script.security.hasSecurityChecks ? 'success' : 'warning'}">Security Checks: ${script.security.hasSecurityChecks ? '✓' : '✗'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            elements.analysisResults.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading script analysis:', error);
        if (elements.analysisResults) {
            elements.analysisResults.innerHTML = `
                <div class="error">
                    <h3>Error Loading Script Analysis</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// Animation utility function
const animate = (element, animation, duration = 300) => {
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = `${animation} ${duration}ms ease-in-out`;
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
};

// Test execution with dynamic URL
async function startScan(targetUrl) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Clear previous results
        clearResults();
        updateUI.setStatus('Running security scan...', 'warning');
        elements.spinner.classList.remove('hidden');

        // Create a container for all results
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        elements.resultsSection.appendChild(resultsContainer);

        // Add scan header
        const scanHeader = document.createElement('div');
        scanHeader.className = 'scan-header';
        scanHeader.innerHTML = `
            <h3>Security Scan Results</h3>
            <div class="scan-info">
                <span>Target URL: ${targetUrl}</span>
                <span>Scan Time: ${new Date().toLocaleString()}</span>
            </div>
        `;
        resultsContainer.appendChild(scanHeader);

        // Run each security script
        for (const script of securityScripts) {
            try {
                updateUI.setStatus(`Running ${script.name}...`, 'warning');
                
                // Execute the script using the terminal command
                const scriptResult = await window.api.runCommand(`node ${script.path} "${targetUrl}"`);
                
                // Process the script output
                const result = {
                    success: scriptResult.stdout.toLowerCase().includes('pass') || 
                            scriptResult.exitCode === 0,
                    message: scriptResult.stdout || scriptResult.stderr || 'No output from test',
                    details: scriptResult.stderr || ''
                };

                // Create visual result card with detailed information
                const testResultElement = document.createElement('div');
                testResultElement.className = `test-result card ${result.success ? 'success' : 'error'}`;
                
                let details = '';
                if (script.path.includes('xss-check')) {
                    details = `
                        <h4>What is Cross-Site Scripting (XSS)?</h4>
                        <p>XSS attacks occur when malicious scripts are injected into trusted websites. These attacks can steal session cookies, deface websites, or redirect users to malicious sites.</p>
                        <h4>Mitigation Steps:</h4>
                        <ul>
                            <li>Input validation and sanitization</li>
                            <li>Output encoding</li>
                            <li>Use of Content Security Policy (CSP)</li>
                            <li>HTTP-only cookies</li>
                        </ul>
                    `;
                } else if (script.path.includes('sql-injection')) {
                    details = `
                        <h4>What is SQL Injection?</h4>
                        <p>SQL Injection occurs when malicious SQL statements are inserted into input fields, potentially allowing attackers to read, modify, or delete database content.</p>
                        <h4>Mitigation Steps:</h4>
                        <ul>
                            <li>Use prepared statements</li>
                            <li>Input validation</li>
                            <li>Proper error handling</li>
                            <li>Least privilege database accounts</li>
                        </ul>
                    `;
                } else if (script.path.includes('csrf-check')) {
                    details = `
                        <h4>What is CSRF (Cross-Site Request Forgery)?</h4>
                        <p>CSRF attacks trick users into performing unwanted actions on a website where they're authenticated, by exploiting their active session.</p>
                        <h4>Mitigation Steps:</h4>
                        <ul>
                            <li>Use CSRF tokens</li>
                            <li>SameSite cookie attribute</li>
                            <li>Custom request headers</li>
                            <li>Re-authentication for sensitive actions</li>
                        </ul>
                    `;
                } else if (script.path.includes('api-checks')) {
                    details = `
                        <h4>What is API Security?</h4>
                        <p>API security involves protecting APIs from attacks and ensuring proper authentication, authorization, and data validation.</p>
                        <h4>Mitigation Steps:</h4>
                        <ul>
                            <li>Implement proper authentication (OAuth, JWT)</li>
                            <li>Use HTTPS for all API communications</li>
                            <li>Implement rate limiting</li>
                            <li>Validate and sanitize all input data</li>
                            <li>Use proper error handling</li>
                        </ul>
                    `;
                }

                // Create visual result card with detailed information
                testResultElement.innerHTML = `
                    <div class="test-header">
                        <h4>${script.name}</h4>
                        <span class="status-badge ${result.success ? 'success' : 'error'}">${result.success ? 'Passed' : 'Failed'}</span>
                    </div>
                    <div class="script-info">
                        <div class="script-header">Script Details</div>
                        <div class="script-path">${script.path}</div>
                        <div class="script-description">${script.description}</div>
                    </div>
                    <div class="test-details">
                        <div class="test-output">${result.output || 'Completed'}</div>
                        ${details ? `
                            <div class="warning-details">
                                <div class="warning-explanation">
                                    <h4>Why is this an issue?</h4>
                                    <p>${details}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;

                // Add styles for warning details
                const warningStyle = document.createElement('style');
                warningStyle.textContent = `
                    .warning-details {
                        margin-top: 16px;
                        padding-top: 16px;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .warning-explanation {
                        margin-bottom: 16px;
                    }
                    
                    .warning-explanation h4 {
                        color: #f59e0b;
                        margin-bottom: 8px;
                        font-size: 0.9em;
                        font-weight: 600;
                    }
                    
                    .warning-explanation p {
                        color: var(--text-secondary);
                        font-size: 0.9em;
                        line-height: 1.5;
                    }
                `;
                document.head.appendChild(warningStyle);
                
                resultsContainer.appendChild(testResultElement);
            } catch (error) {
                console.error(`Error running test for ${script.name}:`, error);
                const errorResultElement = document.createElement('div');
                errorResultElement.className = 'test-result error';
                errorResultElement.innerHTML = `
                    <div class="test-header">
                        <h4>${script.name}</h4>
                        <span class="status-badge error">Error</span>
                    </div>
                    <div class="test-details">
                        <div class="test-output">${error.message || 'Test execution failed'}</div>
                    </div>
                `;
                resultsContainer.appendChild(errorResultElement);
            }
        }
        
        updateUI.setStatus('Security scan completed', 'success');
    } catch (error) {
        console.error('Security scan error:', error);
        updateUI.setStatus(error.message, 'error');
    } finally {
        isProcessing = false;
        elements.spinner.classList.add('hidden');
    }
}