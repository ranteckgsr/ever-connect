# CI/CD Setup Guide for EverConnect

## Prerequisites

1. AWS Account with appropriate permissions
2. GitHub repository with the EverConnect code
3. AWS services already created (EB, S3, CloudFront, RDS)

## GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

### Required Secrets

1. **AWS_ACCESS_KEY_ID**
   - Create an IAM user with programmatic access
   - Required permissions:
     - ElasticBeanstalk: Full access to your application
     - S3: Full access to your buckets
     - CloudFront: CreateInvalidation permission
     - Lambda: UpdateFunctionCode (if deploying Lambda)

2. **AWS_SECRET_ACCESS_KEY**
   - The secret key for the IAM user created above

3. **AWS_ACCOUNT_ID**
   - Your 12-digit AWS account ID
   - Find it in AWS Console → Account dropdown

4. **CLOUDFRONT_DISTRIBUTION_ID**
   - The distribution ID for your frontend CloudFront
   - Find it in CloudFront console
   - Example: E1ABCDEF123456

## IAM Policy for CI/CD User

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:CreateApplicationVersion",
        "elasticbeanstalk:UpdateEnvironment",
        "elasticbeanstalk:DescribeEnvironments",
        "elasticbeanstalk:DescribeApplicationVersions"
      ],
      "Resource": [
        "arn:aws:elasticbeanstalk:ca-central-1:*:application/everconnect-backend",
        "arn:aws:elasticbeanstalk:ca-central-1:*:environment/everconnect-backend/ec-backend-api-env",
        "arn:aws:elasticbeanstalk:ca-central-1:*:applicationversion/everconnect-backend/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::elasticbeanstalk-ca-central-1-*/*",
        "arn:aws:s3:::everconnect-frontend",
        "arn:aws:s3:::everconnect-frontend/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode"
      ],
      "Resource": "arn:aws:lambda:ca-central-1:*:function:getUsersData"
    }
  ]
}
```

## Workflow Triggers

The CI/CD pipeline triggers on:
- **Push to main branch**: Automatic deployment
- **Manual trigger**: Via GitHub Actions tab (includes Lambda deployment)

## Deployment Process

### Automatic (on push to main):
1. Backend builds and deploys to Elastic Beanstalk
2. Frontend builds and deploys to S3
3. CloudFront cache is invalidated
4. Health checks verify deployment

### Manual (workflow_dispatch):
- All automatic steps plus Lambda function update

## Environment Variables

The pipeline uses these environment variables:
- `VITE_API_URL`: Set to CloudFront backend URL during build
- Backend environment variables are managed in Elastic Beanstalk console

## Testing the Pipeline

1. Make a small change to the code
2. Commit and push to main:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Watch the Actions tab in GitHub
4. Verify deployment at:
   - Frontend: https://d19uhu9egx8jfr.cloudfront.net
   - Backend: https://d3k22x6u1296cn.cloudfront.net/health

## Rollback Process

If deployment fails:
1. **Elastic Beanstalk**: Use console to deploy previous version
2. **S3/CloudFront**: Keep previous build artifacts, manually sync if needed
3. **Lambda**: Use console to deploy previous version

## Monitoring

- **GitHub Actions**: Check workflow runs in Actions tab
- **CloudWatch**: Monitor EB application logs
- **CloudFront**: Check cache hit ratio and errors

## Troubleshooting

### Common Issues:

1. **AWS Credentials Error**
   - Verify secrets are correctly set in GitHub
   - Check IAM permissions

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

3. **Deployment Timeout**
   - Check EB environment health
   - Verify security groups and network settings

4. **Frontend Not Updating**
   - Ensure CloudFront invalidation completed
   - Check browser cache (try incognito mode)

## Local Testing Before Push

```bash
# Test backend build
cd backend
npm run build
node create-proper-zip.js

# Test frontend build
cd ..
npm run build

# Run tests if available
npm test
```

## Security Best Practices

1. Never commit AWS credentials to repository
2. Use least-privilege IAM policies
3. Rotate access keys regularly
4. Enable MFA for AWS account
5. Review GitHub Actions logs for sensitive data

## Cost Optimization

- The pipeline uses minimal resources
- S3 sync only uploads changed files
- CloudFront invalidation is limited to necessary paths
- Consider using GitHub Actions cache for dependencies

## Next Steps

1. Add automated testing before deployment
2. Implement staging environment
3. Add rollback automation
4. Set up deployment notifications (Slack/email)
5. Add performance testing
6. Implement blue-green deployments