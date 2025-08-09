# EverConnect - Forever Together

A modern web application for building meaningful connections that last forever. EverConnect provides a secure platform for users to connect, share files, and manage their profiles.

## Features

- **User Authentication**: Secure signup and login system with JWT tokens
- **File Management**: Upload and manage files with AWS S3 integration
- **Profile Management**: Comprehensive user profiles with tabbed interface
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **AWS Integration**: Leverages AWS RDS, S3, and other services

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL (AWS RDS)
- AWS S3 for file storage
- JWT for authentication
- bcrypt for password hashing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or AWS RDS instance)
- AWS account with configured services:
  - RDS for PostgreSQL
  - S3 bucket for file storage
  - IAM user with appropriate permissions

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ever-connect.git
cd ever-connect
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Set up environment variables:

Create `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
```

Create `.env` file in the backend directory:
```env
# Database
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# AWS
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# JWT
JWT_SECRET=your-jwt-secret

# Server
PORT=5000
```

5. Initialize the database:
```bash
cd backend
npm run dev
# The server will automatically create the required tables
```

## Running the Application

### Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Production

Build the backend:
```bash
cd backend
npm run build
npm start
```

Build the frontend:
```bash
npm run build
# Deploy the dist folder to your hosting service
```

## Project Structure

```
ever-connect/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth)
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities
├── backend/               # Backend source code
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database schemas
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── dist/              # Compiled TypeScript output
├── public/                # Static assets
└── package.json           # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account with file upload
- `POST /api/auth/login` - Login with credentials

### User Profile
- `GET /api/user/profile` - Get user profile (protected)

### File Management
- `POST /api/file/upload` - Get presigned URL for file upload (protected)
- `GET /api/file/url` - Get download URL for user's file (protected)

### Health Check
- `GET /health` - Server health check
- `GET /api/test-db` - Database connection test

## AWS Configuration

### S3 Bucket Setup
1. Create an S3 bucket with a unique name
2. Configure CORS policy:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

### RDS PostgreSQL Setup
1. Create RDS PostgreSQL instance
2. Configure security group to allow connections
3. Note the endpoint and credentials for .env file

### IAM User Permissions
Create an IAM user with the following permissions:
- S3: PutObject, GetObject, DeleteObject on your bucket
- RDS: Connect permissions

## Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- API endpoints are protected with authentication middleware
- SSL/TLS encryption for database connections
- CORS configured for secure cross-origin requests
- Environment variables for sensitive configuration

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run type-check` - Check TypeScript types

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.