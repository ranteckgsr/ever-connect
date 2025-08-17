// Script to check database configuration and find where data is
require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

async function checkDatabases() {
  console.log('\n========================================');
  console.log('Database Configuration Check');
  console.log('========================================\n');
  
  console.log('Current .env configuration:');
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Database: ${process.env.DB_NAME}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log(`  Port: ${process.env.DB_PORT}\n`);

  // First, connect to postgres database to list all databases
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: 'postgres',  // Connect to default postgres database
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to RDS instance...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // List all databases
    console.log('📊 Available Databases:');
    console.log('----------------------------------------');
    const dbResult = await client.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `);
    
    for (const row of dbResult.rows) {
      console.log(`  - ${row.datname}`);
    }
    
    await client.end();

    // Now check each database for users table
    console.log('\n🔍 Checking for users table in each database:');
    console.log('----------------------------------------');
    
    for (const row of dbResult.rows) {
      if (row.datname === 'rdsadmin') continue; // Skip AWS system database
      
      const testClient = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: row.datname,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
          rejectUnauthorized: false
        }
      });

      try {
        await testClient.connect();
        
        // Check if users table exists
        const tableResult = await testClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          )
        `);
        
        if (tableResult.rows[0].exists) {
          // Count users in this database
          const countResult = await testClient.query('SELECT COUNT(*) FROM users');
          const count = countResult.rows[0].count;
          
          console.log(`\n✅ Database: ${row.datname}`);
          console.log(`   Has users table with ${count} records`);
          
          if (count > 0) {
            // Show sample users
            const usersResult = await testClient.query(`
              SELECT id, username, email, created_at 
              FROM users 
              ORDER BY created_at DESC 
              LIMIT 3
            `);
            
            console.log('   Recent users:');
            usersResult.rows.forEach(user => {
              console.log(`     - ID ${user.id}: ${user.email} (${new Date(user.created_at).toLocaleDateString()})`);
            });
          }
        } else {
          console.log(`\n❌ Database: ${row.datname}`);
          console.log(`   No users table found`);
        }
        
        await testClient.end();
      } catch (err) {
        console.log(`\n⚠️  Database: ${row.datname}`);
        console.log(`   Error: ${err.message}`);
        await testClient.end();
      }
    }

    console.log('\n\n📝 Recommendation:');
    console.log('----------------------------------------');
    console.log('If your data is in a different database than configured,');
    console.log('update DB_NAME in backend/.env to the correct database name.');
    console.log('\nFor example, if data is in "everconnect_db", change:');
    console.log('  DB_NAME=postgres');
    console.log('to:');
    console.log('  DB_NAME=everconnect_db');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabases();