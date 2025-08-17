@echo off
echo ======================================
echo EverConnect Credential Verification
echo ======================================
echo.

echo [1] Checking Local AWS CLI...
aws --version 2>nul
if %errorlevel% neq 0 (
    echo    X AWS CLI not installed
    echo    Install from: https://aws.amazon.com/cli/
) else (
    echo    OK AWS CLI is installed
)
echo.

echo [2] Checking AWS Credentials...
aws sts get-caller-identity 2>nul
if %errorlevel% neq 0 (
    echo    X AWS credentials not configured
    echo    Run: aws configure
) else (
    echo    OK AWS credentials configured
)
echo.

echo [3] Checking S3 Access...
aws s3 ls s3://everconnect-frontend --region ca-central-1 2>nul | head -1
if %errorlevel% neq 0 (
    echo    X Cannot access S3 bucket
    echo    Check IAM permissions for S3
) else (
    echo    OK S3 bucket accessible
)
echo.

echo [4] Checking Elastic Beanstalk...
aws elasticbeanstalk describe-environments --application-name everconnect-backend --region ca-central-1 2>nul | findstr "EnvironmentName"
if %errorlevel% neq 0 (
    echo    X Cannot access Elastic Beanstalk
    echo    Check IAM permissions for EB
) else (
    echo    OK Elastic Beanstalk accessible
)
echo.

echo [5] GitHub Secrets Required:
echo    - AWS_ACCESS_KEY_ID
echo    - AWS_SECRET_ACCESS_KEY  
echo    - AWS_ACCOUNT_ID
echo    - CLOUDFRONT_DISTRIBUTION_ID (optional)
echo.
echo    Set these at:
echo    https://github.com/ranteckgsr/ever-connect/settings/secrets/actions
echo.

echo [6] CloudFront Distributions:
echo    Frontend: d19uhu9egx8jfr.cloudfront.net
echo    Backend:  d3k22x6u1296cn.cloudfront.net
echo.
echo    To get Distribution IDs:
aws cloudfront list-distributions --query "DistributionList.Items[?contains(DomainName,'d19uhu9egx8jfr') || contains(DomainName,'d3k22x6u1296cn')].{Domain:DomainName,ID:Id}" --output table --region ca-central-1 2>nul
echo.

echo ======================================
echo Summary
echo ======================================
echo.
echo If all checks pass locally, the issue is with GitHub Secrets.
echo If checks fail locally, configure AWS CLI first.
echo.
pause