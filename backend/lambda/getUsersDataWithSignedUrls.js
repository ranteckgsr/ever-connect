const { Client } = require('pg');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

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
        storage_location,
        s3_url
      FROM users 
      WHERE s3_url IS NOT NULL 
      ORDER BY created_at DESC
    `;

    const result = await client.query(query);
    
    // Generate presigned URLs for each file
    const entriesWithSignedUrls = await Promise.all(
      result.rows.map(async (row) => {
        try {
          // Extract the S3 key from storage_location or s3_url
          let s3Key = row.storage_location;
          
          if (!s3Key && row.s3_url) {
            // Extract key from full S3 URL
            // Format: https://bucket.s3.amazonaws.com/user-files/1/file.txt
            const urlParts = row.s3_url.split('.s3.amazonaws.com/');
            if (urlParts.length > 1) {
              s3Key = urlParts[1];
            }
          }
          
          if (!s3Key) {
            console.error('No S3 key found for user:', row.first_name);
            return {
              'First Name': row.first_name,
              'Phone Number': row.phone_number || '',
              'File Upload': row.s3_url // Fallback to direct URL
            };
          }
          
          // Generate presigned URL (valid for 1 hour)
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || 'everconnect-user-files',
            Key: s3Key
          });
          
          const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600 // 1 hour
          });
          
          return {
            'First Name': row.first_name,
            'Phone Number': row.phone_number || '',
            'File Upload': signedUrl
          };
        } catch (error) {
          console.error('Error generating signed URL for', row.first_name, ':', error);
          return {
            'First Name': row.first_name,
            'Phone Number': row.phone_number || '',
            'File Upload': row.s3_url // Fallback to direct URL
          };
        }
      })
    );

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        entries: entriesWithSignedUrls
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