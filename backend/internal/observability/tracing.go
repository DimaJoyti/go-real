package observability

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	oteltrace "go.opentelemetry.io/otel/trace"
)

// TracingConfig holds tracing configuration
type TracingConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	JaegerEndpoint string
	OTLPEndpoint   string
	SampleRate     float64
	Enabled        bool
}

// TracingProvider manages OpenTelemetry tracing
type TracingProvider struct {
	provider *trace.TracerProvider
	config   *TracingConfig
}

// NewTracingProvider creates a new tracing provider
func NewTracingProvider(config *TracingConfig) (*TracingProvider, error) {
	if !config.Enabled {
		// Return a no-op provider
		return &TracingProvider{
			provider: trace.NewTracerProvider(),
			config:   config,
		}, nil
	}

	// Create resource with service information
	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			semconv.ServiceNameKey.String(config.ServiceName),
			semconv.ServiceVersionKey.String(config.ServiceVersion),
			semconv.DeploymentEnvironmentKey.String(config.Environment),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// Create exporters
	var exporters []trace.SpanExporter

	// Jaeger exporter
	if config.JaegerEndpoint != "" {
		jaegerExporter, err := jaeger.New(
			jaeger.WithCollectorEndpoint(
				jaeger.WithEndpoint(config.JaegerEndpoint),
			),
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create Jaeger exporter: %w", err)
		}
		exporters = append(exporters, jaegerExporter)
	}

	// OTLP exporter
	if config.OTLPEndpoint != "" {
		otlpExporter, err := otlptrace.New(
			context.Background(),
			otlptracehttp.NewClient(
				otlptracehttp.WithEndpoint(config.OTLPEndpoint),
				otlptracehttp.WithInsecure(), // Use WithTLSCredentials for production
			),
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create OTLP exporter: %w", err)
		}
		exporters = append(exporters, otlpExporter)
	}

	if len(exporters) == 0 {
		return nil, fmt.Errorf("no trace exporters configured")
	}

	// Create trace provider options
	opts := []trace.TracerProviderOption{
		trace.WithResource(res),
	}

	// Add exporters
	for _, exporter := range exporters {
		opts = append(opts, trace.WithBatcher(exporter))
	}

	// Add sampling
	if config.SampleRate > 0 && config.SampleRate <= 1.0 {
		opts = append(opts, trace.WithSampler(trace.TraceIDRatioBased(config.SampleRate)))
	}

	// Create trace provider
	tp := trace.NewTracerProvider(opts...)

	return &TracingProvider{
		provider: tp,
		config:   config,
	}, nil
}

// Initialize sets up global tracing
func (tp *TracingProvider) Initialize() {
	otel.SetTracerProvider(tp.provider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))
}

// Shutdown gracefully shuts down the tracing provider
func (tp *TracingProvider) Shutdown(ctx context.Context) error {
	return tp.provider.Shutdown(ctx)
}

// Tracer creates a new tracer for a component
func (tp *TracingProvider) Tracer(name string) oteltrace.Tracer {
	return tp.provider.Tracer(name)
}

// SpanBuilder helps build spans with common attributes
type SpanBuilder struct {
	tracer oteltrace.Tracer
	name   string
	attrs  []attribute.KeyValue
}

// NewSpanBuilder creates a new span builder
func NewSpanBuilder(tracer oteltrace.Tracer, name string) *SpanBuilder {
	return &SpanBuilder{
		tracer: tracer,
		name:   name,
		attrs:  make([]attribute.KeyValue, 0),
	}
}

// WithAttribute adds an attribute to the span
func (sb *SpanBuilder) WithAttribute(key string, value interface{}) *SpanBuilder {
	switch v := value.(type) {
	case string:
		sb.attrs = append(sb.attrs, attribute.String(key, v))
	case int:
		sb.attrs = append(sb.attrs, attribute.Int(key, v))
	case int64:
		sb.attrs = append(sb.attrs, attribute.Int64(key, v))
	case float64:
		sb.attrs = append(sb.attrs, attribute.Float64(key, v))
	case bool:
		sb.attrs = append(sb.attrs, attribute.Bool(key, v))
	default:
		sb.attrs = append(sb.attrs, attribute.String(key, fmt.Sprintf("%v", v)))
	}
	return sb
}

// WithUserID adds user ID attribute
func (sb *SpanBuilder) WithUserID(userID string) *SpanBuilder {
	return sb.WithAttribute("user.id", userID)
}

// WithComponent adds component attribute
func (sb *SpanBuilder) WithComponent(component string) *SpanBuilder {
	return sb.WithAttribute("component", component)
}

// WithOperation adds operation attribute
func (sb *SpanBuilder) WithOperation(operation string) *SpanBuilder {
	return sb.WithAttribute("operation", operation)
}

// WithHTTPRequest adds HTTP request attributes
func (sb *SpanBuilder) WithHTTPRequest(method, path string, statusCode int) *SpanBuilder {
	return sb.
		WithAttribute("http.method", method).
		WithAttribute("http.route", path).
		WithAttribute("http.status_code", statusCode)
}

// WithDatabaseQuery adds database query attributes
func (sb *SpanBuilder) WithDatabaseQuery(operation, table string) *SpanBuilder {
	return sb.
		WithAttribute("db.operation", operation).
		WithAttribute("db.table", table).
		WithAttribute("db.system", "supabase")
}

// Start creates and starts the span
func (sb *SpanBuilder) Start(ctx context.Context) (context.Context, oteltrace.Span) {
	return sb.tracer.Start(ctx, sb.name, oteltrace.WithAttributes(sb.attrs...))
}

// TraceOperation traces an operation with automatic error handling
func TraceOperation(ctx context.Context, tracer oteltrace.Tracer, name string, fn func(ctx context.Context) error) error {
	ctx, span := tracer.Start(ctx, name)
	defer span.End()

	err := fn(ctx)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "")
	}

	return err
}

// TraceHTTPHandler creates a span for HTTP handlers
func TraceHTTPHandler(tracer oteltrace.Tracer, operationName string, handler func(ctx context.Context) error) func(ctx context.Context) error {
	return func(ctx context.Context) error {
		return TraceOperation(ctx, tracer, operationName, handler)
	}
}

// TraceDatabaseOperation creates a span for database operations
func TraceDatabaseOperation(ctx context.Context, tracer oteltrace.Tracer, operation, table string, fn func(ctx context.Context) error) error {
	ctx, span := NewSpanBuilder(tracer, fmt.Sprintf("db.%s", operation)).
		WithDatabaseQuery(operation, table).
		Start(ctx)
	defer span.End()

	start := time.Now()
	err := fn(ctx)
	duration := time.Since(start)

	// Add timing attribute
	span.SetAttributes(attribute.Float64("db.duration", duration.Seconds()))

	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "")
	}

	return err
}

// TraceServiceOperation creates a span for service operations
func TraceServiceOperation(ctx context.Context, tracer oteltrace.Tracer, service, operation string, fn func(ctx context.Context) error) error {
	ctx, span := NewSpanBuilder(tracer, fmt.Sprintf("%s.%s", service, operation)).
		WithComponent(service).
		WithOperation(operation).
		Start(ctx)
	defer span.End()

	err := fn(ctx)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "")
	}

	return err
}

// AddSpanEvent adds an event to the current span
func AddSpanEvent(ctx context.Context, name string, attributes ...attribute.KeyValue) {
	span := oteltrace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.AddEvent(name, oteltrace.WithAttributes(attributes...))
	}
}

// SetSpanAttribute sets an attribute on the current span
func SetSpanAttribute(ctx context.Context, key string, value interface{}) {
	span := oteltrace.SpanFromContext(ctx)
	if span.IsRecording() {
		switch v := value.(type) {
		case string:
			span.SetAttributes(attribute.String(key, v))
		case int:
			span.SetAttributes(attribute.Int(key, v))
		case int64:
			span.SetAttributes(attribute.Int64(key, v))
		case float64:
			span.SetAttributes(attribute.Float64(key, v))
		case bool:
			span.SetAttributes(attribute.Bool(key, v))
		default:
			span.SetAttributes(attribute.String(key, fmt.Sprintf("%v", v)))
		}
	}
}

// RecordSpanError records an error on the current span
func RecordSpanError(ctx context.Context, err error) {
	span := oteltrace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}
}

// SetSpanSuccess marks the current span as successful
func SetSpanSuccess(ctx context.Context) {
	span := oteltrace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.SetStatus(codes.Ok, "")
	}
}

// GetTraceID returns the trace ID from the current context
func GetTraceID(ctx context.Context) string {
	span := oteltrace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		return span.SpanContext().TraceID().String()
	}
	return ""
}

// GetSpanID returns the span ID from the current context
func GetSpanID(ctx context.Context) string {
	span := oteltrace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		return span.SpanContext().SpanID().String()
	}
	return ""
}
