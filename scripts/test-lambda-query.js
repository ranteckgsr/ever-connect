const { Client } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

async function testLambdaQuery() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!\n');

    // First, check what columns exist
    console.log('=== Checking table structure ===');
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    const schemaResult = await client.query(schemaQuery);
    console.log('Columns in users table:');
    schemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // Check total number of users
    console.log('\n=== Checking data ===');
    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const countResult = await client.query(countQuery);
    console.log(`Total users: ${countResult.rows[0].total}`);

    // Check users with s3_url
    const s3CountQuery = 'SELECT COUNT(*) as total FROM users WHERE s3_url IS NOT NULL';
    const s3CountResult = await client.query(s3CountQuery);
    console.log(`Users with s3_url: ${s3CountResult.rows[0].total}`);

    // Check users with empty/null s3_url
    const nullS3Query = 'SELECT COUNT(*) as total FROM users WHERE s3_url IS NULL OR s3_url = \'\'';
    const nullS3Result = await client.query(nullS3Query);
    console.log(`Users without s3_url: ${nullS3Result.rows[0].total}`);

    // Run the exact Lambda query
    console.log('\n=== Running Lambda query ===');
    const lambdaQuery = `
      SELECT 
        first_name,
        phone_number,
        s3_url as file_upload
      FROM users 
      WHERE s3_url IS NOT NULL 
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(lambdaQuery);
    console.log(`Lambda query returned ${result.rows.length} rows`);
    
    if (result.rows.length > 0) {
      console.log('\nFirst 3 results:');
      result.rows.slice(0, 3).forEach((row, i) => {
        console.log(`${i + 1}. ${row.first_name} | ${row.phone_number || 'No phone'} | ${row.file_upload}`);
      });
    }

    // Check sample of all users
    console.log('\n=== Sample of ALL users (first 5) ===');
    const allUsersQuery = 'SELECT id, username, first_name, email, s3_url, created_at FROM users ORDER BY id LIMIT 5';
    const allUsers = await client.query(allUsersQuery);
    allUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.username} - s3_url: ${user.s3_url ? 'YES' : 'NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

testLambdaQuery();