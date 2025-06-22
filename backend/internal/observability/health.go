package observability

import (
	"context"
	"fmt"
	"runtime"
	"sync"
	"time"
)

// HealthStatus represents the health status of a component
type HealthStatus string

const (
	HealthStatusHealthy   HealthStatus = "healthy"
	HealthStatusUnhealthy HealthStatus = "unhealthy"
	HealthStatusDegraded  HealthStatus = "degraded"
	HealthStatusUnknown   HealthStatus = "unknown"
)

// HealthCheck represents a single health check
type HealthCheck struct {
	Name        string                                      `json:"name"`
	Description string                                      `json:"description"`
	CheckFunc   func(ctx context.Context) HealthCheckResult `json:"-"`
	Timeout     time.Duration                               `json:"timeout"`
	Critical    bool                                        `json:"critical"`
}

// HealthCheckResult represents the result of a health check
type HealthCheckResult struct {
	Status    HealthStatus           `json:"status"`
	Message   string                 `json:"message,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
	Duration  time.Duration          `json:"duration"`
	Timestamp time.Time              `json:"timestamp"`
	Error     string                 `json:"error,omitempty"`
}

// OverallHealth represents the overall health of the system
type OverallHealth struct {
	Status      HealthStatus                    `json:"status"`
	Timestamp   time.Time                       `json:"timestamp"`
	Duration    time.Duration                   `json:"duration"`
	Version     string                          `json:"version"`
	Environment string                          `json:"environment"`
	Uptime      time.Duration                   `json:"uptime"`
	Checks      map[string]HealthCheckResult    `json:"checks"`
	System      SystemInfo                      `json:"system"`
}

// SystemInfo represents system information
type SystemInfo struct {
	GoVersion      string  `json:"go_version"`
	NumGoroutines  int     `json:"num_goroutines"`
	NumCPU         int     `json:"num_cpu"`
	MemoryAlloc    uint64  `json:"memory_alloc"`
	MemoryTotal    uint64  `json:"memory_total"`
	MemorySys      uint64  `json:"memory_sys"`
	GCPauseTotal   uint64  `json:"gc_pause_total"`
	NumGC          uint32  `json:"num_gc"`
	CPUUsage       float64 `json:"cpu_usage,omitempty"`
}

// HealthChecker manages health checks for the application
type HealthChecker struct {
	checks    map[string]*HealthCheck
	startTime time.Time
	version   string
	env       string
	mu        sync.RWMutex
	// tracer removed for simplicity
}

// NewHealthChecker creates a new health checker
func NewHealthChecker(version, environment string) *HealthChecker {
	return &HealthChecker{
		checks:    make(map[string]*HealthCheck),
		startTime: time.Now(),
		version:   version,
		env:       environment,
		// tracer removed for simplicity
	}
}

// RegisterCheck registers a new health check
func (hc *HealthChecker) RegisterCheck(check *HealthCheck) {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	
	if check.Timeout == 0 {
		check.Timeout = 5 * time.Second
	}
	
	hc.checks[check.Name] = check
}

// RegisterDatabaseCheck registers a database health check
func (hc *HealthChecker) RegisterDatabaseCheck(name string, checkFunc func(ctx context.Context) error) {
	hc.RegisterCheck(&HealthCheck{
		Name:        name,
		Description: "Database connectivity check",
		Timeout:     10 * time.Second,
		Critical:    true,
		CheckFunc: func(ctx context.Context) HealthCheckResult {
			start := time.Now()
			err := checkFunc(ctx)
			duration := time.Since(start)
			
			if err != nil {
				return HealthCheckResult{
					Status:    HealthStatusUnhealthy,
					Message:   "Database connection failed",
					Error:     err.Error(),
					Duration:  duration,
					Timestamp: time.Now(),
				}
			}
			
			return HealthCheckResult{
				Status:    HealthStatusHealthy,
				Message:   "Database connection successful",
				Duration:  duration,
				Timestamp: time.Now(),
				Details: map[string]interface{}{
					"response_time_ms": duration.Milliseconds(),
				},
			}
		},
	})
}

// RegisterExternalServiceCheck registers an external service health check
func (hc *HealthChecker) RegisterExternalServiceCheck(name, url string, checkFunc func(ctx context.Context) error) {
	hc.RegisterCheck(&HealthCheck{
		Name:        name,
		Description: fmt.Sprintf("External service check for %s", url),
		Timeout:     15 * time.Second,
		Critical:    false,
		CheckFunc: func(ctx context.Context) HealthCheckResult {
			start := time.Now()
			err := checkFunc(ctx)
			duration := time.Since(start)
			
			if err != nil {
				return HealthCheckResult{
					Status:    HealthStatusDegraded,
					Message:   fmt.Sprintf("External service %s is not responding", name),
					Error:     err.Error(),
					Duration:  duration,
					Timestamp: time.Now(),
					Details: map[string]interface{}{
						"url": url,
					},
				}
			}
			
			return HealthCheckResult{
				Status:    HealthStatusHealthy,
				Message:   fmt.Sprintf("External service %s is responding", name),
				Duration:  duration,
				Timestamp: time.Now(),
				Details: map[string]interface{}{
					"url":              url,
					"response_time_ms": duration.Milliseconds(),
				},
			}
		},
	})
}

// RegisterMemoryCheck registers a memory usage health check
func (hc *HealthChecker) RegisterMemoryCheck(maxMemoryMB uint64) {
	hc.RegisterCheck(&HealthCheck{
		Name:        "memory",
		Description: "Memory usage check",
		Timeout:     1 * time.Second,
		Critical:    false,
		CheckFunc: func(ctx context.Context) HealthCheckResult {
			var m runtime.MemStats
			runtime.ReadMemStats(&m)
			
			currentMemoryMB := m.Alloc / 1024 / 1024
			
			status := HealthStatusHealthy
			message := "Memory usage is normal"
			
			if currentMemoryMB > maxMemoryMB {
				status = HealthStatusDegraded
				message = "Memory usage is high"
			}
			
			return HealthCheckResult{
				Status:    status,
				Message:   message,
				Duration:  time.Millisecond,
				Timestamp: time.Now(),
				Details: map[string]interface{}{
					"current_memory_mb": currentMemoryMB,
					"max_memory_mb":     maxMemoryMB,
					"usage_percent":     float64(currentMemoryMB) / float64(maxMemoryMB) * 100,
				},
			}
		},
	})
}

// RegisterGoroutineCheck registers a goroutine count health check
func (hc *HealthChecker) RegisterGoroutineCheck(maxGoroutines int) {
	hc.RegisterCheck(&HealthCheck{
		Name:        "goroutines",
		Description: "Goroutine count check",
		Timeout:     1 * time.Second,
		Critical:    false,
		CheckFunc: func(ctx context.Context) HealthCheckResult {
			currentGoroutines := runtime.NumGoroutine()
			
			status := HealthStatusHealthy
			message := "Goroutine count is normal"
			
			if currentGoroutines > maxGoroutines {
				status = HealthStatusDegraded
				message = "High number of goroutines detected"
			}
			
			return HealthCheckResult{
				Status:    status,
				Message:   message,
				Duration:  time.Millisecond,
				Timestamp: time.Now(),
				Details: map[string]interface{}{
					"current_goroutines": currentGoroutines,
					"max_goroutines":     maxGoroutines,
				},
			}
		},
	})
}

// Check performs all health checks
func (hc *HealthChecker) Check(ctx context.Context) OverallHealth {
	start := time.Now()
	
	hc.mu.RLock()
	checks := make(map[string]*HealthCheck, len(hc.checks))
	for name, check := range hc.checks {
		checks[name] = check
	}
	hc.mu.RUnlock()
	
	results := make(map[string]HealthCheckResult)
	overallStatus := HealthStatusHealthy
	
	// Run checks concurrently
	var wg sync.WaitGroup
	var mu sync.Mutex
	
	for name, check := range checks {
		wg.Add(1)
		go func(name string, check *HealthCheck) {
			defer wg.Done()
			
			checkCtx, cancel := context.WithTimeout(ctx, check.Timeout)
			defer cancel()
			
			result := hc.runSingleCheck(checkCtx, check)
			
			mu.Lock()
			results[name] = result
			
			// Update overall status
			if check.Critical && result.Status == HealthStatusUnhealthy {
				overallStatus = HealthStatusUnhealthy
			} else if result.Status == HealthStatusDegraded && overallStatus == HealthStatusHealthy {
				overallStatus = HealthStatusDegraded
			}
			mu.Unlock()
		}(name, check)
	}
	
	wg.Wait()
	
	duration := time.Since(start)
	uptime := time.Since(hc.startTime)
	
	// Tracing removed for simplicity
	
	return OverallHealth{
		Status:      overallStatus,
		Timestamp:   time.Now(),
		Duration:    duration,
		Version:     hc.version,
		Environment: hc.env,
		Uptime:      uptime,
		Checks:      results,
		System:      hc.getSystemInfo(),
	}
}

// runSingleCheck runs a single health check with error recovery
func (hc *HealthChecker) runSingleCheck(ctx context.Context, check *HealthCheck) HealthCheckResult {
	defer func() {
		if r := recover(); r != nil {
			// Handle panic in health check
		}
	}()
	
	start := time.Now()
	
	result := check.CheckFunc(ctx)
	
	// Ensure duration is set
	if result.Duration == 0 {
		result.Duration = time.Since(start)
	}
	
	// Ensure timestamp is set
	if result.Timestamp.IsZero() {
		result.Timestamp = time.Now()
	}
	
	return result
}

// getSystemInfo collects system information
func (hc *HealthChecker) getSystemInfo() SystemInfo {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	return SystemInfo{
		GoVersion:     runtime.Version(),
		NumGoroutines: runtime.NumGoroutine(),
		NumCPU:        runtime.NumCPU(),
		MemoryAlloc:   m.Alloc,
		MemoryTotal:   m.TotalAlloc,
		MemorySys:     m.Sys,
		GCPauseTotal:  m.PauseTotalNs,
		NumGC:         m.NumGC,
	}
}

// IsHealthy returns true if the system is healthy
func (hc *HealthChecker) IsHealthy(ctx context.Context) bool {
	health := hc.Check(ctx)
	return health.Status == HealthStatusHealthy
}

// GetReadiness returns readiness status (critical checks only)
func (hc *HealthChecker) GetReadiness(ctx context.Context) OverallHealth {
	start := time.Now()
	
	hc.mu.RLock()
	criticalChecks := make(map[string]*HealthCheck)
	for name, check := range hc.checks {
		if check.Critical {
			criticalChecks[name] = check
		}
	}
	hc.mu.RUnlock()
	
	results := make(map[string]HealthCheckResult)
	overallStatus := HealthStatusHealthy
	
	for name, check := range criticalChecks {
		checkCtx, cancel := context.WithTimeout(ctx, check.Timeout)
		result := hc.runSingleCheck(checkCtx, check)
		cancel()
		
		results[name] = result
		
		if result.Status == HealthStatusUnhealthy {
			overallStatus = HealthStatusUnhealthy
		}
	}
	
	duration := time.Since(start)
	
	return OverallHealth{
		Status:      overallStatus,
		Timestamp:   time.Now(),
		Duration:    duration,
		Version:     hc.version,
		Environment: hc.env,
		Uptime:      time.Since(hc.startTime),
		Checks:      results,
		System:      hc.getSystemInfo(),
	}
}

// Global health checker instance
var defaultHealthChecker *HealthChecker

// InitializeHealthChecker initializes the global health checker
func InitializeHealthChecker(version, environment string) {
	defaultHealthChecker = NewHealthChecker(version, environment)
}

// GetHealthChecker returns the global health checker
func GetHealthChecker() *HealthChecker {
	if defaultHealthChecker == nil {
		defaultHealthChecker = NewHealthChecker("unknown", "development")
	}
	return defaultHealthChecker
}
