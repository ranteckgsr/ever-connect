const { Client } = require('pg');

exports.handler = async (event) => {
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
    await client.connect();

    // Query to get all users with uploaded files
    const query = `
      SELECT 
        first_name,
        phone_number,
        s3_url as file_upload
      FROM users 
      WHERE s3_url IS NOT NULL 
      AND email_verified = true
      ORDER BY created_at DESC
    `;

    const result = await client.query(query);

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        entries: result.rows.map(row => ({
          'First Name': row.first_name,
          'Phone Number': row.phone_number || '',
          'File Upload': row.file_upload
        }))
      })
    };

    return response;
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    await client.end();
  }
};