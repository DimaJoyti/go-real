package middleware

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"goreal-backend/internal/config"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/time/rate"
)

// JSONContentType middleware sets JSON content type for API responses
func JSONContentType(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// Observability middleware adds OpenTelemetry tracing
func Observability(next http.Handler) http.Handler {
	tracer := otel.Tracer("goreal-backend")
	
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, span := tracer.Start(r.Context(), fmt.Sprintf("%s %s", r.Method, r.URL.Path))
		defer span.End()

		// Add attributes to span
		span.SetAttributes(
			attribute.String("http.method", r.Method),
			attribute.String("http.url", r.URL.String()),
			attribute.String("http.scheme", r.URL.Scheme),
			attribute.String("http.host", r.Host),
			attribute.String("http.user_agent", r.UserAgent()),
		)

		// Add trace ID to response headers
		if spanContext := trace.SpanContextFromContext(ctx); spanContext.HasTraceID() {
			w.Header().Set("X-Trace-ID", spanContext.TraceID().String())
		}

		// Create a response writer wrapper to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Continue with request
		next.ServeHTTP(wrapped, r.WithContext(ctx))

		// Add response attributes
		span.SetAttributes(attribute.Int("http.status_code", wrapped.statusCode))
		
		// Set span status based on HTTP status code
		if wrapped.statusCode >= 400 {
			span.SetAttributes(attribute.Bool("error", true))
		}
	})
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// RateLimiter creates a rate limiting middleware
func RateLimiter(cfg config.RateLimitConfig) func(http.Handler) http.Handler {
	// Create a map to store rate limiters for each IP
	limiters := make(map[string]*rate.Limiter)
	mu := sync.RWMutex{}

	// Cleanup function to remove old limiters
	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		
		for range ticker.C {
			mu.Lock()
			// In a real implementation, you'd want to track last access time
			// and remove limiters that haven't been used recently
			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getClientIP(r)
			
			mu.RLock()
			limiter, exists := limiters[ip]
			mu.RUnlock()

			if !exists {
				mu.Lock()
				limiter = rate.NewLimiter(
					rate.Limit(cfg.RequestsPerMinute)/60, // requests per second
					cfg.BurstSize,
				)
				limiters[ip] = limiter
				mu.Unlock()
			}

			if !limiter.Allow() {
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// getClientIP extracts the client IP address from the request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return xff
	}
	
	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	
	// Fall back to RemoteAddr
	return r.RemoteAddr
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Validate token format (Bearer <token>)
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		_ = authHeader[7:] // token unused for now
		
		// TODO: Validate JWT token and extract user information
		// For now, we'll add a placeholder user ID to context
		ctx := context.WithValue(r.Context(), "user_id", "placeholder-user-id")
		
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
