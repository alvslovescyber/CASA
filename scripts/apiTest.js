require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://dev.example.com';
const COOKIE_FILE = process.env.COOKIE_FILE || 'cookies.txt';

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Utility to save cookies to file
const saveCookies = (cookies) => {
    try {
        fs.writeFileSync(COOKIE_FILE, cookies);
        console.log(chalk.green('✓ Cookies saved successfully'));
    } catch (error) {
        console.error(chalk.red('Error saving cookies:'), error);
    }
};

// Utility to load cookies from file
const loadCookies = () => {
    try {
        if (fs.existsSync(COOKIE_FILE)) {
            return fs.readFileSync(COOKIE_FILE, 'utf8');
        }
    } catch (error) {
        console.error(chalk.red('Error loading cookies:'), error);
    }
    return null;
};

// Make an authenticated request
const makeRequest = async (method, endpoint, data = null) => {
    const cookies = process.env.SESSION_COOKIE || loadCookies();
    if (!cookies) {
        throw new Error('No session cookie found. Please set it in .env or cookies.txt');
    }

    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Cookie': cookies,
                'Content-Type': 'application/json'
            },
            data: data
        };

        console.log(chalk.blue('\nMaking request:'));
        console.log(chalk.gray(`${method} ${config.url}`));

        const response = await axios(config);
        
        console.log(chalk.green('\nResponse:'));
        console.log(chalk.gray('Status:'), response.status);
        console.log(chalk.gray('Data:'), JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.error(chalk.red('\nError:'));
        if (error.response) {
            console.error(chalk.red('Status:'), error.response.status);
            console.error(chalk.red('Data:'), error.response.data);
        } else {
            console.error(chalk.red(error.message));
        }
        throw error;
    }
};

// Interactive menu
const showMenu = async () => {
    console.log(chalk.cyan('\nAPI Test Menu:'));
    console.log('1. Test Authentication (GET /api/auth/user)');
    console.log('2. Set New Session Cookie');
    console.log('3. Make Custom Request');
    console.log('4. Exit');

    rl.question(chalk.yellow('\nSelect an option (1-4): '), async (answer) => {
        try {
            switch (answer) {
                case '1':
                    await makeRequest('GET', '/api/auth/user');
                    break;
                case '2':
                    rl.question(chalk.yellow('Enter your session cookie: '), (cookie) => {
                        saveCookies(cookie);
                        process.env.SESSION_COOKIE = cookie;
                    });
                    break;
                case '3':
                    rl.question(chalk.yellow('Enter request method (GET/POST/PUT/DELETE): '), (method) => {
                        rl.question(chalk.yellow('Enter endpoint (e.g., /api/auth/user): '), async (endpoint) => {
                            if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
                                rl.question(chalk.yellow('Enter request body (JSON): '), async (body) => {
                                    try {
                                        const data = JSON.parse(body);
                                        await makeRequest(method.toUpperCase(), endpoint, data);
                                    } catch (error) {
                                        console.error(chalk.red('Invalid JSON body'));
                                    }
                                });
                            } else {
                                await makeRequest(method.toUpperCase(), endpoint);
                            }
                        });
                    });
                    break;
                case '4':
                    console.log(chalk.green('Goodbye!'));
                    rl.close();
                    process.exit(0);
                default:
                    console.log(chalk.red('Invalid option'));
            }
        } catch (error) {
            // Error is already logged in makeRequest
        }
        setTimeout(showMenu, 1000);
    });
};

// Start the script
console.log(chalk.cyan('API Test Script'));
console.log(chalk.gray(`Base URL: ${API_BASE_URL}`));

// Check for existing cookie
const existingCookie = process.env.SESSION_COOKIE || loadCookies();
if (existingCookie) {
    console.log(chalk.green('✓ Session cookie found'));
} else {
    console.log(chalk.yellow('! No session cookie found. Use option 2 to set one.'));
}

showMenu(); 