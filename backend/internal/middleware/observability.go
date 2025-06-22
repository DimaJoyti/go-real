package middleware

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"goreal-backend/internal/observability"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

// ObservabilityMiddleware provides comprehensive observability for HTTP requests
type ObservabilityMiddleware struct {
	logger  *observability.Logger
	metrics *observability.MetricsCollector
	tracer  trace.Tracer
}

// NewObservabilityMiddleware creates a new observability middleware
func NewObservabilityMiddleware(obs *observability.Observability) *ObservabilityMiddleware {
	return &ObservabilityMiddleware{
		logger:  obs.Logger(),
		metrics: obs.Metrics(),
		tracer:  otel.Tracer("goreal-backend/http"),
	}
}

// TracingMiddleware adds OpenTelemetry tracing to requests
func (m *ObservabilityMiddleware) TracingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract trace context from headers
		ctx := otel.GetTextMapPropagator().Extract(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
		
		// Start span
		spanName := fmt.Sprintf("%s %s", c.Request.Method, c.FullPath())
		if spanName == " " {
			spanName = fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path)
		}
		
		ctx, span := m.tracer.Start(ctx, spanName)
		defer span.End()

		// Add request attributes
		span.SetAttributes(
			attribute.String("http.method", c.Request.Method),
			attribute.String("http.url", c.Request.URL.String()),
			attribute.String("http.route", c.FullPath()),
			attribute.String("http.user_agent", c.Request.UserAgent()),
			attribute.String("http.remote_addr", c.ClientIP()),
		)

		// Add request ID to context
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
			c.Header("X-Request-ID", requestID)
		}
		
		ctx = context.WithValue(ctx, "request_id", requestID)
		span.SetAttributes(attribute.String("request.id", requestID))

		// Set context for downstream handlers
		c.Request = c.Request.WithContext(ctx)

		c.Next()

		// Add response attributes
		statusCode := c.Writer.Status()
		span.SetAttributes(
			attribute.Int("http.status_code", statusCode),
			attribute.Int("http.response_size", c.Writer.Size()),
		)

		// Set span status based on HTTP status code
		if statusCode >= 400 {
			span.SetStatus(codes.Error, fmt.Sprintf("HTTP %d", statusCode))
			if statusCode >= 500 {
				span.RecordError(fmt.Errorf("HTTP %d: %s", statusCode, c.Errors.String()))
			}
		} else {
			span.SetStatus(codes.Ok, "")
		}

		// Inject trace context into response headers for debugging
		otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(c.Writer.Header()))
	}
}

// MetricsMiddleware adds metrics collection to requests
func (m *ObservabilityMiddleware) MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.metrics == nil {
			c.Next()
			return
		}

		start := time.Now()
		
		// Increment in-flight requests
		m.metrics.IncHTTPRequestsInFlight(c.Request.Context())
		defer m.metrics.DecHTTPRequestsInFlight(c.Request.Context())

		c.Next()

		// Record metrics
		duration := time.Since(start)
		statusCode := c.Writer.Status()
		method := c.Request.Method
		route := c.FullPath()
		if route == "" {
			route = "unknown"
		}

		m.metrics.RecordHTTPRequest(c.Request.Context(), method, route, statusCode, duration)
	}
}

// LoggingMiddleware adds structured logging to requests
func (m *ObservabilityMiddleware) LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.logger == nil {
			c.Next()
			return
		}

		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		// Calculate request duration
		duration := time.Since(start)
		statusCode := c.Writer.Status()

		// Get user ID from context if available
		userID := ""
		if user, exists := c.Get("user"); exists {
			if u, ok := user.(map[string]interface{}); ok {
				if id, ok := u["id"].(string); ok {
					userID = id
				}
			}
		}

		// Build full path
		if raw != "" {
			path = path + "?" + raw
		}

		// Log the request
		m.logger.LogHTTPRequest(
			c.Request.Context(),
			c.Request.Method,
			path,
			statusCode,
			duration,
			userID,
		)

		// Log errors if any
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				m.logger.Error(c.Request.Context(), "Request error", err.Err,
					"error_type", err.Type,
					"error_meta", err.Meta,
				)
			}
		}
	}
}

// ErrorHandlingMiddleware provides centralized error handling with observability
func (m *ObservabilityMiddleware) ErrorHandlingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				// Log panic
				err := fmt.Errorf("panic: %v", r)
				if m.logger != nil {
					m.logger.Error(c.Request.Context(), "Request panic", err,
						"method", c.Request.Method,
						"path", c.Request.URL.Path,
						"user_agent", c.Request.UserAgent(),
						"remote_addr", c.ClientIP(),
					)
				}

				// Record panic metric
				if m.metrics != nil {
					m.metrics.RecordPanic(c.Request.Context(), "http_handler")
				}

				// Record error in span
				if span := trace.SpanFromContext(c.Request.Context()); span.IsRecording() {
					span.RecordError(err)
					span.SetStatus(codes.Error, "panic")
				}

				// Return error response
				c.JSON(500, gin.H{
					"error": "Internal server error",
					"request_id": c.GetHeader("X-Request-ID"),
				})
				c.Abort()
			}
		}()

		c.Next()

		// Handle errors from handlers
		if len(c.Errors) > 0 {
			lastError := c.Errors.Last()
			
			// Record error metric
			if m.metrics != nil {
				m.metrics.RecordError(c.Request.Context(), "http_error", "handler")
			}

			// If no response was written, write error response
			if !c.Writer.Written() {
				statusCode := c.Writer.Status()
				if statusCode == 200 {
					statusCode = 500
				}

				c.JSON(statusCode, gin.H{
					"error": lastError.Error(),
					"request_id": c.GetHeader("X-Request-ID"),
				})
			}
		}
	}
}

// HealthCheckMiddleware provides health check endpoint
func (m *ObservabilityMiddleware) HealthCheckMiddleware(healthChecker *observability.HealthChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/health" {
			health := healthChecker.Check(c.Request.Context())
			
			statusCode := 200
			if health.Status != observability.HealthStatusHealthy {
				statusCode = 503
			}
			
			c.JSON(statusCode, health)
			c.Abort()
			return
		}
		
		if c.Request.URL.Path == "/health/ready" {
			readiness := healthChecker.GetReadiness(c.Request.Context())
			
			statusCode := 200
			if readiness.Status != observability.HealthStatusHealthy {
				statusCode = 503
			}
			
			c.JSON(statusCode, readiness)
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// CombinedMiddleware returns all observability middleware combined
func (m *ObservabilityMiddleware) CombinedMiddleware(healthChecker *observability.HealthChecker) []gin.HandlerFunc {
	return []gin.HandlerFunc{
		m.HealthCheckMiddleware(healthChecker),
		m.TracingMiddleware(),
		m.MetricsMiddleware(),
		m.LoggingMiddleware(),
		m.ErrorHandlingMiddleware(),
	}
}

// RequestIDMiddleware adds request ID to context
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		
		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)
		
		// Add to context for downstream services
		ctx := context.WithValue(c.Request.Context(), "request_id", requestID)
		c.Request = c.Request.WithContext(ctx)
		
		c.Next()
	}
}

// CORSMiddleware adds CORS headers with observability
func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}
		
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Request-ID")
		c.Header("Access-Control-Expose-Headers", "X-Request-ID, X-Trace-ID")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RateLimitMiddleware adds rate limiting with observability
func RateLimitMiddleware(requestsPerMinute int) gin.HandlerFunc {
	// This is a simple in-memory rate limiter
	// In production, you'd want to use Redis or similar
	clients := make(map[string][]time.Time)
	
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()
		
		// Clean old entries
		if requests, exists := clients[clientIP]; exists {
			var validRequests []time.Time
			cutoff := now.Add(-time.Minute)
			
			for _, reqTime := range requests {
				if reqTime.After(cutoff) {
					validRequests = append(validRequests, reqTime)
				}
			}
			clients[clientIP] = validRequests
		}
		
		// Check rate limit
		if len(clients[clientIP]) >= requestsPerMinute {
			c.Header("X-RateLimit-Limit", strconv.Itoa(requestsPerMinute))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", strconv.FormatInt(now.Add(time.Minute).Unix(), 10))
			
			c.JSON(429, gin.H{
				"error": "Rate limit exceeded",
				"request_id": c.GetHeader("X-Request-ID"),
			})
			c.Abort()
			return
		}
		
		// Add current request
		clients[clientIP] = append(clients[clientIP], now)
		
		// Add rate limit headers
		remaining := requestsPerMinute - len(clients[clientIP])
		c.Header("X-RateLimit-Limit", strconv.Itoa(requestsPerMinute))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(now.Add(time.Minute).Unix(), 10))
		
		c.Next()
	}
}
