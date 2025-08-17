// Script to identify orphaned S3 files (files without database entries)
require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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

async function syncCheck() {
  console.log('\n========================================');
  console.log('S3 and Database Sync Check');
  console.log('========================================\n');

  try {
    // Get all users from database
    await pgClient.connect();
    const dbResult = await pgClient.query('SELECT id, email, s3_url FROM users WHERE s3_url IS NOT NULL');
    const dbUsers = new Set(dbResult.rows.map(row => row.id.toString()));
    
    console.log(`📊 Database: ${dbResult.rows.length} users with files\n`);
    
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
    
    // Analyze S3 files
    const s3UserFiles = {};
    s3Response.Contents.forEach(file => {
      const parts = file.Key.split('/');
      if (parts.length >= 3) {
        const userId = parts[1];
        if (!s3UserFiles[userId]) {
          s3UserFiles[userId] = [];
        }
        s3UserFiles[userId].push(file.Key);
      }
    });
    
    const s3UserIds = Object.keys(s3UserFiles);
    console.log(`📁 S3 Bucket: ${s3UserIds.length} users with files\n`);
    
    // Find mismatches
    console.log('🔍 Analysis:');
    console.log('----------------------------------------\n');
    
    // Users in S3 but not in database (orphaned files)
    const orphanedUsers = s3UserIds.filter(id => !dbUsers.has(id));
    if (orphanedUsers.length > 0) {
      console.log('⚠️  Orphaned S3 Files (no database entry):');
      orphanedUsers.forEach(userId => {
        console.log(`   User ID ${userId}:`);
        s3UserFiles[userId].forEach(file => {
          console.log(`     - ${file}`);
        });
      });
      console.log('');
    } else {
      console.log('✅ All S3 files have corresponding database entries\n');
    }
    
    // Users in database but not in S3 (missing files)
    const missingFiles = dbResult.rows.filter(row => !s3UserFiles[row.id.toString()]);
    if (missingFiles.length > 0) {
      console.log('⚠️  Database entries with missing S3 files:');
      missingFiles.forEach(user => {
        console.log(`   User ID ${user.id} (${user.email})`);
        console.log(`     Expected: ${user.s3_url}`);
      });
      console.log('');
    } else {
      console.log('✅ All database entries have corresponding S3 files\n');
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log('----------------------------------------');
    console.log(`Database users with files: ${dbResult.rows.length}`);
    console.log(`S3 users with files: ${s3UserIds.length}`);
    console.log(`Orphaned S3 files: ${orphanedUsers.length} users`);
    console.log(`Missing S3 files: ${missingFiles.length} users`);
    
    if (orphanedUsers.length > 0) {
      console.log('\n💡 To clean orphaned files:');
      console.log('   These files belong to users that no longer exist in the database.');
      console.log('   They are likely from previous testing or a different environment.');
      console.log('   You can safely ignore them or manually delete from S3 if needed.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pgClient.end();
  }
}

syncCheck();