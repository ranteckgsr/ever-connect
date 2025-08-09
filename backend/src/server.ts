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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database test
app.get('/api/test-db', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'Database connected',
      time: result.rows[0].now
    });
  } catch (error: any) {
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
  } catch (error) {
    // Profile fetch error
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// File routes
app.post('/api/file/upload', authenticate, uploadFile);
app.get('/api/file/url', authenticate, getFileUrl);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Error occurred
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database
const initializeDatabase = async (): Promise<void> => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'models', 'schema-no-email-verification.sql'), 'utf8');
    await pool.query(schema);
    // Database schema initialized
  } catch (error: any) {
    if (error.code === '42P07') {
      // Database already initialized
    } else {
      // Database initialization error
    }
  }
};

// Start server
app.listen(PORT, async () => {
  // Server started successfully
  
  try {
    await initializeDatabase();
  } catch (error) {
    // Database already initialized
  }
});