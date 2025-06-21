import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { APIResponse, Bindings, User } from '../types/bindings';

// Extended context type for error handler
type ErrorContext = Context<{
  Bindings: Bindings;
  Variables: {
    user?: User;
    sessionId?: string;
  };
}>;

// Error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Log error to analytics
async function logError(
  c: Context<{ Bindings: Bindings }>,
  error: Error,
  statusCode: number
) {
  try {
    const user = (c as any).get('user') as User | undefined;
    const sessionId = (c as any).get('sessionId') as string | undefined;
    
    // Log to Analytics Engine
    if (c.env.ANALYTICS) {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [
          error.name,
          error.message,
          c.req.path,
          c.req.method,
          user?.id || 'anonymous',
          sessionId || 'no-session',
          c.req.header('User-Agent') || 'unknown',
          c.req.header('CF-Connecting-IP') || 'unknown',
        ],
        doubles: [statusCode, Date.now()],
        indexes: [error.name, c.req.path],
      });
    }
    
    // Log to console for development
    if (c.env.ENVIRONMENT === 'development') {
      console.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path: c.req.path,
        method: c.req.method,
        user: user?.id,
        statusCode,
      });
    }
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

// Main error handler
export async function errorHandler(
  error: Error,
  c: Context<{ Bindings: Bindings }>
): Promise<Response> {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle different error types
  if (error instanceof HTTPException) {
    statusCode = error.status;
    message = error.message;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    message = error.message;
    details = { field: error.field };
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    message = error.message;
  } else if (error instanceof UnauthorizedError) {
    statusCode = 401;
    message = error.message;
  } else if (error instanceof ForbiddenError) {
    statusCode = 403;
    message = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    message = error.message;
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    message = error.message;
  } else {
    // Unknown error - log it but don't expose details
    await logError(c, error, statusCode);
    
    if (c.env.ENVIRONMENT === 'development') {
      message = error.message;
      details = { stack: error.stack };
    }
  }

  // Log non-500 errors too for monitoring
  if (statusCode !== 500) {
    await logError(c, error, statusCode);
  }

  // Create error response
  const response: APIResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.data = details;
  }

  return c.json(response, statusCode as any);
}

// Async error wrapper for route handlers
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw error;
    });
  };
}

// Validation helper
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
}

export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`,
      fieldName
    );
  }
}
