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

	"goreal-backend/internal/container"
	"goreal-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Create container with all dependencies
	container, err := container.NewContainer()
	if err != nil {
		log.Fatalf("Failed to create container: %v", err)
	}
	defer container.Close()

	// Get observability instance
	obs := container.Observability
	if obs == nil {
		log.Fatalf("Observability not initialized")
	}

	// Set Gin mode based on environment
	if container.GetConfig().Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create Gin router with no default middleware
	router := gin.New()

	// Add observability middleware
	obsMiddleware := middleware.NewObservabilityMiddleware(obs)
	healthChecker := obs.HealthChecker()

	// Apply all observability middleware
	for _, mw := range obsMiddleware.CombinedMiddleware(healthChecker) {
		router.Use(mw)
	}

	// Add CORS middleware
	router.Use(middleware.CORSMiddleware(container.GetConfig().CORS.AllowedOrigins))

	// Add rate limiting
	router.Use(middleware.RateLimitMiddleware(container.GetConfig().RateLimit.RequestsPerMinute))

	// Health check endpoints are handled by observability middleware

	// API routes
	api := router.Group("/api/v1")
	{
		// Authentication routes (no auth required)
		container.GetAuthHandler().RegisterRoutes(api)

		// Protected routes
		protected := api.Group("")
		protected.Use(container.GetAuthMiddleware().RequireAuth())
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", getUserProfile)
				users.PUT("/me", updateUserProfile)
				users.POST("/me/avatar", uploadAvatar)
			}

			// Lead routes
			leads := protected.Group("/leads")
			{
				leads.GET("", getLeads)
				leads.POST("", createLead)
				leads.GET("/:id", getLead)
				leads.PUT("/:id", updateLead)
				leads.DELETE("/:id", deleteLead)
				leads.POST("/:id/convert", convertLead)
				leads.POST("/:id/assign", assignLead)
			}

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(container.GetAuthMiddleware().RequireRole("admin"))
			{
				admin.GET("/users", getUsers)
				admin.POST("/users", createUser)
				admin.PUT("/users/:id", updateUser)
				admin.DELETE("/users/:id", deleteUser)
			}
		}
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", container.GetConfig().Port),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %d", container.GetConfig().Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// All middleware functions are now in the middleware package

// Placeholder handler functions (these would be implemented in separate handler files)
func getUserProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get user profile - not implemented"})
}

func updateUserProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update user profile - not implemented"})
}

func uploadAvatar(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload avatar - not implemented"})
}

func getLeads(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get leads - not implemented"})
}

func createLead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create lead - not implemented"})
}

func getLead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get lead - not implemented"})
}

func updateLead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update lead - not implemented"})
}

func deleteLead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete lead - not implemented"})
}

func convertLead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Convert lead - not implemented"})
}

func assignLead(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Assign lead - not implemented"})
}

func getUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get users - not implemented"})
}

func createUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create user - not implemented"})
}

func updateUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update user - not implemented"})
}

func deleteUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete user - not implemented"})
}
