@echo off
echo ====================================
echo EverConnect Full Deployment Script
echo ====================================
echo.

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: AWS CLI is not configured. Please run 'aws configure' first.
    exit /b 1
)

echo [1/4] Building and packaging backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    exit /b 1
)

node create-proper-zip.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to create backend zip
    exit /b 1
)

echo.
echo [2/4] Deploying backend to Elastic Beanstalk...
echo Please deploy the backend manually:
echo 1. Go to AWS Elastic Beanstalk console
echo 2. Select environment: ec-backend-api-env
echo 3. Click "Upload and Deploy"
echo 4. Choose file: backend\everconnect-backend.zip
echo 5. Version label: phone-required-%date:~-4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%
echo 6. Click "Deploy"
echo.
pause

cd ..

echo.
echo [3/4] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    exit /b 1
)

echo.
echo [4/4] Deploying frontend to S3...
aws s3 sync dist s3://everconnect-frontend --delete --region ca-central-1
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload to S3
    exit /b 1
)

echo.
echo Creating CloudFront invalidation...
echo Please run this command with your distribution ID:
echo aws cloudfront create-invalidation --distribution-id [YOUR-DISTRIBUTION-ID] --paths "/*"
echo.
echo ====================================
echo Deployment complete!
echo ====================================
echo.
echo Test the phone number requirement:
echo.
echo Frontend: https://d19uhu9egx8jfr.cloudfront.net
echo Backend API: https://d3k22x6u1296cn.cloudfront.net
echo.
echo Try signing up without a phone number - it should fail
echo Try signing up with a phone number - it should succeed