import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import pool from '../config/database';
import { hashPassword, generateToken } from '../utils/auth';
import { s3Client, S3_BUCKET_NAME } from '../config/aws';
import { SignupRequestBody, LoginRequestBody } from '../types';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const signupWithFile = async (req: MulterRequest, res: Response): Promise<Response> => {
  const { username, firstName, lastName, email, phoneNumber, password } = req.body as SignupRequestBody;
  const file = req.file;

  // Process signup request

  try {
    // Validate required fields
    if (!username || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: 'All fields are required',
        missing: {
          username: !username,
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password
        }
      });
    }

    if (!file) {
      return res.status(400).json({ error: 'File upload is required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
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

      await s3Client.send(new PutObjectCommand(uploadParams));
      
      // Update user with file information
      const s3Url = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
      await client.query(
        'UPDATE users SET file_name = $1, storage_location = $2, s3_url = $3 WHERE id = $4',
        [file.originalname, fileKey, s3Url, user.id]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Account created successfully! You can now login.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    // Signup error occurred
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create account',
      details: error.message 
    });
  }
};

export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  try {
    // Find user by username or email
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

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
  } catch (error) {
    // Login error occurred
    return res.status(500).json({ error: 'Failed to login' });
  }
};