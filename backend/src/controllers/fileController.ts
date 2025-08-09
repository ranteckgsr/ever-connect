import { Response } from 'express';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../config/aws';
import pool from '../config/database';
import { AuthRequest, FileUploadRequest } from '../types';

export const uploadFile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { fileName, fileType } = req.body as FileUploadRequest;
    const userId = req.user!.userId;

    // Get user's phone number from database
    const userResult = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    const phoneNumber = userResult.rows[0]?.phone_number || '';
    
    // Clean phone number (remove special characters, keep only digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '') || 'no-phone';
    
    // Generate key for S3 with phone number
    const fileKey = `user-files/${userId}/${cleanPhone}-${fileName}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Generate permanent S3 URL
    const s3Url = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    // Update user record with file information
    await pool.query(
      `UPDATE users 
       SET file_name = $1, storage_location = $2, s3_url = $3, updated_at = NOW() 
       WHERE id = $4`,
      [fileName, fileKey, s3Url, userId]
    );

    return res.json({
      uploadUrl,
      fileKey,
      s3Url,
    });
  } catch (error) {
    // File upload error
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

export const getFileUrl = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.userId;

    // Get user's file information
    const result = await pool.query(
      'SELECT file_name, storage_location, s3_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].storage_location) {
      return res.status(404).json({ error: 'No file found' });
    }

    const { file_name, storage_location, s3_url } = result.rows[0];

    // Generate presigned URL for download
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: storage_location,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return res.json({
      fileName: file_name,
      downloadUrl,
      s3Url: s3_url,
    });
  } catch (error) {
    // Get file error
    return res.status(500).json({ error: 'Failed to get file URL' });
  }
};