@echo off
echo Creating Lambda deployment package with signed URL support...

REM Delete old zip if exists
if exist lambda-signed-urls.zip del lambda-signed-urls.zip

REM Create zip with all necessary files
powershell -Command "Compress-Archive -Path getUsersData.js, package.json, package-lock.json, node_modules -DestinationPath lambda-signed-urls.zip"

echo.
echo Lambda package created: lambda-signed-urls.zip
echo.
echo This package includes:
echo - getUsersData.js (main handler with signed URL support)
echo - package.json (with AWS SDK dependencies)
echo - node_modules (pg, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
echo.
echo Deploy this to Lambda function: getUsersData
echo Handler: getUsersData.handler
echo.