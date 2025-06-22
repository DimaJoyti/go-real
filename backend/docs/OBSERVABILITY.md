# GoReal Backend Observability

This document describes the comprehensive observability system implemented in the GoReal backend, including logging, metrics, tracing, and health checks.

## Overview

The observability system provides:

- **Structured Logging** with OpenTelemetry correlation
- **Metrics Collection** with Prometheus export
- **Distributed Tracing** with OTLP/Jaeger support
- **Health Checks** with dependency monitoring
- **Error Tracking** and panic recovery
- **Performance Monitoring** with automatic instrumentation

## Components

### 1. Structured Logging

**Location**: `internal/observability/logger.go`

Features:
- JSON structured logs with trace correlation
- Automatic OpenTelemetry trace/span ID injection
- Context-aware logging with user/request IDs
- Log levels: DEBUG, INFO, WARN, ERROR
- Source location tracking for errors
- Stack trace capture for debugging

**Usage**:
```go
logger := observability.GetLogger()
logger.Info(ctx, "User logged in", "user_id", userID, "method", "email")
logger.Error(ctx, "Database connection failed", err, "component", "auth")
```

### 2. Metrics Collection

**Location**: `internal/observability/metrics.go`

Metrics Categories:
- **HTTP Metrics**: Request count, duration, status codes
- **Database Metrics**: Query duration, connection pool
- **Business Metrics**: Users, leads, sales, NFTs
- **System Metrics**: Memory, CPU, goroutines
- **Error Metrics**: Error count by type and component
- **Authentication Metrics**: Login attempts, failures

**Usage**:
```go
metrics := observability.GetMetrics()
metrics.RecordHTTPRequest(ctx, "GET", "/api/users", 200, duration)
metrics.IncUsers(ctx, "premium")
metrics.RecordError(ctx, "validation_error", "user_service")
```

### 3. Distributed Tracing

**Location**: `internal/observability/tracing.go`

Features:
- OpenTelemetry-based distributed tracing
- Automatic span creation and correlation
- Support for Jaeger and OTLP exporters
- Custom span attributes and events
- Error recording and status tracking
- Trace sampling configuration

**Usage**:
```go
tracer := otel.Tracer("goreal-backend/service")
ctx, span := tracer.Start(ctx, "user.create")
defer span.End()

span.SetAttributes(attribute.String("user.email", email))
if err != nil {
    span.RecordError(err)
    span.SetStatus(codes.Error, err.Error())
}
```

### 4. Health Checks

**Location**: `internal/observability/health.go`

Health Check Types:
- **Database Connectivity**: Connection and query tests
- **External Services**: API endpoint availability
- **System Resources**: Memory and goroutine limits
- **Custom Checks**: Application-specific health

**Endpoints**:
- `GET /health` - Overall health status
- `GET /health/ready` - Readiness check (critical services only)

**Usage**:
```go
healthChecker := observability.GetHealthChecker()
healthChecker.RegisterDatabaseCheck("postgres", func(ctx context.Context) error {
    return db.PingContext(ctx)
})
```

## Configuration

**Environment Variables**:

```bash
# Logging
LOG_LEVEL=info

# Tracing
JAEGER_ENDPOINT=http://localhost:14268/api/traces
OTLP_ENDPOINT=http://localhost:4318/v1/traces
TRACING_SAMPLE_RATE=1.0

# Metrics
PROMETHEUS_PORT=9090
METRICS_PATH=/metrics

# Health Checks
HEALTH_CHECK_TIMEOUT=5s
```

**Code Configuration**:
```go
config := &observability.Config{
    ServiceName:       "goreal-backend",
    ServiceVersion:    "1.0.0",
    Environment:       "production",
    LogLevel:          "info",
    TracingEnabled:    true,
    MetricsEnabled:    true,
    HealthEnabled:     true,
    JaegerEndpoint:    "http://localhost:14268/api/traces",
    TracingSampleRate: 1.0,
}
```

## Middleware Integration

**Location**: `internal/middleware/observability.go`

The observability middleware provides automatic instrumentation for HTTP requests:

```go
// Apply all observability middleware
obsMiddleware := middleware.NewObservabilityMiddleware(obs)
router.Use(obsMiddleware.TracingMiddleware())
router.Use(obsMiddleware.MetricsMiddleware())
router.Use(obsMiddleware.LoggingMiddleware())
router.Use(obsMiddleware.ErrorHandlingMiddleware())
```

**Features**:
- Automatic request/response logging
- HTTP metrics collection
- Distributed tracing with span creation
- Error handling and panic recovery
- Request ID generation and propagation
- CORS and rate limiting with observability

## Monitoring Setup

### 1. Jaeger (Tracing)

```bash
# Run Jaeger all-in-one
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

Access UI: http://localhost:16686

### 2. Prometheus (Metrics)

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'goreal-backend'
    static_configs:
      - targets: ['localhost:9090']
```

### 3. Grafana (Dashboards)

Import dashboards for:
- HTTP request metrics
- Database performance
- Business metrics (users, leads, sales)
- System metrics (memory, CPU)
- Error rates and SLA monitoring

## Best Practices

### 1. Logging

```go
// ✅ Good: Structured logging with context
logger.Info(ctx, "User created successfully",
    "user_id", user.ID,
    "email", user.Email,
    "role", user.Role,
)

// ❌ Bad: Unstructured logging
log.Printf("User %s created with email %s", user.ID, user.Email)
```

### 2. Metrics

```go
// ✅ Good: Meaningful labels
metrics.RecordHTTPRequest(ctx, method, route, statusCode, duration)

// ❌ Bad: High cardinality labels
metrics.RecordHTTPRequest(ctx, method, fullURL, statusCode, duration)
```

### 3. Tracing

```go
// ✅ Good: Descriptive span names and attributes
ctx, span := tracer.Start(ctx, "user.authenticate")
span.SetAttributes(
    attribute.String("auth.method", "email"),
    attribute.String("user.role", role),
)

// ❌ Bad: Generic span names
ctx, span := tracer.Start(ctx, "process")
```

### 4. Error Handling

```go
// ✅ Good: Comprehensive error context
if err != nil {
    logger.Error(ctx, "Failed to create user", err,
        "operation", "user.create",
        "email", req.Email,
    )
    metrics.RecordError(ctx, "user_creation_failed", "user_service")
    span.RecordError(err)
    return nil, fmt.Errorf("user creation failed: %w", err)
}
```

## Testing

Run the observability test server:

```bash
cd backend
go run cmd/test-observability/main.go
```

Test endpoints:
- `GET http://localhost:8081/test` - Test logging and metrics
- `GET http://localhost:8081/error` - Test error handling
- `GET http://localhost:8081/health` - Health check
- `GET http://localhost:8081/metrics-test` - Test metrics recording

## Troubleshooting

### Common Issues

1. **Missing Traces**: Check Jaeger endpoint configuration
2. **No Metrics**: Verify Prometheus scraping configuration
3. **Health Check Failures**: Review dependency configurations
4. **High Memory Usage**: Adjust trace sampling rate

### Debug Commands

```bash
# Check health status
curl http://localhost:8080/health

# Check readiness
curl http://localhost:8080/health/ready

# View metrics (if Prometheus endpoint enabled)
curl http://localhost:8080/metrics
```

## Performance Impact

The observability system is designed for minimal performance impact:

- **Logging**: ~1-2% CPU overhead
- **Metrics**: ~0.5% CPU overhead  
- **Tracing**: ~2-5% CPU overhead (depends on sampling rate)
- **Health Checks**: Configurable intervals, minimal impact

Recommended production settings:
- Trace sampling rate: 0.1 (10%)
- Log level: INFO or WARN
- Health check interval: 30s
- Metrics collection interval: 15s
