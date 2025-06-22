package observability

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

// MetricsCollector provides application metrics collection
type MetricsCollector struct {
	meter metric.Meter

	// HTTP metrics
	httpRequestsTotal    metric.Int64Counter
	httpRequestDuration  metric.Float64Histogram
	httpRequestsInFlight metric.Int64UpDownCounter

	// Database metrics
	dbConnectionsActive metric.Int64UpDownCounter
	dbQueryDuration     metric.Float64Histogram
	dbQueriesTotal      metric.Int64Counter

	// Business metrics
	usersTotal          metric.Int64UpDownCounter
	leadsTotal          metric.Int64UpDownCounter
	salesTotal          metric.Int64Counter
	nftsTotal           metric.Int64UpDownCounter
	challengesTotal     metric.Int64UpDownCounter

	// System metrics
	memoryUsage         metric.Int64UpDownCounter
	cpuUsage           metric.Float64Gauge
	goroutinesActive   metric.Int64UpDownCounter

	// Error metrics
	errorsTotal        metric.Int64Counter
	panicTotal         metric.Int64Counter

	// Authentication metrics
	loginAttempts      metric.Int64Counter
	tokenRefreshes     metric.Int64Counter
	authFailures       metric.Int64Counter
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector(serviceName string) (*MetricsCollector, error) {
	meter := otel.Meter(serviceName)

	// Initialize HTTP metrics
	httpRequestsTotal, err := meter.Int64Counter(
		"http_requests_total",
		metric.WithDescription("Total number of HTTP requests"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create http_requests_total counter: %w", err)
	}

	httpRequestDuration, err := meter.Float64Histogram(
		"http_request_duration_seconds",
		metric.WithDescription("HTTP request duration in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create http_request_duration histogram: %w", err)
	}

	httpRequestsInFlight, err := meter.Int64UpDownCounter(
		"http_requests_in_flight",
		metric.WithDescription("Number of HTTP requests currently being processed"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create http_requests_in_flight counter: %w", err)
	}

	// Initialize database metrics
	dbConnectionsActive, err := meter.Int64UpDownCounter(
		"db_connections_active",
		metric.WithDescription("Number of active database connections"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create db_connections_active counter: %w", err)
	}

	dbQueryDuration, err := meter.Float64Histogram(
		"db_query_duration_seconds",
		metric.WithDescription("Database query duration in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create db_query_duration histogram: %w", err)
	}

	dbQueriesTotal, err := meter.Int64Counter(
		"db_queries_total",
		metric.WithDescription("Total number of database queries"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create db_queries_total counter: %w", err)
	}

	// Initialize business metrics
	usersTotal, err := meter.Int64UpDownCounter(
		"users_total",
		metric.WithDescription("Total number of users"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create users_total counter: %w", err)
	}

	leadsTotal, err := meter.Int64UpDownCounter(
		"leads_total",
		metric.WithDescription("Total number of leads"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create leads_total counter: %w", err)
	}

	salesTotal, err := meter.Int64Counter(
		"sales_total",
		metric.WithDescription("Total number of sales"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create sales_total counter: %w", err)
	}

	nftsTotal, err := meter.Int64UpDownCounter(
		"nfts_total",
		metric.WithDescription("Total number of NFTs"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create nfts_total counter: %w", err)
	}

	challengesTotal, err := meter.Int64UpDownCounter(
		"challenges_total",
		metric.WithDescription("Total number of challenges"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create challenges_total counter: %w", err)
	}

	// Initialize system metrics
	memoryUsage, err := meter.Int64UpDownCounter(
		"memory_usage_bytes",
		metric.WithDescription("Memory usage in bytes"),
		metric.WithUnit("By"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create memory_usage counter: %w", err)
	}

	cpuUsage, err := meter.Float64Gauge(
		"cpu_usage_percent",
		metric.WithDescription("CPU usage percentage"),
		metric.WithUnit("%"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create cpu_usage gauge: %w", err)
	}

	goroutinesActive, err := meter.Int64UpDownCounter(
		"goroutines_active",
		metric.WithDescription("Number of active goroutines"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create goroutines_active counter: %w", err)
	}

	// Initialize error metrics
	errorsTotal, err := meter.Int64Counter(
		"errors_total",
		metric.WithDescription("Total number of errors"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create errors_total counter: %w", err)
	}

	panicTotal, err := meter.Int64Counter(
		"panics_total",
		metric.WithDescription("Total number of panics"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create panics_total counter: %w", err)
	}

	// Initialize authentication metrics
	loginAttempts, err := meter.Int64Counter(
		"login_attempts_total",
		metric.WithDescription("Total number of login attempts"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create login_attempts counter: %w", err)
	}

	tokenRefreshes, err := meter.Int64Counter(
		"token_refreshes_total",
		metric.WithDescription("Total number of token refreshes"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create token_refreshes counter: %w", err)
	}

	authFailures, err := meter.Int64Counter(
		"auth_failures_total",
		metric.WithDescription("Total number of authentication failures"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth_failures counter: %w", err)
	}

	return &MetricsCollector{
		meter:                meter,
		httpRequestsTotal:    httpRequestsTotal,
		httpRequestDuration:  httpRequestDuration,
		httpRequestsInFlight: httpRequestsInFlight,
		dbConnectionsActive:  dbConnectionsActive,
		dbQueryDuration:      dbQueryDuration,
		dbQueriesTotal:       dbQueriesTotal,
		usersTotal:          usersTotal,
		leadsTotal:          leadsTotal,
		salesTotal:          salesTotal,
		nftsTotal:           nftsTotal,
		challengesTotal:     challengesTotal,
		memoryUsage:         memoryUsage,
		cpuUsage:           cpuUsage,
		goroutinesActive:   goroutinesActive,
		errorsTotal:        errorsTotal,
		panicTotal:         panicTotal,
		loginAttempts:      loginAttempts,
		tokenRefreshes:     tokenRefreshes,
		authFailures:       authFailures,
	}, nil
}

// HTTP Metrics
func (m *MetricsCollector) RecordHTTPRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration) {
	labels := []attribute.KeyValue{
		attribute.String("method", method),
		attribute.String("path", path),
		attribute.Int("status_code", statusCode),
	}

	m.httpRequestsTotal.Add(ctx, 1, metric.WithAttributes(labels...))
	m.httpRequestDuration.Record(ctx, duration.Seconds(), metric.WithAttributes(labels...))
}

func (m *MetricsCollector) IncHTTPRequestsInFlight(ctx context.Context) {
	m.httpRequestsInFlight.Add(ctx, 1)
}

func (m *MetricsCollector) DecHTTPRequestsInFlight(ctx context.Context) {
	m.httpRequestsInFlight.Add(ctx, -1)
}

// Database Metrics
func (m *MetricsCollector) RecordDBQuery(ctx context.Context, operation string, duration time.Duration, success bool) {
	labels := []attribute.KeyValue{
		attribute.String("operation", operation),
		attribute.Bool("success", success),
	}

	m.dbQueriesTotal.Add(ctx, 1, metric.WithAttributes(labels...))
	m.dbQueryDuration.Record(ctx, duration.Seconds(), metric.WithAttributes(labels...))
}

func (m *MetricsCollector) SetDBConnectionsActive(ctx context.Context, count int64) {
	m.dbConnectionsActive.Add(ctx, count)
}

// Business Metrics
func (m *MetricsCollector) IncUsers(ctx context.Context, userType string) {
	m.usersTotal.Add(ctx, 1, metric.WithAttributes(attribute.String("type", userType)))
}

func (m *MetricsCollector) DecUsers(ctx context.Context, userType string) {
	m.usersTotal.Add(ctx, -1, metric.WithAttributes(attribute.String("type", userType)))
}

func (m *MetricsCollector) IncLeads(ctx context.Context, source, status string) {
	labels := []attribute.KeyValue{
		attribute.String("source", source),
		attribute.String("status", status),
	}
	m.leadsTotal.Add(ctx, 1, metric.WithAttributes(labels...))
}

func (m *MetricsCollector) DecLeads(ctx context.Context, source, status string) {
	labels := []attribute.KeyValue{
		attribute.String("source", source),
		attribute.String("status", status),
	}
	m.leadsTotal.Add(ctx, -1, metric.WithAttributes(labels...))
}

func (m *MetricsCollector) RecordSale(ctx context.Context, amount float64, propertyType string) {
	labels := []attribute.KeyValue{
		attribute.String("property_type", propertyType),
		attribute.Float64("amount", amount),
	}
	m.salesTotal.Add(ctx, 1, metric.WithAttributes(labels...))
}

func (m *MetricsCollector) IncNFTs(ctx context.Context, nftType string) {
	m.nftsTotal.Add(ctx, 1, metric.WithAttributes(attribute.String("type", nftType)))
}

func (m *MetricsCollector) IncChallenges(ctx context.Context, challengeType string) {
	m.challengesTotal.Add(ctx, 1, metric.WithAttributes(attribute.String("type", challengeType)))
}

// System Metrics
func (m *MetricsCollector) SetMemoryUsage(ctx context.Context, bytes int64) {
	m.memoryUsage.Add(ctx, bytes)
}

func (m *MetricsCollector) SetCPUUsage(ctx context.Context, percent float64) {
	m.cpuUsage.Record(ctx, percent)
}

func (m *MetricsCollector) SetGoroutinesActive(ctx context.Context, count int64) {
	m.goroutinesActive.Add(ctx, count)
}

// Error Metrics
func (m *MetricsCollector) RecordError(ctx context.Context, errorType, component string) {
	labels := []attribute.KeyValue{
		attribute.String("type", errorType),
		attribute.String("component", component),
	}
	m.errorsTotal.Add(ctx, 1, metric.WithAttributes(labels...))
}

func (m *MetricsCollector) RecordPanic(ctx context.Context, component string) {
	m.panicTotal.Add(ctx, 1, metric.WithAttributes(attribute.String("component", component)))
}

// Authentication Metrics
func (m *MetricsCollector) RecordLoginAttempt(ctx context.Context, success bool, method string) {
	labels := []attribute.KeyValue{
		attribute.Bool("success", success),
		attribute.String("method", method),
	}
	m.loginAttempts.Add(ctx, 1, metric.WithAttributes(labels...))
}

func (m *MetricsCollector) RecordTokenRefresh(ctx context.Context, success bool) {
	m.tokenRefreshes.Add(ctx, 1, metric.WithAttributes(attribute.Bool("success", success)))
}

func (m *MetricsCollector) RecordAuthFailure(ctx context.Context, reason string) {
	m.authFailures.Add(ctx, 1, metric.WithAttributes(attribute.String("reason", reason)))
}

// Global metrics instance
var defaultMetrics *MetricsCollector

// InitializeMetrics initializes the global metrics collector
func InitializeMetrics(serviceName string) error {
	var err error
	defaultMetrics, err = NewMetricsCollector(serviceName)
	return err
}

// GetMetrics returns the global metrics collector
func GetMetrics() *MetricsCollector {
	return defaultMetrics
}
