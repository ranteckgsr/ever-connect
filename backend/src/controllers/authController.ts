import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import pool from '../config/database';
import { hashPassword, generateToken } from '../utils/auth';
import { s3Client, S3_BUCKET_NAME } from '../config/aws';
import { SignupRequestBody, LoginRequestBody } from '../types';
import log from '../utils/logger';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const signupWithFile = async (req: MulterRequest, res: Response): Promise<Response> => {
  const { username, firstName, lastName, email, phoneNumber, password } = req.body as SignupRequestBody;
  const file = req.file;

  // Process signup request
  log.info('Signup request received', {
    username,
    email,
    firstName,
    lastName,
    hasFile: !!file,
    fileSize: file?.size,
    fileMimeType: file?.mimetype,
    phoneProvided: !!phoneNumber,
    requestIp: req.ip,
    userAgent: req.headers['user-agent']
  });

  try {
    // Validate required fields
    if (!username || !firstName || !lastName || !email || !password) {
      const missingFields = {
        username: !username,
        firstName: !firstName,
        lastName: !lastName,
        email: !email,
        password: !password
      };
      log.warn('Signup validation failed - missing fields', { missingFields, email, username });
      return res.status(400).json({ 
        error: 'All fields are required',
        missing: missingFields
      });
    }

    if (!file) {
      log.warn('Signup validation failed - no file uploaded', { email, username });
      return res.status(400).json({ error: 'File upload is required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      log.warn('Signup failed - user already exists', { email, username });
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert user (no email verification fields)
      const userResult = await client.query(
        `INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, username, email`,
        [username, firstName, lastName, email, phoneNumber, passwordHash]
      );

      const user = userResult.rows[0];

      // Upload file to S3
      const cleanPhone = (phoneNumber || '').replace(/\D/g, '') || 'no-phone';
      const fileKey = `user-files/${user.id}/${cleanPhone}-${file.originalname}`;
      
      const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId: user.id.toString(),
          phoneNumber: phoneNumber || 'Not provided',
          uploadedAt: new Date().toISOString()
        }
      };

      log.debug('Uploading file to S3', { fileKey, bucketName: S3_BUCKET_NAME, fileSize: file.size });
      await s3Client.send(new PutObjectCommand(uploadParams));
      log.info('File uploaded to S3 successfully', { fileKey, userId: user.id });
      
      // Update user with file information
      const s3Url = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
      await client.query(
        'UPDATE users SET file_name = $1, storage_location = $2, s3_url = $3 WHERE id = $4',
        [file.originalname, fileKey, s3Url, user.id]
      );

      await client.query('COMMIT');

      log.info('User signup successful', {
        userId: user.id,
        username: user.username,
        email: user.email,
        fileUploaded: true
      });

      return res.status(201).json({
        message: 'Account created successfully! You can now login.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      log.error('Transaction failed during signup', {
        error: error.message,
        stack: error.stack,
        username,
        email
      });
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    // Signup error occurred
    log.error('Signup failed', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      username,
      email,
      requestBody: { username, firstName, lastName, email, phoneNumber: !!phoneNumber }
    });
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Check for S3 errors
    if (error.name === 'S3ServiceException' || error.$metadata) {
      log.error('S3 upload error during signup', {
        errorName: error.name,
        errorMessage: error.message,
        s3Metadata: error.$metadata
      });
      return res.status(500).json({ 
        error: 'Failed to upload file. Please try again.',
        details: 'File storage error'
      });
    }
    
    // Check for database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      log.error('Database connection error during signup', {
        errorCode: error.code,
        errorMessage: error.message
      });
      return res.status(503).json({ 
        error: 'Service temporarily unavailable. Please try again later.',
        details: 'Database connection error'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create account',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
};

export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  log.info('Login attempt', { 
    username,
    requestIp: req.ip,
    userAgent: req.headers['user-agent']
  });

  try {
    // Find user by username or email
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      log.warn('Login failed - user not found', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      log.warn('Login failed - invalid password', { username, userId: user.id });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    log.info('Login successful', {
      userId: user.id,
      username: user.username,
      email: user.email
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        fileName: user.file_name,
        s3Url: user.s3_url,
      },
    });
  } catch (error: any) {
    // Login error occurred
    log.error('Login error', {
      error: error.message,
      stack: error.stack,
      username
    });
    return res.status(500).json({ error: 'Failed to login' });
  }
};