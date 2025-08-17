const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('Creating Lambda deployment ZIP...');

// Create output stream
const output = fs.createWriteStream('lambda-final.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for close event
output.on('close', function() {
  console.log(`✅ Created lambda-final.zip (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
  console.log('Ready to upload to AWS Lambda!');
});

// Handle errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files
console.log('Adding files to archive...');

// Add main Lambda file
archive.file('getUsersData.js', { name: 'getUsersData.js' });
console.log('  ✓ Added getUsersData.js');

// Add package files
archive.file('package.json', { name: 'package.json' });
archive.file('package-lock.json', { name: 'package-lock.json' });
console.log('  ✓ Added package files');

// Add node_modules directory
if (fs.existsSync('node_modules')) {
  archive.directory('node_modules/', 'node_modules');
  console.log('  ✓ Added node_modules');
}

// Finalize the archive
archive.finalize();