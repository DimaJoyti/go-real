package middleware

import (
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

// CORS middleware handles Cross-Origin Resource Sharing
func CORS(cfg config.CORSConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			for _, allowedOrigin := range cfg.AllowedOrigins {
				if allowedOrigin == "*" || allowedOrigin == origin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400")

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// ErrorHandler middleware provides centralized error handling
func ErrorHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic
				tracer := otel.Tracer("goreal-backend/middleware")
				_, span := tracer.Start(r.Context(), "panic_recovery")
				defer span.End()

				span.RecordError(fmt.Errorf("panic: %v", err))
				span.SetAttributes(
					attribute.String("error.type", "panic"),
					attribute.String("http.method", r.Method),
					attribute.String("http.url", r.URL.String()),
				)

				// Return 500 error
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(`{"error": "Internal server error", "message": "An unexpected error occurred"}`))
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// RequestLogger middleware logs HTTP requests
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Process request
		next.ServeHTTP(wrapped, r)

		// Log request details
		duration := time.Since(start)

		// Use OpenTelemetry for structured logging
		tracer := otel.Tracer("goreal-backend/middleware")
		_, span := tracer.Start(r.Context(), "http_request")
		defer span.End()

		span.SetAttributes(
			attribute.String("http.method", r.Method),
			attribute.String("http.url", r.URL.String()),
			attribute.String("http.user_agent", r.UserAgent()),
			attribute.String("http.remote_addr", getClientIP(r)),
			attribute.Int("http.status_code", wrapped.statusCode),
			attribute.Int64("http.duration_ms", duration.Milliseconds()),
		)

		if wrapped.statusCode >= 400 {
			span.SetAttributes(attribute.Bool("error", true))
		}
	})
}
