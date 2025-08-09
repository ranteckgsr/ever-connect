import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password_hash: string;
  file_name?: string;
  storage_location?: string;
  s3_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: number;
  };
}

export interface SignupRequestBody {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface FileUploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}