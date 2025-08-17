# Custom Domain Setup for CloudFront - AWS Console Guide

## Your Domain: www.everconnect.ca

## Prerequisites
- Domain purchased (everconnect.ca)
- Route 53 hosted zone created for everconnect.ca

## Step 1: Request SSL Certificate in ACM (us-east-1)

**CRITICAL**: Certificate MUST be in **US East (N. Virginia) us-east-1** region for CloudFront!

1. **Switch to us-east-1 region**:
   - In AWS Console, click region dropdown (top right)
   - Select **US East (N. Virginia) us-east-1**

2. **Go to AWS Certificate Manager (ACM)**:
   - Search for "Certificate Manager" in AWS Console
   - Click "Request certificate"
   - Select "Request a public certificate" → Next

3. **Add domain names**:
   - Domain name 1: `www.everconnect.ca`
   - Click "Add another name to this certificate"
   - Domain name 2: `everconnect.ca` (for apex domain redirect)
   - Click Next

4. **Select validation method**:
   - Choose "DNS validation" (recommended)
   - Click Next

5. **Review and request**:
   - Review your domains
   - Click "Confirm and request"
   - **IMPORTANT**: Copy the Certificate ARN for later use

## Step 2: Validate Certificate via DNS

1. **In ACM Console** (still in us-east-1):
   - Click on your certificate request
   - You'll see "Pending validation" status
   - Under "Domains" section, click "Create records in Route 53"
   - Select both domains (www.everconnect.ca and everconnect.ca)
   - Click "Create records"
   - This automatically creates CNAME validation records

2. **Wait for validation**:
   - Takes 5-30 minutes typically
   - Status will change from "Pending validation" to "Issued"
   - You'll receive an email confirmation

## Step 3: Update CloudFront Distribution

1. **Go to CloudFront Console**:
   - Search for "CloudFront" in AWS Console
   - Find your frontend distribution: `d19uhu9egx8jfr.cloudfront.net`
   - Click on the distribution ID

2. **Edit General Settings**:
   - Click "Edit" in General tab
   - Under "Settings" section:
   
   **Alternate domain names (CNAMEs)**:
   - Click "Add item"
   - Add: `www.everconnect.ca`
   - Click "Add item" again
   - Add: `everconnect.ca`
   
   **Custom SSL certificate**:
   - Select your certificate from dropdown (it will show if validated)
   - The certificate will be listed as "www.everconnect.ca (CERTIFICATE_ID)"
   
   - Leave other settings as default
   - Click "Save changes"

3. **Wait for deployment**:
   - Status will show "Deploying"
   - Takes 15-20 minutes to fully deploy globally

## Step 4: Create Route 53 Records

1. **Go to Route 53 Console**:
   - Search for "Route 53" in AWS Console
   - Click "Hosted zones"
   - Click on `everconnect.ca`

2. **Create A record for www.everconnect.ca**:
   - Click "Create record"
   - **Record name**: `www`
   - **Record type**: A
   - **Toggle ON** "Alias"
   - **Route traffic to**: 
     - Choose "Alias to CloudFront distribution"
     - Select your distribution `d19uhu9egx8jfr.cloudfront.net`
   - Click "Create records"

3. **Create A record for apex domain (everconnect.ca)**:
   - Click "Create record"
   - **Record name**: Leave empty (for apex domain)
   - **Record type**: A
   - **Toggle ON** "Alias"
   - **Route traffic to**:
     - Choose "Alias to CloudFront distribution"
     - Select your distribution `d19uhu9egx8jfr.cloudfront.net`
   - Click "Create records"

## Step 5: Setup Backend API Domain (Optional)

If you want `api.everconnect.ca`:

1. **Update Certificate** (if not included initially):
   - Go back to ACM in us-east-1
   - Request new certificate or add domain to existing

2. **Update Backend CloudFront**:
   - Distribution: `d3k22x6u1296cn.cloudfront.net`
   - Add alternate domain: `api.everconnect.ca`
   - Select SSL certificate

3. **Create Route 53 A record**:
   - Record name: `api`
   - Type: A (Alias)
   - Target: `d3k22x6u1296cn.cloudfront.net`

## Step 6: Update Application Configuration

Once domain is working:

1. **Update frontend environment**:
   ```bash
   # In frontend .env
   VITE_API_URL=https://api.everconnect.ca
   # OR if not using custom API domain:
   VITE_API_URL=https://d3k22x6u1296cn.cloudfront.net
   ```

2. **Rebuild and deploy frontend**:
   ```bash
   npm run build
   aws s3 sync dist/ s3://everconnect-frontend/ --delete
   ```

## Step 7: Test Your Domain

After CloudFront deployment completes (check status in console):

1. **Test URLs**:
   - https://www.everconnect.ca (primary)
   - https://everconnect.ca (should also work)
   - https://api.everconnect.ca (if configured)

2. **Check SSL Certificate**:
   - Click padlock in browser
   - Should show certificate issued by Amazon

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate not appearing in CloudFront | Ensure certificate is in us-east-1 region |
| "CNAMEAlreadyExists" error | Domain might be used in another AWS account |
| Site not loading | Wait for CloudFront deployment to complete (15-20 min) |
| SSL errors | Certificate must include exact domain names |
| DNS not resolving | Check Route 53 records are type A with Alias enabled |

## Important Notes

- **DNS Propagation**: Can take up to 48 hours globally (usually much faster)
- **CloudFront Deployment**: Takes 15-20 minutes after any changes
- **Certificate Region**: MUST be us-east-1 for CloudFront
- **Costs**: ACM certificates are free, Route 53 hosted zone ~$0.50/month



