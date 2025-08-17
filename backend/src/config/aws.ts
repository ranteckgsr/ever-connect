import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

// Check if we're using LocalStack for local development/testing
const isLocalStack = process.env.USE_LOCALSTACK === 'true';
const awsEndpoint = process.env.AWS_ENDPOINT;

const s3Config: any = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

// Add LocalStack endpoint if configured
if (isLocalStack && awsEndpoint) {
  s3Config.endpoint = awsEndpoint;
  s3Config.forcePathStyle = true;
}

export const s3Client = new S3Client(s3Config);

export const sesClient = new SESClient({
  region: process.env.SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'everconnect-user-files';