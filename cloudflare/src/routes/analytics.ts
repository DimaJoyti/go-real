import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';
import type { Bindings, AnalyticsEvent, APIResponse } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// Track custom events
app.post('/track', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.get('sessionId');
  const body = await c.req.json();
  
  const { event_type, properties = {} } = body;

  if (!event_type) {
    throw new ValidationError('event_type is required', 'event_type');
  }

  try {
    // Write to Analytics Engine
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [
        event_type,
        user.id,
        sessionId || 'no-session',
        JSON.stringify(properties),
        c.req.header('User-Agent') || 'unknown',
        c.req.header('CF-Connecting-IP') || 'unknown',
        c.req.header('Referer') || 'direct',
      ],
      doubles: [Date.now()],
      indexes: [event_type, user.id],
    });

    // Also store in KV for recent events (optional)
    const eventKey = `event:${user.id}:${Date.now()}:${crypto.randomUUID()}`;
    const eventData: AnalyticsEvent = {
      event_type,
      user_id: user.id,
      session_id: sessionId,
      properties,
      timestamp: Date.now(),
    };

    await c.env.CACHE_KV.put(
      eventKey,
      JSON.stringify(eventData),
      { expirationTtl: 86400 } // 24 hours
    );

    const response: APIResponse = {
      success: true,
      message: 'Event tracked successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('Analytics tracking error:', error);
    throw new Error('Failed to track event');
  }
});

// Track page views
app.post('/pageview', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.get('sessionId');
  const body = await c.req.json();
  
  const { page, title, referrer } = body;

  if (!page) {
    throw new ValidationError('page is required', 'page');
  }

  try {
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [
        'pageview',
        page,
        title || 'Unknown',
        referrer || 'direct',
        user.id,
        sessionId || 'no-session',
        c.req.header('User-Agent') || 'unknown',
        c.req.header('CF-Connecting-IP') || 'unknown',
      ],
      doubles: [Date.now()],
      indexes: ['pageview', page, user.id],
    });

    const response: APIResponse = {
      success: true,
      message: 'Pageview tracked successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('Pageview tracking error:', error);
    throw new Error('Failed to track pageview');
  }
});

// Track user interactions
app.post('/interaction', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.get('sessionId');
  const body = await c.req.json();
  
  const { element, action, page, metadata = {} } = body;

  if (!element || !action) {
    throw new ValidationError('element and action are required');
  }

  try {
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [
        'interaction',
        element,
        action,
        page || 'unknown',
        user.id,
        sessionId || 'no-session',
        JSON.stringify(metadata),
      ],
      doubles: [Date.now()],
      indexes: ['interaction', element, action],
    });

    const response: APIResponse = {
      success: true,
      message: 'Interaction tracked successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('Interaction tracking error:', error);
    throw new Error('Failed to track interaction');
  }
});

// Track performance metrics
app.post('/performance', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.get('sessionId');
  const body = await c.req.json();
  
  const { 
    page, 
    load_time, 
    first_contentful_paint, 
    largest_contentful_paint,
    cumulative_layout_shift,
    first_input_delay 
  } = body;

  if (!page || !load_time) {
    throw new ValidationError('page and load_time are required');
  }

  try {
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [
        'performance',
        page,
        user.id,
        sessionId || 'no-session',
      ],
      doubles: [
        Date.now(),
        load_time,
        first_contentful_paint || 0,
        largest_contentful_paint || 0,
        cumulative_layout_shift || 0,
        first_input_delay || 0,
      ],
      indexes: ['performance', page],
    });

    const response: APIResponse = {
      success: true,
      message: 'Performance metrics tracked successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('Performance tracking error:', error);
    throw new Error('Failed to track performance metrics');
  }
});

// Track errors
app.post('/error', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = c.get('sessionId');
  const body = await c.req.json();
  
  const { error_type, message, stack, page, line, column } = body;

  if (!error_type || !message) {
    throw new ValidationError('error_type and message are required');
  }

  try {
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [
        'error',
        error_type,
        message,
        page || 'unknown',
        user.id,
        sessionId || 'no-session',
        stack || 'no-stack',
        c.req.header('User-Agent') || 'unknown',
      ],
      doubles: [
        Date.now(),
        line || 0,
        column || 0,
      ],
      indexes: ['error', error_type, page || 'unknown'],
    });

    const response: APIResponse = {
      success: true,
      message: 'Error tracked successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('Error tracking error:', error);
    throw new Error('Failed to track error');
  }
});

// Get analytics summary (admin only)
app.get('/summary', adminMiddleware, async (c) => {
  // This is a simplified implementation
  // In practice, you'd query your analytics data from a proper analytics service
  
  const response: APIResponse = {
    success: true,
    data: {
      message: 'Analytics summary endpoint - implement based on your analytics storage solution',
      note: 'Analytics Engine data is typically queried via GraphQL API or exported to external systems',
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Get user analytics (user's own data)
app.get('/user', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Get recent events from KV (last 24 hours)
  const eventsList = await c.env.CACHE_KV.list({ prefix: `event:${user.id}:` });
  
  const events = [];
  for (const key of eventsList.keys.slice(0, 100)) { // Limit to 100 recent events
    const eventData = await c.env.CACHE_KV.get(key.name);
    if (eventData) {
      events.push(JSON.parse(eventData));
    }
  }

  const response: APIResponse = {
    success: true,
    data: {
      recent_events: events,
      total_events: eventsList.keys.length,
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

export { app as analyticsRoutes };
