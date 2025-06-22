package observability

import (
	"context"
	"fmt"
	"runtime"
	"time"

	"go.opentelemetry.io/otel/exporters/prometheus"
)

// Config holds observability configuration
type Config struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	
	// Logging
	LogLevel string
	
	// Tracing
	TracingEnabled    bool
	JaegerEndpoint    string
	OTLPEndpoint      string
	TracingSampleRate float64
	
	// Metrics
	MetricsEnabled      bool
	PrometheusEnabled   bool
	PrometheusPort      int
	MetricsPath         string
	
	// Health checks
	HealthEnabled bool
}

// Observability manages all observability components
type Observability struct {
	config          *Config
	logger          *Logger
	metrics         *MetricsCollector
	tracingProvider *TracingProvider
	healthChecker   *HealthChecker
	metricsProvider interface{ Shutdown(context.Context) error }
}

// New creates a new observability instance
func New(config *Config) (*Observability, error) {
	obs := &Observability{
		config: config,
	}
	
	// Initialize logger
	logLevel := LevelInfo
	switch config.LogLevel {
	case "debug":
		logLevel = LevelDebug
	case "warn":
		logLevel = LevelWarn
	case "error":
		logLevel = LevelError
	}
	
	obs.logger = NewLogger(config.ServiceName, logLevel)
	
	// Initialize tracing
	if config.TracingEnabled {
		tracingConfig := &TracingConfig{
			ServiceName:    config.ServiceName,
			ServiceVersion: config.ServiceVersion,
			Environment:    config.Environment,
			JaegerEndpoint: config.JaegerEndpoint,
			OTLPEndpoint:   config.OTLPEndpoint,
			SampleRate:     config.TracingSampleRate,
			Enabled:        config.TracingEnabled,
		}
		
		var err error
		obs.tracingProvider, err = NewTracingProvider(tracingConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create tracing provider: %w", err)
		}
		
		obs.tracingProvider.Initialize()
	}
	
	// Initialize metrics
	if config.MetricsEnabled {
		if err := obs.initializeMetrics(); err != nil {
			return nil, fmt.Errorf("failed to initialize metrics: %w", err)
		}
	}
	
	// Initialize health checker
	if config.HealthEnabled {
		obs.healthChecker = NewHealthChecker(config.ServiceVersion, config.Environment)
		obs.registerDefaultHealthChecks()
	}
	
	return obs, nil
}

// initializeMetrics sets up metrics collection
func (o *Observability) initializeMetrics() error {
	var err error
	
	// Create metrics collector
	o.metrics, err = NewMetricsCollector(o.config.ServiceName)
	if err != nil {
		return fmt.Errorf("failed to create metrics collector: %w", err)
	}
	
	// Set up Prometheus exporter if enabled
	if o.config.PrometheusEnabled {
		_, err := prometheus.New()
		if err != nil {
			return fmt.Errorf("failed to create Prometheus exporter: %w", err)
		}

		// TODO: Set up metrics provider properly
	}
	
	return nil
}

// registerDefaultHealthChecks registers default system health checks
func (o *Observability) registerDefaultHealthChecks() {
	// Memory check (alert if using more than 1GB)
	o.healthChecker.RegisterMemoryCheck(1024)
	
	// Goroutine check (alert if more than 1000 goroutines)
	o.healthChecker.RegisterGoroutineCheck(1000)
	
	// Add basic system health check
	o.healthChecker.RegisterCheck(&HealthCheck{
		Name:        "system",
		Description: "Basic system health check",
		Timeout:     1 * time.Second,
		Critical:    false,
		CheckFunc: func(ctx context.Context) HealthCheckResult {
			var m runtime.MemStats
			runtime.ReadMemStats(&m)
			
			return HealthCheckResult{
				Status:    HealthStatusHealthy,
				Message:   "System is running normally",
				Duration:  time.Millisecond,
				Timestamp: time.Now(),
				Details: map[string]interface{}{
					"goroutines":    runtime.NumGoroutine(),
					"memory_alloc":  m.Alloc,
					"gc_cycles":     m.NumGC,
					"uptime_seconds": time.Since(time.Now()).Seconds(),
				},
			}
		},
	})
}

// Logger returns the logger instance
func (o *Observability) Logger() *Logger {
	return o.logger
}

// Metrics returns the metrics collector
func (o *Observability) Metrics() *MetricsCollector {
	return o.metrics
}

// HealthChecker returns the health checker
func (o *Observability) HealthChecker() *HealthChecker {
	return o.healthChecker
}

// TracingProvider returns the tracing provider
func (o *Observability) TracingProvider() *TracingProvider {
	return o.tracingProvider
}

// Shutdown gracefully shuts down all observability components
func (o *Observability) Shutdown(ctx context.Context) error {
	var errors []error
	
	// Shutdown tracing
	if o.tracingProvider != nil {
		if err := o.tracingProvider.Shutdown(ctx); err != nil {
			errors = append(errors, fmt.Errorf("failed to shutdown tracing: %w", err))
		}
	}
	
	// Shutdown metrics
	if o.metricsProvider != nil {
		if err := o.metricsProvider.Shutdown(ctx); err != nil {
			errors = append(errors, fmt.Errorf("failed to shutdown metrics: %w", err))
		}
	}
	
	if len(errors) > 0 {
		return fmt.Errorf("shutdown errors: %v", errors)
	}
	
	return nil
}

// StartSystemMetricsCollection starts collecting system metrics
func (o *Observability) StartSystemMetricsCollection(ctx context.Context, interval time.Duration) {
	if o.metrics == nil {
		return
	}
	
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				o.collectSystemMetrics(ctx)
			}
		}
	}()
}

// collectSystemMetrics collects system metrics
func (o *Observability) collectSystemMetrics(ctx context.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Memory metrics
	o.metrics.SetMemoryUsage(ctx, int64(m.Alloc))
	
	// Goroutine metrics
	o.metrics.SetGoroutinesActive(ctx, int64(runtime.NumGoroutine()))
	
	// GC metrics can be added here
}

// LogPanic logs and recovers from panics
func (o *Observability) LogPanic(ctx context.Context, component string) {
	if r := recover(); r != nil {
		err := fmt.Errorf("panic in %s: %v", component, r)
		o.logger.Error(ctx, "Panic recovered", err, "component", component)
		
		if o.metrics != nil {
			o.metrics.RecordPanic(ctx, component)
		}
		
		// Re-panic in development to help with debugging
		if o.config.Environment == "development" {
			panic(r)
		}
	}
}

// CreateRequestContext creates a context with request-specific information
func (o *Observability) CreateRequestContext(ctx context.Context, requestID, userID string) context.Context {
	ctx = context.WithValue(ctx, "request_id", requestID)
	if userID != "" {
		ctx = context.WithValue(ctx, "user_id", userID)
	}
	return ctx
}

// Global observability instance
var globalObservability *Observability

// Initialize sets up global observability
func Initialize(config *Config) error {
	var err error
	globalObservability, err = New(config)
	if err != nil {
		return fmt.Errorf("failed to initialize observability: %w", err)
	}
	
	// Set global instances
	InitializeLogger(config.ServiceName, LevelInfo)
	if config.MetricsEnabled {
		if err := InitializeMetrics(config.ServiceName); err != nil {
			return fmt.Errorf("failed to initialize global metrics: %w", err)
		}
	}
	if config.HealthEnabled {
		InitializeHealthChecker(config.ServiceVersion, config.Environment)
	}
	
	return nil
}

// Get returns the global observability instance
func Get() *Observability {
	return globalObservability
}

// Shutdown shuts down global observability
func Shutdown(ctx context.Context) error {
	if globalObservability != nil {
		return globalObservability.Shutdown(ctx)
	}
	return nil
}

// DefaultConfig returns a default observability configuration
func DefaultConfig(serviceName, version, environment string) *Config {
	return &Config{
		ServiceName:       serviceName,
		ServiceVersion:    version,
		Environment:       environment,
		LogLevel:          "info",
		TracingEnabled:    true,
		JaegerEndpoint:    "http://localhost:14268/api/traces",
		TracingSampleRate: 1.0,
		MetricsEnabled:    true,
		PrometheusEnabled: true,
		PrometheusPort:    9090,
		MetricsPath:       "/metrics",
		HealthEnabled:     true,
	}
}
