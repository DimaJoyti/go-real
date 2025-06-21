import { Hono } from 'hono';
import { optionalAuthMiddleware } from '../middleware/auth';
import type { Bindings, APIResponse } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// Proxy requests to Go backend with caching and enhancement

// Generic proxy handler
async function proxyToBackend(
  c: any,
  path: string,
  method: string,
  body?: any,
  headers?: Record<string, string>
) {
  const backendUrl = `${c.env.GO_BACKEND_URL}/api${path}`;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'GoReal-CloudflareWorker/1.0',
    ...headers,
  };

  // Forward authorization header if present
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    requestHeaders['Authorization'] = authHeader;
  }

  // Forward user IP
  const userIP = c.req.header('CF-Connecting-IP');
  if (userIP) {
    requestHeaders['X-Forwarded-For'] = userIP;
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(backendUrl, requestOptions);
    const responseData = await response.json();

    // Log analytics for backend requests
    c.env.ANALYTICS?.writeDataPoint({
      blobs: ['backend_proxy', method, path, response.status.toString()],
      doubles: [Date.now(), response.status],
      indexes: ['backend_proxy', method],
    });

    return c.json(responseData, response.status);
  } catch (error) {
    console.error('Backend proxy error:', error);
    
    // Log error
    c.env.ANALYTICS?.writeDataPoint({
      blobs: ['backend_proxy_error', method, path, 'fetch_failed'],
      doubles: [Date.now(), 500],
      indexes: ['backend_proxy_error', method],
    });

    const errorResponse: APIResponse = {
      success: false,
      error: 'Backend service unavailable',
      timestamp: new Date().toISOString(),
    };

    return c.json(errorResponse, 503);
  }
}

// Cached proxy for GET requests
async function cachedProxyToBackend(
  c: any,
  path: string,
  cacheTtl: number = 300
) {
  // Create cache key
  const queryString = c.req.url.split('?')[1] || '';
  const cacheKey = `proxy:GET:${path}:${btoa(queryString)}`;

  // Try to get from cache first
  const cached = await c.env.CACHE_KV.get(cacheKey);
  if (cached) {
    const cachedData = JSON.parse(cached);
    
    // Add cache headers
    c.header('X-Cache', 'HIT');
    c.header('X-Cache-Date', cachedData.cached_at);
    
    return c.json(cachedData.response, cachedData.status);
  }

  // Not in cache, proxy to backend
  const backendUrl = `${c.env.GO_BACKEND_URL}/api${path}?${queryString}`;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'GoReal-CloudflareWorker/1.0',
  };

  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    requestHeaders['Authorization'] = authHeader;
  }

  const userIP = c.req.header('CF-Connecting-IP');
  if (userIP) {
    requestHeaders['X-Forwarded-For'] = userIP;
  }

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: requestHeaders,
    });

    const responseData = await response.json();

    // Cache successful responses
    if (response.ok) {
      await c.env.CACHE_KV.put(
        cacheKey,
        JSON.stringify({
          response: responseData,
          status: response.status,
          cached_at: new Date().toISOString(),
        }),
        { expirationTtl: cacheTtl }
      );
    }

    // Add cache headers
    c.header('X-Cache', 'MISS');
    c.header('X-Cache-TTL', cacheTtl.toString());

    return c.json(responseData, response.status);
  } catch (error) {
    console.error('Cached proxy error:', error);
    
    const errorResponse: APIResponse = {
      success: false,
      error: 'Backend service unavailable',
      timestamp: new Date().toISOString(),
    };

    return c.json(errorResponse, 503);
  }
}

// Auth routes proxy
app.all('/auth/*', async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

// User routes proxy (with caching for GET requests)
app.get('/users/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  return cachedProxyToBackend(c, path, 300); // 5 minutes cache
});

app.all('/users/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

// Challenge routes proxy (with caching for GET requests)
app.get('/challenges/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  return cachedProxyToBackend(c, path, 600); // 10 minutes cache
});

app.all('/challenges/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

// Film routes proxy
app.get('/films/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  return cachedProxyToBackend(c, path, 300); // 5 minutes cache
});

app.all('/films/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

// Property routes proxy (with longer caching for GET requests)
app.get('/properties/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  return cachedProxyToBackend(c, path, 1800); // 30 minutes cache
});

app.all('/properties/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

// CRM routes proxy
app.all('/crm/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

// Generic catch-all proxy
app.all('/*', optionalAuthMiddleware, async (c) => {
  const path = c.req.path.replace('/api/proxy', '');
  const method = c.req.method;
  
  let body;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await c.req.json().catch(() => null);
  }

  return proxyToBackend(c, path, method, body);
});

export { app as proxyRoutes };
