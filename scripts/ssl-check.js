const tls = require('tls');

module.exports = function checkSSL() {
  return new Promise((resolve) => {
    const options = {
      host: 'dev.example.com',
      port: 443,
      rejectUnauthorized: false // Allow self-signed certificates for testing
    };

    const socket = tls.connect(options, () => {
      const protocol = socket.getProtocol();
      const cert = socket.getPeerCertificate();
      const cipherInfo = socket.getCipher();
      
      // Check TLS version
      const isSecureTLS = protocol === 'TLSv1.2' || protocol === 'TLSv1.3';
      
      // Check certificate
      const now = new Date();
      const certValid = cert.valid_to && new Date(cert.valid_to) > now;
      
      // Format detailed output
      const details = [
        `Protocol: ${protocol}`,
        `Cipher: ${cipherInfo.name} (${cipherInfo.version})`,
        `Certificate Valid Until: ${cert.valid_to}`,
        `Issuer: ${cert.issuer.CN}`,
        `Subject: ${cert.subject.CN}`
      ].join('\n');

      socket.end();
      
      resolve({
        name: "SSL/TLS Check",
        success: isSecureTLS && certValid,
        command: "TLS connection check to dev.example.com:443",
        output: `SSL/TLS Configuration:\n${details}\n\n` +
               `Status: ${isSecureTLS ? 'Using secure TLS version' : 'Insecure TLS version'}\n` +
               `Certificate: ${certValid ? 'Valid' : 'Invalid or expired'}`
      });
    });

    socket.on('error', (error) => {
      resolve({
        name: "SSL/TLS Check",
        success: false,
        command: "TLS connection check to dev.example.com:443",
        output: `Error checking SSL/TLS: ${error.message}`
      });
    });
  });
}; 