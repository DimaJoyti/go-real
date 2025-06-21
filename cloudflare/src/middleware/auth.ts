import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings, User } from '../types/bindings';

// Extended context type for auth middleware
type AuthContext = Context<{
  Bindings: Bindings;
  Variables: {
    user: User;
    sessionId: string;
  };
}>;

// Helper function to decode base64url
export function base64urlDecode(str: string): string {
  // Add padding if needed
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(str);
}

// Helper function to convert base64url string to Uint8Array
export function base64urlToUint8Array(str: string): Uint8Array {
  const decoded = base64urlDecode(str);
  return new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)));
}

async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [header, payload, signature] = parts;

    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${payload}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64urlToUint8Array(signature);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, data);

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const decodedPayload = JSON.parse(base64urlDecode(payload));

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Authentication middleware
export async function authMiddleware(c: AuthContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    // Check if session exists in KV (try both session keys)
    const sessionKey = `session:${payload.sub}`;
    const sessionIdKey = `session_id:${payload.jti || payload.sub}`;

    let session = await c.env.SESSION_KV.get(sessionKey);
    if (!session) {
      session = await c.env.SESSION_KV.get(sessionIdKey);
    }

    if (!session) {
      throw new HTTPException(401, { message: 'Session not found or expired' });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(session);
    } catch {
      throw new HTTPException(401, { message: 'Invalid session data' });
    }

    // Check if session is expired
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      // Clean up expired session
      await c.env.SESSION_KV.delete(sessionKey);
      await c.env.SESSION_KV.delete(sessionIdKey);
      throw new HTTPException(401, { message: 'Session expired' });
    }
    
    // Set user context
    c.set('user', sessionData.user);
    c.set('sessionId', sessionData.id);
    
    await next();
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
}

// Optional authentication middleware (doesn't throw if no token)
export async function optionalAuthMiddleware(c: AuthContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);
      const sessionKey = `session:${payload.sub}`;
      const sessionIdKey = `session_id:${payload.jti || payload.sub}`;

      let session = await c.env.SESSION_KV.get(sessionKey);
      if (!session) {
        session = await c.env.SESSION_KV.get(sessionIdKey);
      }

      if (session) {
        try {
          const sessionData = JSON.parse(session);

          // Check if session is expired
          if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
            // Clean up expired session
            await c.env.SESSION_KV.delete(sessionKey);
            await c.env.SESSION_KV.delete(sessionIdKey);
          } else {
            c.set('user', sessionData.user);
            c.set('sessionId', sessionData.id);
          }
        } catch {
          // Ignore invalid session data for optional auth
        }
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
  }
  
  await next();
}

// Admin role check middleware
export async function adminMiddleware(c: AuthContext, next: Next) {
  const user = c.get('user') as User;
  
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }
  
  // Check if user has admin role
  const userMetadata = await c.env.METADATA_KV.get(`user:${user.id}:metadata`);
  let metadata: { roles?: string[] } = {};

  if (userMetadata) {
    try {
      metadata = JSON.parse(userMetadata);
    } catch {
      throw new HTTPException(500, { message: 'Invalid user metadata' });
    }
  }

  if (!metadata.roles?.includes('admin')) {
    throw new HTTPException(403, { message: 'Admin access required' });
  }
  
  await next();
}

// Rate limiting per user
export async function userRateLimiter(c: AuthContext, next: Next) {
  const user = c.get('user') as User;
  
  if (user) {
    const rateLimitKey = `rate_limit:user:${user.id}`;
    const currentCount = await c.env.CACHE_KV.get(rateLimitKey);
    const count = currentCount ? parseInt(currentCount) : 0;
    
    if (count >= 100) { // 100 requests per minute per user
      throw new HTTPException(429, { message: 'Rate limit exceeded' });
    }
    
    await c.env.CACHE_KV.put(rateLimitKey, (count + 1).toString(), { expirationTtl: 60 });
  }
  
  await next();
}
