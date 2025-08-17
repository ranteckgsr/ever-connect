// FIXED Script to restore users - doesn't corrupt sequence
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
  ssl: { rejectUnauthorized: false }
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
  console.log('Restore Users from S3 Files (FIXED)');
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
    let maxUserId = 0;
    
    s3Response.Contents.forEach(file => {
      const parts = file.Key.split('/');
      if (parts.length >= 3) {
        const userId = parts[1];
        const userIdNum = parseInt(userId);
        if (userIdNum > maxUserId) {
          maxUserId = userIdNum;
        }
        
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
    
    console.log(`Found files for ${Object.keys(s3UserFiles).length} users in S3`);
    console.log(`Existing users in database: ${existingUserIds.size}`);
    console.log(`Maximum user ID in S3: ${maxUserId}\n`);
    
    // Restore missing users
    let restoredCount = 0;
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    for (const [userId, userFiles] of Object.entries(s3UserFiles)) {
      if (existingUserIds.has(userId)) {
        console.log(`User ID ${userId}: Already exists in database ✓`);
        continue;
      }
      
      const primaryFile = userFiles.files.sort((a, b) => 
        new Date(b.lastModified) - new Date(a.lastModified)
      )[0];
      
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
      
      console.log(`\nRestoring User ID ${userId}:`);
      console.log(`  File: ${userData.fileName}`);
      
      try {
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
        
        console.log(`  ✅ User restored successfully`);
        restoredCount++;
        
      } catch (error) {
        console.log(`  ❌ Failed to restore: ${error.message}`);
      }
    }
    
    // FIX: Update sequence ONCE at the end, not after each insert
    console.log('\n🔧 Fixing sequence...');
    const maxIdResult = await pgClient.query('SELECT MAX(id) as max_id FROM users');
    const currentMaxId = maxIdResult.rows[0].max_id || 0;
    const nextId = currentMaxId + 1;
    
    await pgClient.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${nextId}`);
    console.log(`✅ Sequence set to start at ${nextId}`);
    
    // Verify sequence is correct
    const seqCheck = await pgClient.query(`
      SELECT last_value, is_called 
      FROM users_id_seq
    `);
    console.log(`   Sequence last_value: ${seqCheck.rows[0].last_value}`);
    console.log(`   Next ID will be: ${nextId}`);
    
    // Show final status
    console.log('\n========================================');
    console.log('Restoration Complete');
    console.log('========================================\n');
    
    const finalCount = await pgClient.query('SELECT COUNT(*) FROM users');
    console.log(`Total users in database: ${finalCount.rows[0].count}`);
    console.log(`Users restored: ${restoredCount}`);
    
    if (restoredCount > 0) {
      console.log('\n📝 Notes:');
      console.log('- Default password for restored users: Password123!');
      console.log('- Usernames/emails: restored_user_[ID]@example.com');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pgClient.end();
  }
}

restoreUsers();