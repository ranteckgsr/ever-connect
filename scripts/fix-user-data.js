require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

const pgClient = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Based on the original S3 files, these are the real users
const realUserData = {
  1: {
    username: 'testuser1',
    firstName: 'Test',
    lastName: 'User1',
    email: 'test1@example.com',
    phoneNumber: '+17807103313',
    fileName: '17807103313-_chat.txt',
    s3Url: 'https://everconnect-user-files.s3.amazonaws.com/user-files/1/17807103313-_chat.txt'
  },
  2: {
    username: 'testuser2', 
    firstName: 'Test',
    lastName: 'User2',
    email: 'test2@example.com',
    phoneNumber: null, // No phone in filename
    fileName: 'no-phone-test2.txt',
    s3Url: 'https://everconnect-user-files.s3.amazonaws.com/user-files/2/no-phone-test2.txt'
  },
  3: {
    username: 'john',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+17807103313',
    fileName: '17807103313-john_mike_chat.txt',
    s3Url: 'https://everconnect-user-files.s3.amazonaws.com/user-files/3/17807103313-john_mike_chat.txt'
  },
  4: {
    username: 'mike',
    firstName: 'Mike',
    lastName: 'Smith',
    email: 'mike@example.com',
    phoneNumber: '+17807103313',
    fileName: '17807103313-john_mike_chat.txt',
    s3Url: 'https://everconnect-user-files.s3.amazonaws.com/user-files/4/17807103313-john_mike_chat.txt'
  },
  5: {
    username: 'jasjit',
    firstName: 'Jasjit',
    lastName: 'Singh',
    email: 'jasjit@example.com',
    phoneNumber: '+15551112356',
    fileName: '15551112356-jasjit_mike_chat.txt',
    s3Url: 'https://everconnect-user-files.s3.amazonaws.com/user-files/5/15551112356-jasjit_mike_chat.txt'
  }
};

async function fixUserData() {
  console.log('\n========================================');
  console.log('Fixing User Data with Real Information');
  console.log('========================================\n');

  try {
    await pgClient.connect();
    
    for (const [userId, userData] of Object.entries(realUserData)) {
      console.log(`\nUpdating User ${userId}: ${userData.firstName} ${userData.lastName}`);
      
      // Update user with real data
      const updateQuery = `
        UPDATE users 
        SET 
          username = $1,
          first_name = $2,
          last_name = $3,
          email = $4,
          phone_number = $5,
          file_name = $6,
          s3_url = $7,
          storage_location = $8
        WHERE id = $9
      `;
      
      const storageLocation = `user-files/${userId}/${userData.fileName}`;
      
      await pgClient.query(updateQuery, [
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber,
        userData.fileName,
        userData.s3Url,
        storageLocation,
        userId
      ]);
      
      console.log(`  ✅ Updated: ${userData.username} (${userData.email})`);
      console.log(`     Phone: ${userData.phoneNumber || 'No phone'}`);
      console.log(`     File: ${userData.fileName}`);
    }
    
    // Show updated data
    console.log('\n========================================');
    console.log('Verification - Updated Users:');
    console.log('========================================\n');
    
    const result = await pgClient.query(`
      SELECT id, username, first_name, last_name, email, phone_number, file_name 
      FROM users 
      ORDER BY id
    `);
    
    result.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.first_name} ${user.last_name} (${user.username})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phone_number || 'None'}`);
      console.log(`  File: ${user.file_name}`);
      console.log('');
    });
    
    console.log('✅ All users updated with correct information!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pgClient.end();
  }
}

// About the database persistence issue:
console.log('\n⚠️  IMPORTANT: Database Persistence Issue');
console.log('==========================================');
console.log('The database should NOT be reset on deployments!');
console.log('RDS (PostgreSQL) is a managed database that persists independently.');
console.log('');
console.log('Possible causes of data loss:');
console.log('1. Someone manually deleted the data');
console.log('2. The RDS instance was recreated');
console.log('3. A migration script ran that truncated tables');
console.log('');
console.log('To prevent this:');
console.log('- Never recreate the RDS instance');
console.log('- Use database migrations, not recreations');
console.log('- Enable RDS backups and snapshots');
console.log('- Use separate dev/staging/prod databases');
console.log('==========================================\n');

fixUserData();