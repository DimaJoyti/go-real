package observability

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"runtime"
	"time"

	"go.opentelemetry.io/otel/trace"
)

// LogLevel represents the severity level of a log entry
type LogLevel string

const (
	LevelDebug LogLevel = "debug"
	LevelInfo  LogLevel = "info"
	LevelWarn  LogLevel = "warn"
	LevelError LogLevel = "error"
)

// Logger provides structured logging with OpenTelemetry integration
type Logger struct {
	slogger *slog.Logger
	level   slog.Level
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp   time.Time              `json:"timestamp"`
	Level       string                 `json:"level"`
	Message     string                 `json:"message"`
	Service     string                 `json:"service"`
	TraceID     string                 `json:"trace_id,omitempty"`
	SpanID      string                 `json:"span_id,omitempty"`
	UserID      string                 `json:"user_id,omitempty"`
	RequestID   string                 `json:"request_id,omitempty"`
	Component   string                 `json:"component,omitempty"`
	Operation   string                 `json:"operation,omitempty"`
	Duration    *time.Duration         `json:"duration,omitempty"`
	Error       string                 `json:"error,omitempty"`
	StackTrace  string                 `json:"stack_trace,omitempty"`
	Fields      map[string]interface{} `json:"fields,omitempty"`
	Source      *SourceLocation        `json:"source,omitempty"`
}

// SourceLocation represents the source code location of a log entry
type SourceLocation struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	Function string `json:"function"`
}

// NewLogger creates a new structured logger
func NewLogger(serviceName string, level LogLevel) *Logger {
	var slogLevel slog.Level
	switch level {
	case LevelDebug:
		slogLevel = slog.LevelDebug
	case LevelInfo:
		slogLevel = slog.LevelInfo
	case LevelWarn:
		slogLevel = slog.LevelWarn
	case LevelError:
		slogLevel = slog.LevelError
	default:
		slogLevel = slog.LevelInfo
	}

	// Create custom handler for JSON output with OpenTelemetry integration
	handler := &customHandler{
		serviceName: serviceName,
		level:       slogLevel,
	}

	return &Logger{
		slogger: slog.New(handler),
		level:   slogLevel,
	}
}

// customHandler implements slog.Handler with OpenTelemetry integration
type customHandler struct {
	serviceName string
	level       slog.Level
}

func (h *customHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return level >= h.level
}

func (h *customHandler) Handle(ctx context.Context, record slog.Record) error {
	entry := LogEntry{
		Timestamp: record.Time,
		Level:     record.Level.String(),
		Message:   record.Message,
		Service:   h.serviceName,
		Fields:    make(map[string]interface{}),
	}

	// Extract OpenTelemetry trace information
	if span := trace.SpanFromContext(ctx); span.SpanContext().IsValid() {
		entry.TraceID = span.SpanContext().TraceID().String()
		entry.SpanID = span.SpanContext().SpanID().String()
	}

	// Extract user ID from context if available
	if userID, ok := ctx.Value("user_id").(string); ok {
		entry.UserID = userID
	}

	// Extract request ID from context if available
	if requestID, ok := ctx.Value("request_id").(string); ok {
		entry.RequestID = requestID
	}

	// Add source location for error and warn levels
	if record.Level >= slog.LevelWarn {
		if pc, file, line, ok := runtime.Caller(4); ok {
			entry.Source = &SourceLocation{
				File:     file,
				Line:     line,
				Function: runtime.FuncForPC(pc).Name(),
			}
		}
	}

	// Process attributes
	record.Attrs(func(attr slog.Attr) bool {
		switch attr.Key {
		case "component":
			entry.Component = attr.Value.String()
		case "operation":
			entry.Operation = attr.Value.String()
		case "duration":
			if d, ok := attr.Value.Any().(time.Duration); ok {
				entry.Duration = &d
			}
		case "error":
			entry.Error = attr.Value.String()
		case "stack_trace":
			entry.StackTrace = attr.Value.String()
		default:
			entry.Fields[attr.Key] = attr.Value.Any()
		}
		return true
	})

	// Marshal to JSON and write to stdout
	data, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("failed to marshal log entry: %w", err)
	}

	fmt.Fprintln(os.Stdout, string(data))
	return nil
}

func (h *customHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	// For simplicity, return the same handler
	// In a production implementation, you might want to store these attrs
	return h
}

func (h *customHandler) WithGroup(name string) slog.Handler {
	// For simplicity, return the same handler
	// In a production implementation, you might want to handle groups
	return h
}

// WithContext creates a new logger with context-specific information
func (l *Logger) WithContext(ctx context.Context) *Logger {
	return &Logger{
		slogger: l.slogger.With(),
		level:   l.level,
	}
}

// WithComponent creates a new logger with a component name
func (l *Logger) WithComponent(component string) *Logger {
	return &Logger{
		slogger: l.slogger.With("component", component),
		level:   l.level,
	}
}

// WithOperation creates a new logger with an operation name
func (l *Logger) WithOperation(operation string) *Logger {
	return &Logger{
		slogger: l.slogger.With("operation", operation),
		level:   l.level,
	}
}

// Debug logs a debug message
func (l *Logger) Debug(ctx context.Context, msg string, args ...any) {
	l.slogger.DebugContext(ctx, msg, args...)
}

// Info logs an info message
func (l *Logger) Info(ctx context.Context, msg string, args ...any) {
	l.slogger.InfoContext(ctx, msg, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(ctx context.Context, msg string, args ...any) {
	l.slogger.WarnContext(ctx, msg, args...)
}

// Error logs an error message
func (l *Logger) Error(ctx context.Context, msg string, err error, args ...any) {
	attrs := make([]any, 0, len(args)+2)
	if err != nil {
		attrs = append(attrs, "error", err.Error())
		
		// Add stack trace for errors
		if l.level <= slog.LevelDebug {
			attrs = append(attrs, "stack_trace", getStackTrace())
		}
	}
	attrs = append(attrs, args...)
	
	l.slogger.ErrorContext(ctx, msg, attrs...)
}

// LogOperation logs the start and end of an operation with duration
func (l *Logger) LogOperation(ctx context.Context, operation string, fn func() error) error {
	start := time.Now()
	
	l.slogger.InfoContext(ctx, "Operation started",
		"operation", operation,
	)
	
	err := fn()
	duration := time.Since(start)
	
	if err != nil {
		l.slogger.ErrorContext(ctx, "Operation failed",
			"operation", operation,
			"duration", duration,
			"error", err.Error(),
		)
	} else {
		l.slogger.InfoContext(ctx, "Operation completed",
			"operation", operation,
			"duration", duration,
		)
	}
	
	return err
}

// LogHTTPRequest logs HTTP request details
func (l *Logger) LogHTTPRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration, userID string) {
	level := slog.LevelInfo
	if statusCode >= 400 {
		level = slog.LevelWarn
	}
	if statusCode >= 500 {
		level = slog.LevelError
	}

	l.slogger.Log(ctx, level, "HTTP request",
		"http.method", method,
		"http.path", path,
		"http.status_code", statusCode,
		"duration", duration,
		"user_id", userID,
	)
}

// LogDatabaseQuery logs database query details
func (l *Logger) LogDatabaseQuery(ctx context.Context, query string, duration time.Duration, err error) {
	if err != nil {
		l.slogger.ErrorContext(ctx, "Database query failed",
			"query", query,
			"duration", duration,
			"error", err.Error(),
		)
	} else {
		l.slogger.DebugContext(ctx, "Database query executed",
			"query", query,
			"duration", duration,
		)
	}
}

// getStackTrace returns a formatted stack trace
func getStackTrace() string {
	buf := make([]byte, 1024)
	for {
		n := runtime.Stack(buf, false)
		if n < len(buf) {
			return string(buf[:n])
		}
		buf = make([]byte, 2*len(buf))
	}
}

// Global logger instance
var defaultLogger *Logger

// InitializeLogger initializes the global logger
func InitializeLogger(serviceName string, level LogLevel) {
	defaultLogger = NewLogger(serviceName, level)
}

// GetLogger returns the global logger instance
func GetLogger() *Logger {
	if defaultLogger == nil {
		defaultLogger = NewLogger("goreal-backend", LevelInfo)
	}
	return defaultLogger
}
