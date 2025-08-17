#!/bin/bash
# Initialize LocalStack AWS services

echo "Initializing LocalStack AWS services..."

# Wait for LocalStack to be ready
sleep 5

# Create S3 bucket for user files
awslocal s3api create-bucket \
    --bucket everconnect-user-files \
    --region ca-central-1 \
    --create-bucket-configuration LocationConstraint=ca-central-1 2>/dev/null || true

# Set bucket CORS configuration
awslocal s3api put-bucket-cors \
    --bucket everconnect-user-files \
    --cors-configuration '{
        "CORSRules": [{
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": ["http://localhost:3000", "http://localhost:8080"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }]
    }'

# Create test files in S3
echo "Test file content" | awslocal s3 cp - s3://everconnect-user-files/test/test-file.txt

echo "LocalStack AWS services initialized successfully!"