// Fix passwords for restored users
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

async function fixPasswords() {
  console.log('Fixing passwords for restored users...\n');
  
  try {
    await pgClient.connect();
    
    // Get users who might need password fixes (restored users)
    const users = await pgClient.query(`
      SELECT id, username, email, first_name, last_name, password_hash
      FROM users
      WHERE id IN (3, 4, 5)
      ORDER BY id
    `);
    
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    for (const user of users.rows) {
      console.log(`Fixing password for ${user.first_name} ${user.last_name} (${user.username})`);
      
      // Update password hash
      await pgClient.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, user.id]
      );
      
      console.log(`  ✅ Password updated`);
      console.log(`  Can now login with:`);
      console.log(`    Username: ${user.username} OR ${user.email}`);
      console.log(`    Password: ${defaultPassword}\n`);
    }
    
    console.log('All restored users can now login with password: Password123!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pgClient.end();
  }
}

fixPasswords();