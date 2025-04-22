const fs = require('fs-extra');
const path = require('path');
const PDFDocument = require('pdfkit');
const moment = require('moment');

async function generatePDFReport(results, timestamp) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: 'CASA Tier 2 Security Assessment Report',
      Author: 'Security Team',
      Subject: 'Security Assessment Results',
      Keywords: 'security, assessment, CASA, Tier 2',
      CreationDate: new Date()
    }
  });

  // Save the PDF
  const pdfPath = path.join('logs', `report_${timestamp}.pdf`);
  doc.pipe(fs.createWriteStream(pdfPath));

  // Header
  doc.fontSize(20)
     .text('CASA Tier 2 Security Assessment Report', { align: 'center' })
     .moveDown();

  doc.fontSize(12)
     .text(`Generated on: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`, { align: 'center' })
     .moveDown(2);

  // Summary
  doc.fontSize(16)
     .text('Executive Summary', { underline: true })
     .moveDown();

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const passRate = ((passed / results.length) * 100).toFixed(1);

  doc.fontSize(12)
     .text(`Total Checks: ${results.length}`)
     .text(`Passed: ${passed}`)
     .text(`Failed: ${failed}`)
     .text(`Pass Rate: ${passRate}%`)
     .moveDown(2);

  // Detailed Results
  doc.fontSize(16)
     .text('Detailed Results', { underline: true })
     .moveDown();

  results.forEach((result, index) => {
    doc.fontSize(14)
       .text(`${index + 1}. ${result.name}`, { color: result.success ? 'green' : 'red' })
       .moveDown();

    doc.fontSize(12)
       .text('Status: ' + (result.success ? 'PASS' : 'FAIL'))
       .text('Retries: ' + result.retries)
       .moveDown();

    const cleanedOutput = result.output.split('\n');
    doc.fontSize(10)
       .text('Details:')
       .moveDown(0.5);

    cleanedOutput.forEach(line => {
      doc.text(line, { indent: 20 });
    });

    doc.moveDown(2);
  });

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .text(
         `Page ${i + 1} of ${pageCount}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );
  }

  doc.end();
  return pdfPath;
}

module.exports = generatePDFReport; 