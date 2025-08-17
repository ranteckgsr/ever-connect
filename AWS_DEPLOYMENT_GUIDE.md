# AWS Deployment Guide for EverConnect

## Prerequisites
- AWS CLI installed and configured
- EB CLI installed (`pip install awsebcli`)
- Node.js 18.x installed locally

## Production URLs

- **Frontend (CloudFront):** https://d19uhu9egx8jfr.cloudfront.net
- **Backend API (CloudFront):** https://d3k22x6u1296cn.cloudfront.net
- **Backend (Elastic Beanstalk):** http://ec-backend-api-env.eba-dfxkd93z.ca-central-1.elasticbeanstalk.com

## Backend Deployment to Elastic Beanstalk

### 1. Prepare the Backend for Deployment

```bash
cd backend
# Build the TypeScript code
npm run build

# Copy package-eb.json to package.json for deployment
cp package-eb.json package.json

# Create deployment zip
zip -r everconnect-backend.zip . -x "*.git*" -x "node_modules/*" -x "*.env" -x "*.log" -x "test-*" -x "*.md"
```

### 2. Create Elastic Beanstalk Application

#### Option A: Using EB CLI (Recommended)
```bash
cd backend
eb init -p node.js-18 everconnect-backend --region ca-central-1
eb create everconnect-backend-env
```

#### Option B: Using AWS Console
1. Go to AWS Elastic Beanstalk Console
2. Click "Create Application"
3. Application name: `everconnect-backend`
4. Platform: Node.js 18
5. Upload your code: Choose the `everconnect-backend.zip` file
6. Click "Create application"

### 3. Configure Environment Variables

In the Elastic Beanstalk console:
1. Go to your environment
2. Click "Configuration" → "Software" → "Edit"
3. Add these environment variables:

```
DB_HOST=your-rds-endpoint.ca-central-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-db-user
DB_PASSWORD=your-db-password
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=everconnect-user-files
JWT_SECRET=your-jwt-secret
PORT=8080
```

4. Click "Apply"

### 4. Configure Security Group
1. In Configuration → Instances → Edit
2. Add your RDS security group to allow database connection
3. Apply changes

### 5. Get Your Backend URL
Your backend will be available at:
`http://everconnect-backend-env.eba-xxxxxxxx.ca-central-1.elasticbeanstalk.com`

## Frontend Deployment to S3 + CloudFront

### 1. Build the Frontend

```bash
cd .. # Back to root directory

# Update the API URL in .env
echo "VITE_API_URL=http://your-eb-url.elasticbeanstalk.com" > .env

# Build the frontend
npm run build
```

### 2. Create S3 Bucket for Frontend

```bash
# Create bucket
aws s3 mb s3://everconnect-frontend --region ca-central-1

# Enable static website hosting
aws s3 website s3://everconnect-frontend \
  --index-document index.html \
  --error-document index.html
```

### 3. Create Bucket Policy

Create `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::everconnect-frontend/*"
    }
  ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-policy \
  --bucket everconnect-frontend \
  --policy file://bucket-policy.json
```

### 4. Upload Frontend to S3

```bash
# Upload built files
aws s3 sync dist/ s3://everconnect-frontend --delete

# Set cache headers for assets
aws s3 cp s3://everconnect-frontend s3://everconnect-frontend \
  --exclude "*" \
  --include "*.js" --include "*.css" \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000"
```

### 5. Create CloudFront Distribution

1. Go to CloudFront Console
2. Click "Create Distribution"
3. Origin Settings:
   - Origin Domain: `everconnect-frontend.s3.amazonaws.com`
   - S3 bucket access: Yes use OAI
   - Create new OAI
4. Default Cache Behavior:
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD
5. Distribution Settings:
   - Price Class: Use only North America and Europe
   - Default Root Object: `index.html`
6. Create custom error pages:
   - 403 → /index.html (200 response)
   - 404 → /index.html (200 response)

### 6. Update Frontend with CloudFront URL

Once CloudFront is created:
1. Get your CloudFront URL: `https://dxxxxxxxxx.cloudfront.net`
2. Update backend CORS to allow this origin
3. Your frontend is now live!

## Post-Deployment Tasks

### 1. Update Backend CORS
Add your CloudFront URL to the backend CORS configuration.

### 2. Configure Custom Domain (Optional)
1. In Route 53, create A record pointing to CloudFront
2. In CloudFront, add alternate domain name
3. Add SSL certificate from ACM

### 3. Enable HTTPS for Backend
1. In Elastic Beanstalk, configure load balancer
2. Add HTTPS listener with ACM certificate
3. Update frontend to use HTTPS API URL

## Monitoring

### CloudWatch Logs
- Backend logs: Elastic Beanstalk → Logs
- Monitor errors and performance

### Set Up Alarms
1. High CPU usage
2. High error rate
3. Database connection failures

## Cost Optimization

1. **S3**: Enable lifecycle policies for old files
2. **CloudFront**: Monitor data transfer costs
3. **Elastic Beanstalk**: Use t3.micro for testing, scale as needed
4. **RDS**: Consider reserved instances for production

## Deployment Commands Summary

### Backend Update
```bash
cd backend
npm run build
eb deploy
```

### Frontend Update
```bash
npm run build
aws s3 sync dist/ s3://everconnect-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```