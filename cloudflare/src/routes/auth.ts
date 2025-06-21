import { Hono } from 'hono';
import { UnauthorizedError, ValidationError } from '../middleware/errorHandler';
import { strictRateLimiter } from '../middleware/rateLimiter';
import type { APIResponse, Bindings, User } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// Session management with Cloudflare KV

// Create session
async function createSession(
  c: any,
  user: User,
  expiresIn: number = 86400 // 24 hours
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  const sessionData = {
    id: sessionId,
    user,
    created_at: new Date().toISOString(),
    expires_at: new Date(expiresAt).toISOString(),
    ip: c.req.header('CF-Connecting-IP'),
    user_agent: c.req.header('User-Agent'),
  };

  // Store session in KV
  await c.env.SESSION_KV.put(
    `session:${user.id}`,
    JSON.stringify(sessionData),
    { expirationTtl: expiresIn }
  );

  // Store session by ID for quick lookup
  await c.env.SESSION_KV.put(
    `session_id:${sessionId}`,
    JSON.stringify(sessionData),
    { expirationTtl: expiresIn }
  );

  return sessionId;
}

// Validate session
async function validateSession(c: any, sessionId: string): Promise<User | null> {
  const sessionData = await c.env.SESSION_KV.get(`session_id:${sessionId}`);
  
  if (!sessionData) {
    return null;
  }

  const session = JSON.parse(sessionData);
  
  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    await c.env.SESSION_KV.delete(`session:${session.user.id}`);
    await c.env.SESSION_KV.delete(`session_id:${sessionId}`);
    return null;
  }

  return session.user;
}

// Login endpoint (proxy to backend with session management)
app.post('/login', strictRateLimiter, async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  try {
    // Proxy login request to Go backend
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await backendResponse.json() as any;

    if (!backendResponse.ok) {
      throw new UnauthorizedError(responseData.error || 'Login failed');
    }

    const { user, token } = responseData.data;

    // Create session in Cloudflare KV
    const sessionId = await createSession(c, user);

    // Log analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: ['user_login', user.id, email],
      doubles: [Date.now()],
      indexes: ['user_login'],
    });

    const response: APIResponse = {
      success: true,
      data: {
        user,
        session_id: sessionId,
        backend_token: token, // Keep backend token for direct API calls
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    console.error('Login error:', error);
    throw new Error('Authentication service unavailable');
  }
});

// Logout endpoint
app.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionId = authHeader.substring(7);
    
    // Get session data before deletion
    const sessionData = await c.env.SESSION_KV.get(`session_id:${sessionId}`);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      
      // Delete session from KV
      await c.env.SESSION_KV.delete(`session:${session.user.id}`);
      await c.env.SESSION_KV.delete(`session_id:${sessionId}`);

      // Log analytics
      c.env.ANALYTICS?.writeDataPoint({
        blobs: ['user_logout', session.user.id],
        doubles: [Date.now()],
        indexes: ['user_logout'],
      });
    }
  }

  const response: APIResponse = {
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Session validation endpoint
app.get('/session', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No session token provided');
  }

  const sessionId = authHeader.substring(7);
  const user = await validateSession(c, sessionId);

  if (!user) {
    throw new UnauthorizedError('Invalid or expired session');
  }

  const response: APIResponse<User> = {
    success: true,
    data: user,
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Refresh session endpoint
app.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No session token provided');
  }

  const sessionId = authHeader.substring(7);
  const user = await validateSession(c, sessionId);

  if (!user) {
    throw new UnauthorizedError('Invalid or expired session');
  }

  // Create new session
  const newSessionId = await createSession(c, user);

  // Delete old session
  await c.env.SESSION_KV.delete(`session_id:${sessionId}`);

  const response: APIResponse = {
    success: true,
    data: {
      session_id: newSessionId,
      user,
    },
    message: 'Session refreshed successfully',
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Register endpoint (proxy to backend)
app.post('/register', strictRateLimiter, async (c) => {
  const body = await c.req.json();

  try {
    // Proxy registration request to Go backend
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify(body),
    });

    const responseData = await backendResponse.json() as any;

    if (!backendResponse.ok) {
      throw new ValidationError(responseData.error || 'Registration failed');
    }

    // Log analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: ['user_register', body.email || 'unknown'],
      doubles: [Date.now()],
      indexes: ['user_register'],
    });

    return c.json(responseData, backendResponse.status as any);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    console.error('Registration error:', error);
    throw new Error('Registration service unavailable');
  }
});

// Password reset request
app.post('/forgot-password', strictRateLimiter, async (c) => {
  const body = await c.req.json();

  try {
    // Proxy to Go backend
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify(body),
    });

    const responseData = await backendResponse.json() as any;
    return c.json(responseData, backendResponse.status as any);
  } catch (error) {
    console.error('Password reset error:', error);
    throw new Error('Password reset service unavailable');
  }
});

export { app as authRoutes };
