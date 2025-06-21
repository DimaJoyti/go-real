import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import type { APIResponse, Bindings, FileUpload } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// File upload endpoint
app.post('/upload', authMiddleware, uploadRateLimiter, async (c) => {
  const user = c.get('user');
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file || typeof file === 'string') {
    throw new ValidationError('No file provided or invalid file format');
  }
  const bucket = formData.get('bucket') as string || 'files';
  const folder = formData.get('folder') as string || '';
  const isPublic = formData.get('public') === 'true';

  if (!file) {
    throw new ValidationError('File is required', 'file');
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new ValidationError('File size exceeds 10MB limit', 'file');
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'text/plain', 'application/json'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('File type not allowed', 'file');
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomId}.${extension}`;
    const key = folder ? `${folder}/${filename}` : filename;

    // Select appropriate bucket
    let r2Bucket: R2Bucket;
    switch (bucket) {
      case 'images':
        r2Bucket = c.env.IMAGES_BUCKET;
        break;
      case 'videos':
        r2Bucket = c.env.VIDEOS_BUCKET;
        break;
      default:
        r2Bucket = c.env.FILES_BUCKET;
    }

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await r2Bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${file.name}"`,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
        public: isPublic.toString(),
      },
    });

    // Generate URL
    const baseUrl = c.env.ENVIRONMENT === 'production' 
      ? 'https://files.goreal.com' 
      : 'https://dev-files.goreal.com';
    const url = `${baseUrl}/${bucket}/${key}`;

    // Store file metadata in KV
    const fileMetadata: FileUpload = {
      id: randomId,
      filename: file.name,
      content_type: file.type,
      size: file.size,
      bucket,
      key,
      url,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    };

    await c.env.METADATA_KV.put(
      `file:${randomId}`,
      JSON.stringify(fileMetadata),
      { expirationTtl: 86400 * 30 } // 30 days
    );

    // Log analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: ['file_upload', bucket, file.type, user.id],
      doubles: [file.size, timestamp],
      indexes: ['file_upload', bucket],
    });

    const response: APIResponse<FileUpload> = {
      success: true,
      data: fileMetadata,
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
});

// Get file metadata
app.get('/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  
  const metadata = await c.env.METADATA_KV.get(`file:${fileId}`);
  if (!metadata) {
    throw new NotFoundError('File not found');
  }

  const fileData: FileUpload = JSON.parse(metadata);
  
  const response: APIResponse<FileUpload> = {
    success: true,
    data: fileData,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Delete file
app.delete('/:fileId', authMiddleware, async (c) => {
  const user = c.get('user');
  const fileId = c.req.param('fileId');
  
  const metadata = await c.env.METADATA_KV.get(`file:${fileId}`);
  if (!metadata) {
    throw new NotFoundError('File not found');
  }

  const fileData: FileUpload = JSON.parse(metadata);
  
  // Check if user owns the file or is admin
  if (fileData.uploaded_by !== user.id) {
    // Check admin status
    const userMetadata = await c.env.METADATA_KV.get(`user:${user.id}:metadata`);
    const userData = userMetadata ? JSON.parse(userMetadata) : {};
    
    if (!userData.roles?.includes('admin')) {
      throw new Error('Unauthorized to delete this file');
    }
  }

  try {
    // Select appropriate bucket
    let r2Bucket: R2Bucket;
    switch (fileData.bucket) {
      case 'images':
        r2Bucket = c.env.IMAGES_BUCKET;
        break;
      case 'videos':
        r2Bucket = c.env.VIDEOS_BUCKET;
        break;
      default:
        r2Bucket = c.env.FILES_BUCKET;
    }

    // Delete from R2
    await r2Bucket.delete(fileData.key);
    
    // Delete metadata from KV
    await c.env.METADATA_KV.delete(`file:${fileId}`);

    // Log analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: ['file_delete', fileData.bucket, fileData.content_type, user.id],
      doubles: [fileData.size, Date.now()],
      indexes: ['file_delete', fileData.bucket],
    });

    const response: APIResponse = {
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
});

// List user files
app.get('/user/:userId', authMiddleware, async (c) => {
  const user = c.get('user');
  const userId = c.req.param('userId');
  
  // Users can only list their own files unless they're admin
  if (userId !== user.id) {
    const userMetadata = await c.env.METADATA_KV.get(`user:${user.id}:metadata`);
    const userData = userMetadata ? JSON.parse(userMetadata) : {};
    
    if (!userData.roles?.includes('admin')) {
      throw new Error('Unauthorized to access these files');
    }
  }

  // This is a simplified implementation
  // In a real app, you'd want to implement proper pagination and indexing
  const response: APIResponse<FileUpload[]> = {
    success: true,
    data: [], // Would implement proper file listing here
    message: 'File listing not fully implemented yet',
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

export { app as fileRoutes };
