// Script to view data in RDS PostgreSQL database
require('dotenv').config({ path: '../backend/.env' });
const { Client } = require('pg');

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

async function viewDatabase() {
  try {
    console.log('\n========================================');
    console.log('EverConnect Database Viewer');
    console.log('========================================\n');
    
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to:', process.env.DB_HOST);
    console.log('');

    // Get total users count
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Total Users: ${countResult.rows[0].count}`);
    console.log('');

    // Get all users with their details
    console.log('👥 User List:');
    console.log('----------------------------------------');
    
    const usersResult = await client.query(`
      SELECT 
        id,
        username,
        first_name,
        last_name,
        email,
        phone_number,
        file_name,
        created_at,
        CASE 
          WHEN s3_url IS NOT NULL THEN '✅ Yes'
          ELSE '❌ No'
        END as has_file
      FROM users 
      ORDER BY created_at DESC
    `);

    if (usersResult.rows.length === 0) {
      console.log('No users found in database.');
    } else {
      usersResult.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Username: ${user.username}`);
        console.log(`   📱 Phone: ${user.phone_number || 'Not provided'}`);
        console.log(`   📎 File: ${user.file_name || 'No file'}`);
        console.log(`   📁 Has Upload: ${user.has_file}`);
        console.log(`   📅 Joined: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }

    // Show recent signups
    console.log('\n\n📈 Recent Activity (Last 5 Signups):');
    console.log('----------------------------------------');
    
    const recentResult = await client.query(`
      SELECT 
        first_name || ' ' || last_name as name,
        created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    recentResult.rows.forEach(user => {
      const date = new Date(user.created_at);
      console.log(`   ${user.name} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    });

    // Show file statistics
    console.log('\n\n📊 File Upload Statistics:');
    console.log('----------------------------------------');
    
    const fileStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE s3_url IS NOT NULL) as with_files,
        COUNT(*) FILTER (WHERE s3_url IS NULL) as without_files,
        COUNT(DISTINCT DATE(created_at)) as days_active
      FROM users
    `);

    const stats = fileStats.rows[0];
    console.log(`   Users with files: ${stats.with_files}`);
    console.log(`   Users without files: ${stats.without_files}`);
    console.log(`   Days active: ${stats.days_active}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Cannot connect to database. Check:');
      console.error('   1. RDS instance is running');
      console.error('   2. Security group allows your IP');
      console.error('   3. Credentials in backend/.env are correct');
    }
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

viewDatabase();