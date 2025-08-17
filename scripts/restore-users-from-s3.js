// Script to restore users in database based on existing S3 files
require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const bcrypt = require('bcryptjs');

const pgClient = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'everconnect-user-files';

async function restoreUsers() {
  console.log('\n========================================');
  console.log('Restore Users from S3 Files');
  console.log('========================================\n');

  try {
    await pgClient.connect();
    
    // Get existing users
    const existingUsers = await pgClient.query('SELECT id FROM users');
    const existingUserIds = new Set(existingUsers.rows.map(row => row.id.toString()));
    
    // Get all files from S3
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'user-files/',
    });
    
    const s3Response = await s3Client.send(listCommand);
    
    if (!s3Response.Contents) {
      console.log('No files in S3');
      return;
    }
    
    // Group files by user ID
    const s3UserFiles = {};
    s3Response.Contents.forEach(file => {
      const parts = file.Key.split('/');
      if (parts.length >= 3) {
        const userId = parts[1];
        const fileName = parts[2];
        
        if (!s3UserFiles[userId]) {
          s3UserFiles[userId] = {
            files: [],
            phoneNumber: null
          };
        }
        
        s3UserFiles[userId].files.push({
          key: file.Key,
          fileName: fileName,
          lastModified: file.LastModified,
          size: file.Size
        });
        
        // Try to extract phone number from filename
        const phoneMatch = fileName.match(/^(\d+)-/);
        if (phoneMatch) {
          s3UserFiles[userId].phoneNumber = phoneMatch[1];
        }
      }
    });
    
    // Find orphaned files (files without database entries)
    const orphanedUserIds = Object.keys(s3UserFiles).filter(id => !existingUserIds.has(id));
    
    if (orphanedUserIds.length === 0) {
      console.log('✅ All S3 files already have corresponding database entries.');
      return;
    }
    
    console.log(`Found ${orphanedUserIds.length} users to restore:\n`);
    
    // Create user records for orphaned files
    for (const userId of orphanedUserIds) {
      const userFiles = s3UserFiles[userId];
      const primaryFile = userFiles.files[0]; // Use first file as primary
      
      // Generate user data based on what we can infer
      const userData = {
        id: parseInt(userId),
        username: `restored_user_${userId}@example.com`,
        email: `restored_user_${userId}@example.com`,
        firstName: `Restored`,
        lastName: `User${userId}`,
        phoneNumber: userFiles.phoneNumber ? `+${userFiles.phoneNumber}` : null,
        fileName: primaryFile.fileName,
        s3Url: `https://${BUCKET_NAME}.s3.amazonaws.com/${primaryFile.key}`,
        storageLocation: primaryFile.key
      };
      
      console.log(`Restoring User ID ${userId}:`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  Name: ${userData.firstName} ${userData.lastName}`);
      console.log(`  Phone: ${userData.phoneNumber || 'Not available'}`);
      console.log(`  File: ${userData.fileName}`);
      console.log(`  S3 URL: ${userData.s3Url}`);
      
      try {
        // Hash a default password
        const defaultPassword = 'Password123!';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        // Insert user with specific ID
        await pgClient.query(`
          INSERT INTO users (
            id, username, email, first_name, last_name, 
            phone_number, password_hash, file_name, 
            storage_location, s3_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            storage_location = EXCLUDED.storage_location,
            s3_url = EXCLUDED.s3_url
        `, [
          userData.id,
          userData.username,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.phoneNumber,
          passwordHash,
          userData.fileName,
          userData.storageLocation,
          userData.s3Url,
          primaryFile.lastModified
        ]);
        
        // Update sequence to ensure next ID is correct
        await pgClient.query(`
          SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true)
        `);
        
        console.log(`  ✅ User restored successfully\n`);
        
      } catch (error) {
        console.log(`  ❌ Failed to restore: ${error.message}\n`);
      }
    }
    
    // Show final status
    console.log('\n========================================');
    console.log('Restoration Complete');
    console.log('========================================\n');
    
    const finalCount = await pgClient.query('SELECT COUNT(*) FROM users');
    console.log(`Total users in database: ${finalCount.rows[0].count}`);
    
    console.log('\n📝 Notes:');
    console.log('- Restored users have been created with placeholder data');
    console.log('- Default password for all restored users: Password123!');
    console.log('- Usernames/emails follow pattern: restored_user_[ID]@example.com');
    console.log('- You can update these details later if needed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pgClient.end();
  }
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n⚠️  WARNING: This will create user records in the database');
console.log('based on orphaned S3 files.\n');

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close();
    restoreUsers();
  } else {
    console.log('Operation cancelled.');
    rl.close();
  }
});