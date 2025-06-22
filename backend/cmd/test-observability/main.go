package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"goreal-backend/internal/observability"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize observability
	config := observability.DefaultConfig("test-service", "1.0.0", "development")
	config.TracingEnabled = true
	config.MetricsEnabled = true
	config.HealthEnabled = true
	
	obs, err := observability.New(config)
	if err != nil {
		log.Fatalf("Failed to initialize observability: %v", err)
	}
	defer obs.Shutdown(context.Background())

	// Get components
	logger := obs.Logger()
	metrics := obs.Metrics()
	healthChecker := obs.HealthChecker()

	// Register health checks
	healthChecker.RegisterDatabaseCheck("test-db", func(ctx context.Context) error {
		// Simulate database check
		time.Sleep(10 * time.Millisecond)
		return nil
	})

	healthChecker.RegisterExternalServiceCheck("test-api", "https://httpbin.org/status/200", func(ctx context.Context) error {
		// Simulate external service check
		resp, err := http.Get("https://httpbin.org/status/200")
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != 200 {
			return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
		}
		return nil
	})

	// Start system metrics collection
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	obs.StartSystemMetricsCollection(ctx, 5*time.Second)

	// Create Gin router
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	// Test endpoints
	router.GET("/test", func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Log request
		logger.Info(ctx, "Test endpoint called",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
		)

		// Record metrics
		metrics.RecordHTTPRequest(ctx, c.Request.Method, c.Request.URL.Path, 200, 50*time.Millisecond)

		c.JSON(200, gin.H{
			"message": "Test endpoint working",
			"timestamp": time.Now(),
		})
	})

	router.GET("/error", func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Log error
		err := fmt.Errorf("test error")
		logger.Error(ctx, "Test error endpoint", err)

		// Record error metric
		metrics.RecordError(ctx, "test_error", "handler")

		c.JSON(500, gin.H{
			"error": "Test error",
		})
	})

	router.GET("/health", func(c *gin.Context) {
		health := healthChecker.Check(c.Request.Context())
		
		statusCode := 200
		if health.Status != observability.HealthStatusHealthy {
			statusCode = 503
		}
		
		c.JSON(statusCode, health)
	})

	router.GET("/metrics-test", func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Test various metrics
		metrics.IncUsers(ctx, "test")
		metrics.IncLeads(ctx, "web", "new")
		metrics.RecordSale(ctx, 1000.0, "apartment")
		metrics.RecordLoginAttempt(ctx, true, "email")
		
		c.JSON(200, gin.H{
			"message": "Metrics recorded",
		})
	})

	// Start server
	fmt.Println("Starting test server on :8081")
	fmt.Println("Test endpoints:")
	fmt.Println("  GET /test - Test logging and metrics")
	fmt.Println("  GET /error - Test error handling")
	fmt.Println("  GET /health - Health check")
	fmt.Println("  GET /metrics-test - Test metrics recording")
	
	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
