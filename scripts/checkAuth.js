require('dotenv').config();
const { verifyAuthentication } = require('./authTest');
const chalk = require('chalk');

async function checkAuthStatus() {
    console.clear(); // Clear the console for better visibility
    console.log(chalk.blue('\n🔒 Checking Authentication Status...'));
    
    try {
        const authData = await verifyAuthentication();
        
        if (authData && authData.userData && authData.userData.user) {
            const user = authData.userData.user;
            const timestamp = new Date().toLocaleString();
            
            console.log('\n' + chalk.green.bold('✅ AUTHENTICATED'));
            console.log('\nUser Details:');
            console.log(chalk.gray('================'));
            console.log(chalk.white('Name:'), chalk.cyan(`${user.firstName} ${user.lastName || ''}`));
            console.log(chalk.white('Email:'), chalk.cyan(user.email || 'N/A'));
            console.log(chalk.white('Tenant ID:'), chalk.cyan(user.tenantId || 'N/A'));
            console.log(chalk.white('Role:'), chalk.cyan(user.role || 'N/A'));
            
            console.log('\nSession Info:');
            console.log(chalk.gray('================'));
            console.log(chalk.white('Status:'), chalk.green('Active'));
            console.log(chalk.white('Last Checked:'), chalk.cyan(timestamp));
            console.log(chalk.white('API URL:'), chalk.cyan(process.env.API_BASE_URL || 'https://dev.example.com'));
            
            if (user.permissions) {
                console.log('\nPermissions:');
                console.log(chalk.gray('================'));
                Object.entries(user.permissions).forEach(([key, value]) => {
                    console.log(chalk.white(`${key}:`), value ? chalk.green('✓') : chalk.red('✗'));
                });
            }
            
            console.log('\nSecurity Tips:');
            console.log(chalk.gray('================'));
            console.log(chalk.yellow('• Regularly rotate your session cookie'));
            console.log(chalk.yellow('• Never share your session credentials'));
            console.log(chalk.yellow('• Keep your .env file secure'));
            
            return true;
        } else {
            console.log('\n' + chalk.red.bold('❌ NOT AUTHENTICATED'));
            console.log(chalk.yellow('\nTroubleshooting Guide:'));
            console.log(chalk.gray('================'));
            console.log(chalk.gray('1. Check SESSION_COOKIE in .env file:'));
            console.log(chalk.gray('   • Ensure it exists and is not expired'));
            console.log(chalk.gray('   • Make sure it\'s properly formatted'));
            console.log(chalk.gray('\n2. Verify API_BASE_URL in .env file:'));
            console.log(chalk.gray('   • Current:', process.env.API_BASE_URL || 'Not set'));
            console.log(chalk.gray('   • Default: https://dev.example.com'));
            console.log(chalk.gray('\n3. Check Network Connectivity:'));
            console.log(chalk.gray('   • Ensure you can reach', process.env.API_BASE_URL || 'https://dev.example.com'));
            console.log(chalk.gray('   • Check your VPN connection if required'));
            
            console.log('\nNeed Help?');
            console.log(chalk.gray('================'));
            console.log(chalk.cyan('• Contact your system administrator'));
            console.log(chalk.cyan('• Check the documentation'));
            
            return false;
        }
    } catch (error) {
        console.log('\n' + chalk.red.bold('❌ AUTHENTICATION ERROR'));
        console.log('\nError Details:');
        console.log(chalk.gray('================'));
        console.log(chalk.red('Message:'), error.message);
        if (error.response) {
            console.log(chalk.red('Status:'), error.response.status);
            console.log(chalk.red('Status Text:'), error.response.statusText);
        }
        
        console.log('\nTroubleshooting Steps:');
        console.log(chalk.gray('================'));
        console.log(chalk.gray('1. Verify your credentials:'));
        console.log(chalk.gray('   • Check SESSION_COOKIE in .env'));
        console.log(chalk.gray('   • Ensure cookie is not expired'));
        console.log(chalk.gray('\n2. Check your environment:'));
        console.log(chalk.gray('   • API URL:', process.env.API_BASE_URL || 'https://dev.example.com'));
        console.log(chalk.gray('   • Node version:', process.version));
        console.log(chalk.gray('\n3. Network connectivity:'));
        console.log(chalk.gray('   • Check your internet connection'));
        console.log(chalk.gray('   • Verify VPN status if required'));
        
        console.log('\nNext Steps:');
        console.log(chalk.gray('================'));
        console.log(chalk.yellow('1. Try logging out and back in'));
        console.log(chalk.yellow('2. Clear your browser cookies'));
        console.log(chalk.yellow('3. Contact support if issue persists'));
        
        return false;
    }
}

// Run the check if this script is run directly
if (require.main === module) {
    // Properly handle the async function
    checkAuthStatus()
        .catch(error => {
            console.error(chalk.red('\nFatal Error:'), error);
            process.exit(1);
        });
}

module.exports = checkAuthStatus; 