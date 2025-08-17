// Script to view files in S3 bucket
require('dotenv').config({ path: '../backend/.env' });
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'everconnect-user-files';

async function viewS3Files() {
  console.log('\n========================================');
  console.log('EverConnect S3 File Viewer');
  console.log('========================================\n');
  
  console.log(`🪣 Bucket: ${BUCKET_NAME}`);
  console.log(`🌎 Region: ${process.env.AWS_REGION}\n`);

  try {
    // List all objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'user-files/', // Only show user files
    });

    const response = await s3Client.send(listCommand);

    if (!response.Contents || response.Contents.length === 0) {
      console.log('📭 No files found in bucket.');
      return;
    }

    console.log(`📁 Total Files: ${response.Contents.length}\n`);
    console.log('File List:');
    console.log('----------------------------------------');

    // Group files by user
    const filesByUser = {};
    let totalSize = 0;

    response.Contents.forEach(file => {
      const parts = file.Key.split('/');
      if (parts.length >= 3) {
        const userId = parts[1];
        if (!filesByUser[userId]) {
          filesByUser[userId] = [];
        }
        filesByUser[userId].push({
          name: parts[2],
          size: file.Size,
          modified: file.LastModified,
          key: file.Key
        });
        totalSize += file.Size;
      }
    });

    // Display files grouped by user
    Object.keys(filesByUser).sort((a, b) => parseInt(a) - parseInt(b)).forEach(userId => {
      console.log(`\n👤 User ID: ${userId}`);
      filesByUser[userId].forEach(file => {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        const sizeKB = (file.size / 1024).toFixed(2);
        const sizeDisplay = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
        
        console.log(`   📄 ${file.name}`);
        console.log(`      Size: ${sizeDisplay}`);
        console.log(`      Modified: ${new Date(file.modified).toLocaleDateString()}`);
        console.log(`      S3 URL: https://${BUCKET_NAME}.s3.amazonaws.com/${file.key}`);
      });
    });

    // Show statistics
    console.log('\n\n📊 Storage Statistics:');
    console.log('----------------------------------------');
    console.log(`   Total Users with Files: ${Object.keys(filesByUser).length}`);
    console.log(`   Total Files: ${response.Contents.length}`);
    console.log(`   Total Storage Used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Average File Size: ${(totalSize / response.Contents.length / 1024).toFixed(2)} KB`);

    // Show recent uploads
    console.log('\n\n📈 Recent Uploads (Last 5):');
    console.log('----------------------------------------');
    
    const recentFiles = response.Contents
      .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
      .slice(0, 5);

    recentFiles.forEach(file => {
      const fileName = file.Key.split('/').pop();
      const date = new Date(file.LastModified);
      console.log(`   ${fileName} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.error('\n⚠️  Bucket not found:', BUCKET_NAME);
    } else if (error.name === 'AccessDenied') {
      console.error('\n⚠️  Access denied. Check AWS credentials in backend/.env');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('\n⚠️  Invalid AWS Access Key ID');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\n⚠️  Invalid AWS Secret Access Key');
    } else {
      console.error('\n⚠️  Make sure AWS credentials are configured in backend/.env');
    }
  }
}

viewS3Files();