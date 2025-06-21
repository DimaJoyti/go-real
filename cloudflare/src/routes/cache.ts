import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import type { Bindings, CacheEntry, APIResponse } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// Cache management endpoints (admin only)

// Get cache entry
app.get('/:key', adminMiddleware, async (c) => {
  const key = c.req.param('key');
  
  const value = await c.env.CACHE_KV.get(key);
  if (!value) {
    throw new NotFoundError('Cache entry not found');
  }

  let parsedValue;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }

  const response: APIResponse<any> = {
    success: true,
    data: {
      key,
      value: parsedValue,
      retrieved_at: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Set cache entry
app.post('/', adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { key, value, ttl } = body;

  if (!key) {
    throw new ValidationError('Key is required', 'key');
  }

  if (value === undefined) {
    throw new ValidationError('Value is required', 'value');
  }

  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  const options: any = {};
  if (ttl && typeof ttl === 'number' && ttl > 0) {
    options.expirationTtl = ttl;
  }

  await c.env.CACHE_KV.put(key, stringValue, options);

  const response: APIResponse = {
    success: true,
    message: 'Cache entry set successfully',
    data: {
      key,
      ttl: ttl || null,
      set_at: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Delete cache entry
app.delete('/:key', adminMiddleware, async (c) => {
  const key = c.req.param('key');
  
  await c.env.CACHE_KV.delete(key);

  const response: APIResponse = {
    success: true,
    message: 'Cache entry deleted successfully',
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Clear cache by prefix
app.delete('/prefix/:prefix', adminMiddleware, async (c) => {
  const prefix = c.req.param('prefix');
  
  // List keys with prefix
  const list = await c.env.CACHE_KV.list({ prefix });
  
  // Delete all keys
  const deletePromises = list.keys.map(key => c.env.CACHE_KV.delete(key.name));
  await Promise.all(deletePromises);

  const response: APIResponse = {
    success: true,
    message: `Deleted ${list.keys.length} cache entries with prefix '${prefix}'`,
    data: {
      deleted_count: list.keys.length,
      prefix,
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Cache statistics
app.get('/stats/overview', adminMiddleware, async (c) => {
  // This is a simplified implementation
  // In practice, you might want to store cache statistics separately
  
  const cacheList = await c.env.CACHE_KV.list();
  const sessionList = await c.env.SESSION_KV.list();
  const metadataList = await c.env.METADATA_KV.list();

  const response: APIResponse = {
    success: true,
    data: {
      cache_entries: cacheList.keys.length,
      session_entries: sessionList.keys.length,
      metadata_entries: metadataList.keys.length,
      total_entries: cacheList.keys.length + sessionList.keys.length + metadataList.keys.length,
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Utility endpoints for application caching

// Cache API response
app.post('/api-response', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { endpoint, method, params, response, ttl = 300 } = body;

  if (!endpoint || !method || !response) {
    throw new ValidationError('endpoint, method, and response are required');
  }

  // Create cache key
  const paramsHash = params ? btoa(JSON.stringify(params)) : '';
  const cacheKey = `api:${method}:${endpoint}:${paramsHash}`;

  await c.env.CACHE_KV.put(
    cacheKey,
    JSON.stringify({
      response,
      cached_at: new Date().toISOString(),
      endpoint,
      method,
      params,
    }),
    { expirationTtl: ttl }
  );

  const apiResponse: APIResponse = {
    success: true,
    message: 'API response cached successfully',
    data: { cache_key: cacheKey, ttl },
    timestamp: new Date().toISOString(),
  };

  return c.json(apiResponse);
});

// Get cached API response
app.get('/api-response/:method/:endpoint', async (c) => {
  const method = c.req.param('method').toUpperCase();
  const endpoint = c.req.param('endpoint');
  const params = c.req.query('params');

  const paramsHash = params ? btoa(params) : '';
  const cacheKey = `api:${method}:${endpoint}:${paramsHash}`;

  const cached = await c.env.CACHE_KV.get(cacheKey);
  if (!cached) {
    throw new NotFoundError('Cached response not found');
  }

  const cachedData = JSON.parse(cached);

  const response: APIResponse = {
    success: true,
    data: cachedData,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Cache user data
app.post('/user-data', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { data_type, data, ttl = 3600 } = body;

  if (!data_type || !data) {
    throw new ValidationError('data_type and data are required');
  }

  const cacheKey = `user:${user.id}:${data_type}`;

  await c.env.CACHE_KV.put(
    cacheKey,
    JSON.stringify({
      data,
      cached_at: new Date().toISOString(),
      user_id: user.id,
      data_type,
    }),
    { expirationTtl: ttl }
  );

  const response: APIResponse = {
    success: true,
    message: 'User data cached successfully',
    data: { cache_key: cacheKey, ttl },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Get cached user data
app.get('/user-data/:dataType', authMiddleware, async (c) => {
  const user = c.get('user');
  const dataType = c.req.param('dataType');

  const cacheKey = `user:${user.id}:${dataType}`;
  const cached = await c.env.CACHE_KV.get(cacheKey);

  if (!cached) {
    throw new NotFoundError('Cached user data not found');
  }

  const cachedData = JSON.parse(cached);

  const response: APIResponse = {
    success: true,
    data: cachedData,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

export { app as cacheRoutes };
