# EverConnect Scripts

Clean, organized scripts for managing the EverConnect application.

## 🚀 Quick Start

```bash
# First time setup (install dependencies)
cd scripts
npm install

# Start local development
./start-local.bat
```

## 📁 Available Scripts

### Development
- **`start-local.bat`** - Start both backend and frontend for local development
  - Backend runs on http://localhost:5000
  - Frontend runs on http://localhost:8083

### Data Management
- **`view-data.bat`** - View all users and data in RDS database
  - Shows user list with details
  - Recent signups
  - File upload statistics

- **`view-files.bat`** - View all files in S3 bucket
  - Lists files by user
  - Shows storage statistics
  - Recent uploads

### Deployment
- **`deploy.bat`** - Deploy to AWS
  - Option to deploy backend to Elastic Beanstalk
  - Option to deploy frontend to S3
  - Creates deployment packages

### Maintenance
- **`cleanup.bat`** - Clean up old files and scripts
  - Removes old batch files from root
  - Cleans build artifacts
  - Organizes repository

## 📊 Direct Node.js Scripts

You can also run the scripts directly:

```bash
cd scripts

# View database
node view-database.js

# View S3 files
node view-s3-files.js
```

## 🔧 Configuration

All scripts use the environment variables from `backend/.env`:
- Database credentials (RDS)
- AWS credentials (S3)
- API configuration

## 📝 Notes

- Make sure backend/.env has all required credentials
- Database viewer requires RDS connection
- S3 viewer requires AWS credentials
- Frontend runs on port 8083 by default