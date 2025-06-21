import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings } from '../types/bindings';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// Default rate limit configuration
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

// Generate rate limit key
function generateKey(c: Context, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(c);
  }
  
  // Use IP address as default key
  const ip = c.req.header('CF-Connecting-IP') || 
            c.req.header('X-Forwarded-For') || 
            c.req.header('X-Real-IP') || 
            'unknown';
  
  return `rate_limit:${ip}`;
}

// Rate limiter middleware factory
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  return async function rateLimiter(c: Context<{ Bindings: Bindings }>, next: Next) {
    const key = generateKey(c, finalConfig);
    const windowKey = `${key}:${Math.floor(Date.now() / finalConfig.windowMs)}`;
    
    try {
      // Get current count
      const currentCount = await c.env.CACHE_KV.get(windowKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      // Check if limit exceeded
      if (count >= finalConfig.maxRequests) {
        // Add rate limit headers
        c.header('X-RateLimit-Limit', finalConfig.maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', (Math.ceil(Date.now() / finalConfig.windowMs) * finalConfig.windowMs).toString());
        
        throw new HTTPException(429, { 
          message: 'Too many requests, please try again later' 
        });
      }
      
      // Increment counter
      const newCount = count + 1;
      const ttl = Math.ceil(finalConfig.windowMs / 1000);
      await c.env.CACHE_KV.put(windowKey, newCount.toString(), { expirationTtl: ttl });
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', finalConfig.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (finalConfig.maxRequests - newCount).toString());
      c.header('X-RateLimit-Reset', (Math.ceil(Date.now() / finalConfig.windowMs) * finalConfig.windowMs).toString());
      
      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      // If KV is unavailable, allow the request but log the error
      console.error('Rate limiter error:', error);
      await next();
    }
  };
}

// Default rate limiter
export const rateLimiter = createRateLimiter();

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
});

// API key based rate limiter
export const apiKeyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute for API keys
  keyGenerator: (c) => {
    const apiKey = c.req.header('X-API-Key');
    return apiKey ? `rate_limit:api:${apiKey}` : `rate_limit:ip:${c.req.header('CF-Connecting-IP')}`;
  },
});

// User-based rate limiter (requires authentication)
export const userRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // 200 requests per minute per user
  keyGenerator: (c) => {
    const user = c.get('user');
    return user ? `rate_limit:user:${user.id}` : `rate_limit:ip:${c.req.header('CF-Connecting-IP')}`;
  },
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 uploads per minute
  keyGenerator: (c) => {
    const user = c.get('user');
    const ip = c.req.header('CF-Connecting-IP');
    return user ? `rate_limit:upload:user:${user.id}` : `rate_limit:upload:ip:${ip}`;
  },
});
