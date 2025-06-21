import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import type { Bindings } from './types/bindings';

// Import route modules
import { analyticsRoutes } from './routes/analytics';
import { authRoutes } from './routes/auth';
import { cacheRoutes } from './routes/cache';
import { fileRoutes } from './routes/files';
import { protectedRoutes } from './routes/protected';
import { proxyRoutes } from './routes/proxy';

// Create main Hono app with proper typing
const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://goreal.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Global rate limiting
app.use('*', rateLimiter);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'goreal-workers',
    timestamp: new Date().toISOString(),
    message: 'Cloudflare Workers is running!',
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// Mount route modules
app.route('/auth', authRoutes);
app.route('/api', proxyRoutes);
app.route('/files', fileRoutes);
app.route('/cache', cacheRoutes);
app.route('/analytics', analyticsRoutes);
app.route('/user', protectedRoutes);

// Global error handler
app.onError(errorHandler);

// Catch-all for undefined routes
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: c.req.path,
    timestamp: new Date().toISOString(),
  }, 404);
});

// Export the app
export default app;
