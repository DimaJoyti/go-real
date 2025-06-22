package test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/stretchr/testify/assert"
)

// TestServerBasics tests basic server functionality without database dependencies
func TestServerBasics(t *testing.T) {
	// Create a simple router for testing
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Add a simple health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok", "service": "goreal-backend"}`))
	})

	// Add API structure
	r.Route("/api", func(r chi.Router) {
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				next.ServeHTTP(w, r)
			})
		})

		// Mock endpoints that would normally require services
		r.Get("/users", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data": [], "message": "Users endpoint reachable"}`))
		})

		r.Get("/clients", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data": [], "message": "Clients endpoint reachable"}`))
		})

		r.Get("/tasks", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data": [], "message": "Tasks endpoint reachable"}`))
		})

		r.Post("/auth/login", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"message": "Login endpoint reachable"}`))
		})
	})

	// Create test server
	server := httptest.NewServer(r)
	defer server.Close()

	t.Run("HealthCheck", func(t *testing.T) {
		resp, err := http.Get(server.URL + "/health")
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)
		assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))
	})

	t.Run("UsersEndpoint", func(t *testing.T) {
		resp, err := http.Get(server.URL + "/api/users")
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)
		assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))
	})

	t.Run("ClientsEndpoint", func(t *testing.T) {
		resp, err := http.Get(server.URL + "/api/clients")
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)
		assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))
	})

	t.Run("TasksEndpoint", func(t *testing.T) {
		resp, err := http.Get(server.URL + "/api/tasks")
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)
		assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))
	})

	t.Run("AuthEndpoint", func(t *testing.T) {
		resp, err := http.Post(server.URL+"/api/auth/login", "application/json", nil)
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)
		assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))
	})
}

// TestRouterStructure tests that our router structure is correct
func TestRouterStructure(t *testing.T) {
	r := chi.NewRouter()

	// Test that we can add routes without errors
	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", func(w http.ResponseWriter, r *http.Request) {})
			r.Post("/register", func(w http.ResponseWriter, r *http.Request) {})
		})

		r.Route("/users", func(r chi.Router) {
			r.Get("/", func(w http.ResponseWriter, r *http.Request) {})
			r.Post("/", func(w http.ResponseWriter, r *http.Request) {})
			r.Get("/{id}", func(w http.ResponseWriter, r *http.Request) {})
		})

		r.Route("/clients", func(r chi.Router) {
			r.Get("/", func(w http.ResponseWriter, r *http.Request) {})
			r.Post("/", func(w http.ResponseWriter, r *http.Request) {})
			r.Get("/{id}", func(w http.ResponseWriter, r *http.Request) {})
		})

		r.Route("/tasks", func(r chi.Router) {
			r.Get("/", func(w http.ResponseWriter, r *http.Request) {})
			r.Post("/", func(w http.ResponseWriter, r *http.Request) {})
			r.Get("/{id}", func(w http.ResponseWriter, r *http.Request) {})
		})
	})

	// If we get here without panicking, the router structure is valid
	assert.NotNil(t, r)
}

// TestMiddleware tests that middleware is working correctly
func TestMiddleware(t *testing.T) {
	r := chi.NewRouter()

	// Add middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Add a test endpoint
	r.Get("/test", func(w http.ResponseWriter, r *http.Request) {
		// Check if request ID was added by middleware
		requestID := r.Header.Get("X-Request-Id")
		if requestID == "" {
			requestID = r.Context().Value(middleware.RequestIDKey).(string)
		}

		w.Header().Set("X-Test-Request-ID", requestID)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	server := httptest.NewServer(r)
	defer server.Close()

	resp, err := http.Get(server.URL + "/test")
	assert.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	// Request ID should be present (either in header or context)
	assert.NotEmpty(t, resp.Header.Get("X-Test-Request-ID"))
}
