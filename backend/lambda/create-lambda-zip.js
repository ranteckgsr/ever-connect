const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

async function createLambdaZip() {
  const outputFile = 'lambda-deployment.zip';
  
  // Delete existing zip if it exists
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
    console.log('Removed existing ZIP file');
  }

  // Create output stream
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`\n✅ Lambda deployment package created: ${outputFile}`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log(`   Total bytes: ${archive.pointer()}`);
      console.log('\nPackage contents:');
      console.log('  - getUsersData.js (Lambda function with AWS SDK v3)');
      console.log('  - package.json & package-lock.json');
      console.log('  - node_modules/ (AWS SDK v3 + pg dependencies)');
      console.log('\n📦 Ready for AWS Lambda deployment!');
      console.log('   Runtime: Node.js 22.x');
      console.log('   Handler: getUsersData.handler');
      resolve();
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
      } else {
        reject(err);
      }
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add files to the archive
    console.log('Creating Lambda deployment package for Node.js 22.x...');
    console.log('Adding files to archive...');

    // Add the main Lambda function
    archive.file('getUsersData.js', { name: 'getUsersData.js' });
    
    // Add package files
    archive.file('package.json', { name: 'package.json' });
    archive.file('package-lock.json', { name: 'package-lock.json' });
    
    // Add node_modules directory
    archive.directory('node_modules/', 'node_modules');

    // Finalize the archive
    archive.finalize();
  });
}

// Run the function
createLambdaZip().catch(console.error);