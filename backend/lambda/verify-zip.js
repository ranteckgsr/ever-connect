const fs = require('fs');
const path = require('path');

// Check if the ZIP file exists and show its info
const zipFile = 'lambda-final.zip';

if (fs.existsSync(zipFile)) {
  const stats = fs.statSync(zipFile);
  console.log('✅ ZIP file exists: lambda-final.zip');
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Created: ${stats.mtime}`);
  
  // Try to read first few bytes to verify it's a ZIP
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(zipFile, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  
  // ZIP files start with PK (0x504B)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    console.log('✅ File signature confirms it is a valid ZIP file');
    console.log('\n📦 This file is ready to upload to AWS Lambda!');
    console.log('   Function name: getUsersData');
    console.log('   Handler: getUsersData.handler');
  } else {
    console.log('❌ File does not have valid ZIP signature');
  }
} else {
  console.log('❌ ZIP file not found');
}