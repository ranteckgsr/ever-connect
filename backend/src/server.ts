import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { signupWithFile, login } from './controllers/authController';
import upload from './middleware/upload';
import { uploadFile, getFileUrl } from './controllers/fileController';
import authenticate from './middleware/auth';
import pool from './config/database';
import { AuthRequest } from './types';
import log from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080; // EB default port

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    log.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Log error responses in detail
    if (res.statusCode >= 400) {
      log.error('Error response sent', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        body: req.body,
        response: data
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check (EB uses this)
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'EverConnect Backend API',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  log.debug('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database test
app.get('/api/test-db', async (_req: Request, res: Response) => {
  try {
    log.debug('Testing database connection');
    const result = await pool.query('SELECT NOW()');
    log.info('Database connection successful');
    res.json({ 
      status: 'Database connected',
      time: result.rows[0].now
    });
  } catch (error: any) {
    log.error('Database connection test failed', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      status: 'Database error',
      error: error.message 
    });
  }
});

// Auth routes
app.post('/api/auth/signup', upload.single('file'), signupWithFile);
app.post('/api/auth/login', login);

// Protected routes
app.get('/api/user/profile', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const result = await pool.query(
      'SELECT id, username, first_name, last_name, email, phone_number, file_name, s3_url FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error: any) {
    // Profile fetch error
    log.error('Failed to fetch user profile', {
      userId: req.user!.userId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// File routes
app.post('/api/file/upload', authenticate, uploadFile);
app.get('/api/file/url', authenticate, getFileUrl);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Error occurred
  log.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body
  });
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database
const initializeDatabase = async (): Promise<void> => {
  try {
    log.info('Initializing database schema');
    const schema = fs.readFileSync(path.join(__dirname, 'models', 'schema-no-email-verification.sql'), 'utf8');
    await pool.query(schema);
    log.info('Database schema initialized successfully');
  } catch (error: any) {
    if (error.code === '42P07') {
      log.info('Database already initialized');
    } else {
      log.error('Database initialization failed', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }
};

// Start server
app.listen(PORT, async () => {
  log.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL,
    awsRegion: process.env.AWS_REGION,
    s3Bucket: process.env.S3_BUCKET_NAME
  });
  
  try {
    await initializeDatabase();
  } catch (error: any) {
    log.error('Failed to initialize database on startup', {
      error: error.message
    });
  }
});