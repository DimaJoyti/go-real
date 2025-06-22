package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"goreal-backend/internal/config"
	"goreal-backend/internal/container"
	"goreal-backend/internal/handlers"
	"goreal-backend/internal/middleware"
	"goreal-backend/pkg/observability"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize observability
	shutdown, err := observability.Init(cfg.ServiceName, cfg.Environment)
	if err != nil {
		log.Fatalf("Failed to initialize observability: %v", err)
	}
	defer shutdown()

	// Initialize services
	serviceContainer, err := container.NewContainer()
	if err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}

	// Initialize handlers
	handlerContainer := handlers.NewContainer(
		serviceContainer.AuthService,
		serviceContainer.UserService,
		serviceContainer.ClientService,
		serviceContainer.LeadService,
		serviceContainer.SalesService,
		serviceContainer.TaskService,
		nil, // notificationService - not available in container yet
		serviceContainer.AnalyticsService,
	)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Observability)
	r.Use(middleware.RateLimiter(cfg.RateLimit))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORS.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"goreal-backend"}`))
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Use(middleware.JSONContentType)

		// Authentication routes (public)
		r.Route("/auth", handlerContainer.AuthHandler.Routes)

		// Protected routes (require authentication)
		r.Group(func(r chi.Router) {
			// Authentication middleware
			r.Use(middleware.AuthRequired(serviceContainer.AuthService))

			// User management routes
			r.Route("/users", handlerContainer.UserHandler.Routes)

			// Client management routes (require employee+ role)
			r.Group(func(r chi.Router) {
				r.Use(middleware.EmployeeOrAbove())
				r.Route("/clients", handlerContainer.ClientHandler.Routes)
			})

			// Task management routes
			r.Route("/tasks", handlerContainer.TaskHandler.Routes)

			// Admin-only routes
			r.Group(func(r chi.Router) {
				r.Use(middleware.AdminOnly())

				// TODO: Add admin-only routes
				// - System configuration
				// - User role management
				// - System analytics
			})

			// TODO: Add other routes when handlers are implemented
			// - Lead management routes
			// - Sales management routes
			// - Notification routes
			// - Analytics routes
		})
	})

	// Create server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
