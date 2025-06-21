import { Hono } from 'hono';
import { adminMiddleware, authMiddleware, optionalAuthMiddleware, userRateLimiter } from '../middleware/auth';
import type { APIResponse, Bindings, User } from '../types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// Protected route that requires authentication
app.get('/profile', authMiddleware, userRateLimiter, async (c) => {
  const user = c.get('user') as User;
  
  const response: APIResponse<User> = {
    success: true,
    data: user,
    message: 'User profile retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// Update user profile
app.put('/profile', authMiddleware, userRateLimiter, async (c) => {
  const user = c.get('user') as User;
  const updateData = await c.req.json();

  // Validate update data
  const allowedFields = ['full_name', 'avatar_url'];
  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {} as any);

  if (Object.keys(filteredData).length === 0) {
    return c.json({
      success: false,
      error: 'No valid fields to update',
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    // Proxy update request to Go backend
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-User-ID': user.id,
      },
      body: JSON.stringify(filteredData),
    });

    const responseData = await backendResponse.json() as any;

    if (!backendResponse.ok) {
      return c.json({
        success: false,
        error: responseData.error || 'Update failed',
        timestamp: new Date().toISOString(),
      }, backendResponse.status as any);
    }

    // Update session with new user data
    const sessionId = c.get('sessionId');
    const sessionData = await c.env.SESSION_KV.get(`session_id:${sessionId}`);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.user = { ...session.user, ...filteredData };
      
      await c.env.SESSION_KV.put(
        `session_id:${sessionId}`,
        JSON.stringify(session),
        { expirationTtl: 86400 } // 24 hours
      );
      
      await c.env.SESSION_KV.put(
        `session:${user.id}`,
        JSON.stringify(session),
        { expirationTtl: 86400 }
      );
    }

    const response: APIResponse = {
      success: true,
      data: responseData.data,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({
      success: false,
      error: 'Profile update service unavailable',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// Admin-only route
app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    // Proxy request to Go backend
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-Admin-User-ID': (c.get('user') as User).id,
      },
    });

    const responseData = await backendResponse.json() as any;
    return c.json(responseData, backendResponse.status as any);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return c.json({
      success: false,
      error: 'Admin service unavailable',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// Public route with optional authentication
app.get('/public/content', optionalAuthMiddleware, async (c) => {
  const user = c.get('user') as User | undefined;
  
  // Different content based on authentication status
  const content = user 
    ? `Welcome back, ${user.full_name || user.username}!`
    : 'Welcome, guest user!';

  const response: APIResponse = {
    success: true,
    data: {
      content,
      authenticated: !!user,
      user_id: user?.id,
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
});

// User preferences (cached)
app.get('/preferences', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const cacheKey = `user_preferences:${user.id}`;

  // Try to get from cache first
  const cachedPreferences = await c.env.CACHE_KV.get(cacheKey);
  
  if (cachedPreferences) {
    const response: APIResponse = {
      success: true,
      data: JSON.parse(cachedPreferences),
      message: 'Preferences retrieved from cache',
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  }

  try {
    // Fetch from backend if not in cache
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/users/${user.id}/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-User-ID': user.id,
      },
    });

    const responseData = await backendResponse.json() as any;

    if (backendResponse.ok) {
      // Cache the preferences for 1 hour
      await c.env.CACHE_KV.put(
        cacheKey,
        JSON.stringify(responseData.data),
        { expirationTtl: 3600 }
      );
    }

    return c.json(responseData, backendResponse.status as any);
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return c.json({
      success: false,
      error: 'Preferences service unavailable',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// Update user preferences
app.put('/preferences', authMiddleware, userRateLimiter, async (c) => {
  const user = c.get('user') as User;
  const preferences = await c.req.json();

  try {
    // Update preferences in backend
    const backendResponse = await fetch(`${c.env.GO_BACKEND_URL}/api/users/${user.id}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoReal-CloudflareWorker/1.0',
        'X-User-ID': user.id,
      },
      body: JSON.stringify(preferences),
    });

    const responseData = await backendResponse.json() as any;

    if (backendResponse.ok) {
      // Update cache
      const cacheKey = `user_preferences:${user.id}`;
      await c.env.CACHE_KV.put(
        cacheKey,
        JSON.stringify(responseData.data),
        { expirationTtl: 3600 }
      );
    }

    return c.json(responseData, backendResponse.status as any);
  } catch (error) {
    console.error('Preferences update error:', error);
    return c.json({
      success: false,
      error: 'Preferences update service unavailable',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

export { app as protectedRoutes };
