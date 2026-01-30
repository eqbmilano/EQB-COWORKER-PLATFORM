import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from '../utils/logger.js';

// AWS S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'eqb-platform-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        )
      );
    }
  },
});

/**
 * Upload file to S3
 */
export async function uploadToS3(
  file: Express.Multer.File,
  folder: string = 'documents'
): Promise<{ url: string; key: string; size: number }> {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadDate: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-south-1'}.amazonaws.com/${fileName}`;

    logger.info('File uploaded to S3', {
      key: fileName,
      size: file.size,
      mimetype: file.mimetype,
    });

    return {
      url,
      key: fileName,
      size: file.size,
    };
  } catch (error) {
    logger.error('Failed to upload file to S3', { error });
    throw new Error('File upload failed');
  }
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    logger.info('File deleted from S3', { key });
  } catch (error) {
    logger.error('Failed to delete file from S3', { key, error });
    throw new Error('File deletion failed');
  }
}

/**
 * Middleware for single file upload
 */
export const uploadSingleFile = (fieldName: string) => {
  return upload.single(fieldName);
};

/**
 * Middleware for multiple file uploads
 */
export const uploadMultipleFiles = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Error handler for multer errors
 */
export function handleUploadError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum number of files exceeded',
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
    });
  }

  next();
}

/**
 * Validate file presence
 */
export function validateFilePresence(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please provide a file to upload',
    });
  }
  next();
}

