const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Client } = require('pg');
const https = require('https');
require('dotenv').config({ path: '../.env' });

// Initialize S3 client with credentials for local testing
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function testPresignedUrls() {
  console.log('🔍 Testing Presigned URL Generation and Access\n');
  console.log('Using AWS Region:', process.env.AWS_REGION || 'ca-central-1');
  console.log('S3 Bucket:', process.env.S3_BUCKET_NAME || 'everconnect-user-files');
  console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
  console.log('AWS Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
  console.log('');

  // Connect to database
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false } // Always use SSL for RDS
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Query users with files
    const query = `
      SELECT 
        first_name,
        phone_number,
        storage_location,
        s3_url
      FROM users 
      WHERE s3_url IS NOT NULL 
      ORDER BY created_at DESC
      LIMIT 3
    `;

    const result = await client.query(query);
    console.log(`Found ${result.rows.length} users with files to test\n`);

    if (result.rows.length === 0) {
      console.log('No users with files found in database');
      return;
    }

    // Test presigned URL for each user
    for (const row of result.rows) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Testing: ${row.first_name}`);
      console.log(`Phone: ${row.phone_number || 'N/A'}`);
      
      // Extract S3 key
      let s3Key = row.storage_location;
      
      if (!s3Key && row.s3_url) {
        // Extract key from S3 URL
        const urlParts = row.s3_url.split('.s3.amazonaws.com/');
        if (urlParts.length > 1) {
          s3Key = urlParts[1];
        } else {
          // Try alternative format
          const matches = row.s3_url.match(/\.s3[.-].*?\.amazonaws\.com\/(.+)$/);
          if (matches && matches[1]) {
            s3Key = matches[1];
          }
        }
      }
      
      if (!s3Key) {
        console.log('❌ No S3 key found');
        continue;
      }
      
      console.log(`S3 Key: ${s3Key}`);
      
      try {
        // Generate presigned URL
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'everconnect-user-files',
          Key: s3Key
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, { 
          expiresIn: 3600 // 1 hour
        });
        
        console.log(`\n✅ Presigned URL generated successfully`);
        console.log(`URL (first 100 chars): ${signedUrl.substring(0, 100)}...`);
        
        // Test if URL is accessible
        console.log(`\nTesting URL access...`);
        const testResult = await testUrlAccess(signedUrl);
        
        if (testResult.success) {
          console.log(`✅ URL is accessible!`);
          console.log(`   Status: ${testResult.statusCode}`);
          console.log(`   Content-Type: ${testResult.contentType}`);
          console.log(`   Content-Length: ${testResult.contentLength} bytes`);
          if (testResult.preview) {
            console.log(`   Preview (first 200 chars):`);
            console.log(`   "${testResult.preview}"`);
          }
        } else {
          console.log(`❌ URL is NOT accessible`);
          console.log(`   Error: ${testResult.error}`);
        }
        
      } catch (error) {
        console.log(`❌ Error generating presigned URL: ${error.message}`);
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.end();
  }
}

// Helper function to test if a URL is accessible
function testUrlAccess(url) {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        if (data.length < 1000) { // Only collect first 1KB for preview
          data += chunk;
        }
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve({
            success: true,
            statusCode: response.statusCode,
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length'],
            preview: data.substring(0, 200).replace(/\n/g, ' ')
          });
        } else {
          resolve({
            success: false,
            statusCode: response.statusCode,
            error: `HTTP ${response.statusCode}: ${data.substring(0, 200)}`
          });
        }
      });
    }).on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
  });
}

// Run the test
testPresignedUrls().catch(console.error);