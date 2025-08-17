// Restore the ORIGINAL users from August 9th
require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const pgClient = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'everconnect-user-files';

// Original users based on S3 files from August 9th
const originalUsers = [
  {
    id: 3,
    phoneNumber: '17807103313',
    fileName: '17807103313-john_mike_chat.txt',
    firstName: 'John',
    lastName: 'User',
    date: '2025-08-09'
  },
  {
    id: 4,
    phoneNumber: '17807103313', 
    fileName: '17807103313-john_mike_chat.txt',
    firstName: 'John',
    lastName: 'Mike',
    date: '2025-08-09'
  },
  {
    id: 5,
    phoneNumber: '15551112356',
    fileName: '15551112356-jasjit_mike_chat.txt',
    firstName: 'Jasjit',
    lastName: 'Mike',
    date: '2025-08-09'
  }
];

async function restoreOriginalUsers() {
  console.log('\n========================================');
  console.log('Restoring Original Users from August 9');
  console.log('========================================\n');

  try {
    await pgClient.connect();
    
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    for (const user of originalUsers) {
      // Check if user already exists with correct data
      const existing = await pgClient.query(
        'SELECT id, first_name, s3_url FROM users WHERE id = $1',
        [user.id]
      );
      
      if (existing.rows.length > 0) {
        const current = existing.rows[0];
        // Check if it's a test user that needs to be replaced
        if (current.first_name === 'Test' || current.first_name === 'Restored') {
          console.log(`User ID ${user.id}: Replacing test user with original data`);
          
          // Update with original user data
          const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/user-files/${user.id}/${user.fileName}`;
          const storageLocation = `user-files/${user.id}/${user.fileName}`;
          
          await pgClient.query(`
            UPDATE users SET
              username = $2,
              email = $3,
              first_name = $4,
              last_name = $5,
              phone_number = $6,
              file_name = $7,
              storage_location = $8,
              s3_url = $9,
              created_at = $10
            WHERE id = $1
          `, [
            user.id,
            `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`,
            `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@example.com`,
            user.firstName,
            user.lastName,
            `+${user.phoneNumber}`,
            user.fileName,
            storageLocation,
            s3Url,
            new Date(user.date)
          ]);
          
          console.log(`  ✅ Restored: ${user.firstName} ${user.lastName}`);
          console.log(`     Phone: +${user.phoneNumber}`);
          console.log(`     File: ${user.fileName}`);
        } else {
          console.log(`User ID ${user.id}: Already has real data (${current.first_name})`);
        }
      } else {
        // User doesn't exist, create it
        console.log(`User ID ${user.id}: Creating new user`);
        
        const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/user-files/${user.id}/${user.fileName}`;
        const storageLocation = `user-files/${user.id}/${user.fileName}`;
        
        await pgClient.query(`
          INSERT INTO users (
            id, username, email, first_name, last_name,
            phone_number, password_hash, file_name,
            storage_location, s3_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          user.id,
          `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}`,
          `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@example.com`,
          user.firstName,
          user.lastName,
          `+${user.phoneNumber}`,
          passwordHash,
          user.fileName,
          storageLocation,
          s3Url,
          new Date(user.date)
        ]);
        
        console.log(`  ✅ Created: ${user.firstName} ${user.lastName}`);
        console.log(`     Phone: +${user.phoneNumber}`);
        console.log(`     File: ${user.fileName}`);
      }
      console.log('');
    }
    
    // Fix sequence
    const maxId = await pgClient.query('SELECT MAX(id) as max_id FROM users');
    const nextId = (maxId.rows[0].max_id || 0) + 1;
    await pgClient.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${nextId}`);
    console.log(`✅ Sequence set to start at ${nextId}\n`);
    
    // Show final status
    const result = await pgClient.query(`
      SELECT id, first_name, last_name, email, phone_number, file_name
      FROM users
      WHERE id IN (3, 4, 5)
      ORDER BY id
    `);
    
    console.log('Original Users Restored:');
    console.log('========================');
    result.rows.forEach(u => {
      console.log(`ID ${u.id}: ${u.first_name} ${u.last_name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Phone: ${u.phone_number}`);
      console.log(`  File: ${u.file_name}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pgClient.end();
  }
}

restoreOriginalUsers();