require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

async function fixSequence() {
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

    // Get the maximum ID from users table
    const maxResult = await client.query('SELECT MAX(id) as max_id FROM users');
    const maxId = maxResult.rows[0].max_id || 0;
    
    console.log(`Current maximum user ID: ${maxId}`);
    
    // Reset the sequence to the correct value
    const resetQuery = `ALTER SEQUENCE users_id_seq RESTART WITH ${maxId + 1}`;
    await client.query(resetQuery);
    
    console.log(`✅ Sequence reset to start at ${maxId + 1}`);
    
    // Verify the fix
    const seqResult = await client.query(`
      SELECT last_value, is_called 
      FROM users_id_seq
    `);
    
    console.log('\nNew Sequence Information:');
    console.log('=========================');
    console.log(`Last value: ${seqResult.rows[0].last_value}`);
    console.log(`Next ID will be: ${maxId + 1}`);
    
    console.log('\n✅ Sequence fixed successfully!');
    console.log('New users will now get sequential IDs starting from', maxId + 1);

  } catch (error) {
    console.error('Error fixing sequence:', error);
  } finally {
    await client.end();
  }
}

fixSequence();