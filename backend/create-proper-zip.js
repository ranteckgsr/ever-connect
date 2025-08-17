// Script to create a proper ZIP file for Linux deployment
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createDeploymentZip() {
  console.log('Creating Linux-compatible deployment ZIP...\n');

  // Create output stream
  const output = fs.createWriteStream('everconnect-backend.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Listen for archive events
  output.on('close', () => {
    console.log(`✅ Created everconnect-backend.zip (${(archive.pointer() / 1024).toFixed(2)} KB)`);
    console.log('\nThis ZIP file is Linux-compatible and ready for Elastic Beanstalk!');
  });

  archive.on('error', (err) => {
    throw err;
  });

  // Pipe archive to output
  archive.pipe(output);

  // Add files and directories
  console.log('Adding files to archive...');
  
  // Add dist directory
  archive.directory('dist/', 'dist');
  console.log('  ✓ Added dist/');
  
  // Add .ebextensions directory
  archive.directory('.ebextensions/', '.ebextensions');
  console.log('  ✓ Added .ebextensions/');
  
  // Add individual files
  archive.file('package.json', { name: 'package.json' });
  console.log('  ✓ Added package.json');
  
  archive.file('package-lock.json', { name: 'package-lock.json' });
  console.log('  ✓ Added package-lock.json');
  
  archive.file('Procfile', { name: 'Procfile' });
  console.log('  ✓ Added Procfile');

  // Finalize the archive
  await archive.finalize();
}

// Check if archiver is installed
try {
  require.resolve('archiver');
  createDeploymentZip();
} catch(e) {
  console.log('Installing archiver package...');
  const { execSync } = require('child_process');
  execSync('npm install archiver', { stdio: 'inherit' });
  console.log('\nArchiver installed. Please run this script again.');
}