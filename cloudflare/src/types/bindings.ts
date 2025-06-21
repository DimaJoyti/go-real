// Cloudflare Workers bindings interface
export interface Bindings {
  // Environment variables
  ENVIRONMENT: string;
  GO_BACKEND_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  
  // KV Namespaces
  CACHE_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  METADATA_KV: KVNamespace;
  
  // R2 Buckets
  FILES_BUCKET: R2Bucket;
  IMAGES_BUCKET: R2Bucket;
  VIDEOS_BUCKET: R2Bucket;
  
  // D1 Database
  EDGE_DB: D1Database;
  
  // Durable Objects
  CHAT_ROOMS: DurableObjectNamespace;
  LIVE_CHALLENGES: DurableObjectNamespace;
  
  // Queue
  BACKGROUND_QUEUE: Queue;
  
  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset;
}

// Custom types for the application
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  start_date: string;
  end_date: string;
  created_by: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

export interface Film {
  id: string;
  title: string;
  description: string;
  duration: number;
  file_url: string;
  thumbnail_url: string;
  created_by: string;
  challenge_id?: string;
  status: 'processing' | 'ready' | 'failed';
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  nft_token_id?: string;
  owner_id: string;
  status: 'available' | 'sold' | 'pending';
}

export interface FileUpload {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  bucket: string;
  key: string;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  created_at: number;
}

export interface AnalyticsEvent {
  event_type: string;
  user_id?: string;
  session_id?: string;
  properties: Record<string, any>;
  timestamp: number;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface FileUploadRequest {
  file: File;
  bucket: 'files' | 'images' | 'videos';
  folder?: string;
  public?: boolean;
}

export interface CacheRequest {
  key: string;
  value: any;
  ttl?: number;
}
