# Security Check Scripts

A collection of security check scripts for web applications.

## Features

1. SSL/TLS Configuration
2. Security Headers
3. Storage Data Security
4. API Security
5. Code Integrity
6. CSRF Protection
7. XSS Protection
8. Directory Browsing
9. URL Parameter Security

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/casa-security-tool.git
cd casa-security-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Usage

1. Launch the application
2. Click "Run Tests" to start security checks
3. View results in real-time
4. Save results using the "Save Results" button
5. View historical results in the History tab
6. Export reports as PDF using the "Export PDF" button

## Configuration

1. Set up your environment variables in `.env`
2. Configure target URLs in the scripts
3. Run the security checks

## Security Checks

- SSL/TLS Configuration Check
- Security Headers Analysis
- Storage Data Security Analysis
- API Security Verification
- Code Integrity Verification
- CSRF Protection Analysis
- XSS Protection Verification
- Directory Browsing Check
- URL Parameter Security Check

## Project Structure

```
casa-security-tool/
├── main.js              # Main process
├── preload.js           # Preload script
├── renderer.js          # Renderer process
├── index.html           # Main window
├── styles.css           # Application styles
├── scripts/             # Security check scripts
│   ├── index.js         # Main security checks
│   └── ...              # Individual check modules
└── package.json         # Project configuration
```

## Development

### Adding New Checks

1. Create a new check module in the `scripts` directory
2. Export a function that returns:
   - `name`: Check name
   - `success`: Boolean result
   - `command`: Command executed
   - `output`: Result message
3. Import and add the check to `scripts/index.js`

### Building

To build the application:

```bash
# For development
npm run dev

# For production
npm run build
```

## License

This project is licensed under the MIT License.

## Author

Your Name - [@alvslovescyber](https://github.com/alvslovescyber)
