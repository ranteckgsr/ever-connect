@echo off
echo =====================================
echo Manual Deployment Script for EverConnect
echo =====================================
echo.

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: AWS CLI is not configured.
    echo Please run 'aws configure' with your credentials:
    echo   AWS Access Key ID: [from GitHub secrets]
    echo   AWS Secret Access Key: [from GitHub secrets]
    echo   Default region: ca-central-1
    echo   Default output format: json
    echo.
    pause
    exit /b 1
)

echo AWS CLI is configured. Starting deployment...
echo.

REM Step 1: Build backend
echo [1/5] Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    cd ..
    exit /b 1
)

REM Step 2: Create deployment package
echo.
echo [2/5] Creating deployment package...
if exist everconnect-backend.zip del everconnect-backend.zip
node create-proper-zip.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to create deployment package
    cd ..
    exit /b 1
)

echo.
echo [3/5] Backend package created: everconnect-backend.zip
echo.
echo Please deploy the backend manually:
echo   1. Go to AWS Elastic Beanstalk console
echo   2. Select environment: ec-backend-api-env
echo   3. Click "Upload and Deploy"
echo   4. Choose file: backend\everconnect-backend.zip
echo   5. Version label: manual-deploy-%date:~-4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%
echo   6. Click "Deploy"
echo.
echo Press any key after backend deployment is complete...
pause >nul

cd ..

REM Step 4: Build frontend
echo.
echo [4/5] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    exit /b 1
)

REM Step 5: Deploy frontend to S3
echo.
echo [5/5] Deploying frontend to S3...
aws s3 sync dist s3://everconnect-frontend --delete --region ca-central-1
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload to S3
    echo Make sure you have access to the S3 bucket: everconnect-frontend
    exit /b 1
)

echo.
echo Creating CloudFront invalidation...
echo Please get your CloudFront distribution ID from the AWS Console
echo (CloudFront > Distributions > look for d19uhu9egx8jfr.cloudfront.net)
echo.
set /p DIST_ID="Enter CloudFront Distribution ID (or press Enter to skip): "

if not "%DIST_ID%"=="" (
    aws cloudfront create-invalidation --distribution-id %DIST_ID% --paths "/*" --region ca-central-1
    echo CloudFront cache invalidated
) else (
    echo Skipped CloudFront invalidation
)

echo.
echo =====================================
echo Deployment Complete!
echo =====================================
echo.
echo Frontend: https://d19uhu9egx8jfr.cloudfront.net
echo Backend: https://d3k22x6u1296cn.cloudfront.net
echo.
echo Test the phone number requirement:
echo 1. Go to https://d19uhu9egx8jfr.cloudfront.net
echo 2. Click Sign Up
echo 3. Try to submit without phone number - should fail
echo 4. Add phone number - should succeed
echo.
pause