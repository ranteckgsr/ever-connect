@echo off
echo ======================================
echo Troubleshooting Deployment Issues
echo ======================================
echo.

echo Checking GitHub Actions deployment failure...
echo.

echo The deployment is failing at the Elastic Beanstalk step.
echo This could be because:
echo.

echo 1. AWS_ACCOUNT_ID secret might be wrong or missing
echo    - Make sure it's exactly 12 digits
echo    - Example: 123456789012
echo.

echo 2. The S3 bucket for EB might not exist
echo    Run this command locally to check:
echo    aws s3 ls s3://elasticbeanstalk-ca-central-1-YOUR_ACCOUNT_ID
echo.

echo 3. Application or environment name might be wrong
echo    - Application should be: everconnect-backend
echo    - Environment should be: ec-backend-api-env
echo.

echo ======================================
echo Manual Deployment Option
echo ======================================
echo.
echo Since GitHub Actions is having issues, you can deploy manually:
echo.

echo BACKEND:
echo 1. The backend is already built in: backend\everconnect-backend.zip
echo 2. Go to AWS Elastic Beanstalk console
echo 3. Select "ec-backend-api-env" environment
echo 4. Click "Upload and Deploy"
echo 5. Upload the zip file
echo.

echo FRONTEND:
echo 1. Build the frontend: npm run build
echo 2. Upload to S3: aws s3 sync dist s3://everconnect-frontend --delete --region ca-central-1
echo 3. Clear cache: aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
echo.

echo ======================================
echo To check your secrets in GitHub:
echo ======================================
echo.
echo Go to: https://github.com/ranteckgsr/ever-connect/settings/secrets/actions
echo.
echo You should have:
echo - AWS_ACCESS_KEY_ID (starts with AKIA...)
echo - AWS_SECRET_ACCESS_KEY (40 characters)
echo - AWS_ACCOUNT_ID (exactly 12 digits)
echo - CLOUDFRONT_DISTRIBUTION_ID (optional, starts with E...)
echo.
pause