const { Client } = require('pg');
const AWS = require('aws-sdk');

// Initialize S3 with the Lambda execution role (no explicit credentials needed)
// Lambda automatically provides credentials via its execution role
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'ca-central-1',
  signatureVersion: 'v4'
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
    console.log('Connected to database');

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
    console.log(`Found ${result.rows.length} users with files`);
    
    // Generate presigned URLs for each file
    const entries = await Promise.all(
      result.rows.map(async (row) => {
        try {
          // Extract the S3 key from storage_location
          let s3Key = row.storage_location;
          
          if (!s3Key && row.s3_url) {
            // Extract key from full S3 URL if storage_location is missing
            // Format: https://bucket.s3.amazonaws.com/user-files/1/file.txt
            const matches = row.s3_url.match(/\.s3[.-].*?\.amazonaws\.com\/(.+)$/);
            if (matches && matches[1]) {
              s3Key = matches[1];
            }
          }
          
          if (!s3Key) {
            console.error('No S3 key found for user:', row.first_name);
            return {
              'First Name': row.first_name,
              'Phone Number': row.phone_number || '',
              'File Upload': row.s3_url // Return original URL as fallback
            };
          }
          
          console.log(`Generating presigned URL for: ${s3Key}`);
          
          // Generate presigned URL using the Lambda's IAM role
          const signedUrl = await s3.getSignedUrlPromise('getObject', {
            Bucket: process.env.S3_BUCKET_NAME || 'everconnect-user-files',
            Key: s3Key,
            Expires: 3600 // URL valid for 1 hour
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
            'File Upload': row.s3_url // Fallback to original URL
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
        entries: entries
      })
    };

    return response;
  } catch (error) {
    console.error('Lambda Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  } finally {
    await client.end();
  }
};