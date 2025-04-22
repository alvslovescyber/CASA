const checkSecureHeaders = require('./secure-headers');
const checkSSL = require('./ssl-check');

async function runAllChecks() {
  const TARGET_URL = 'https://dev.example.com';
  
  try {
    // Print header
    console.log('\n=================================');
    console.log('   SECURITY SCANNER');
    console.log('=================================\n');
    console.log(`Target URL: ${TARGET_URL}\n`);
    
    const checks = [
      checkSecureHeaders(),
      checkSSL()
    ];
    
    const results = await Promise.all(checks);
    
    // Print results
    results.forEach(result => {
      // Print check name with pass/fail status
      const status = result.success ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      console.log(`${result.name}: ${status}`);
      
      // If test failed, show the command and reason
      if (!result.success) {
        console.log(`Script: ${result.command}`);
        console.log(`Reason: ${result.output}`);
      }
      console.log(''); // Empty line between checks
    });
    
    // Print summary
    const totalChecks = results.length;
    const passedChecks = results.filter(r => r.success).length;
    console.log('=================================');
    console.log(`Summary: ${passedChecks}/${totalChecks} checks passed`);
    console.log('=================================\n');
    
  } catch (error) {
    console.error('\x1b[31mError running checks:', error.message, '\x1b[0m');
    process.exit(1);
  }
}

// Run all checks if this file is run directly
if (require.main === module) {
  runAllChecks();
} 