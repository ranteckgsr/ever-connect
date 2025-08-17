require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

async function checkUserIds() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all users with their actual IDs
    const result = await client.query(`
      SELECT id, username, email, created_at, s3_url
      FROM users 
      ORDER BY id ASC
    `);

    console.log('Users in database (ordered by ID):');
    console.log('=====================================');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  S3 URL: ${user.s3_url ? user.s3_url.split('/').slice(-2).join('/') : 'None'}`);
      console.log('');
    });

    // Check the sequence
    const seqResult = await client.query(`
      SELECT last_value, is_called 
      FROM users_id_seq
    `);
    
    console.log('Sequence Information:');
    console.log('=====================');
    console.log(`Last value: ${seqResult.rows[0].last_value}`);
    console.log(`Is called: ${seqResult.rows[0].is_called}`);
    console.log(`Next ID will be: ${seqResult.rows[0].is_called ? parseInt(seqResult.rows[0].last_value) + 1 : seqResult.rows[0].last_value}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkUserIds();