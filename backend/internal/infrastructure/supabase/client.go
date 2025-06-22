package supabase

import (
	"context"
	"fmt"

	"goreal-backend/internal/config"

	"github.com/supabase-community/supabase-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var supabaseTracer = otel.Tracer("goreal-backend/infrastructure/supabase")

// Client wraps the Supabase client with additional functionality
type Client struct {
	client *supabase.Client
	config *config.Config
}

// NewClient creates a new Supabase client
func NewClient(cfg *config.Config) (*Client, error) {
	if cfg.SupabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required")
	}
	if cfg.SupabaseKey == "" {
		return nil, fmt.Errorf("SUPABASE_ANON_KEY is required")
	}

	client, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"apikey": cfg.SupabaseKey,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase client: %w", err)
	}

	return &Client{
		client: client,
		config: cfg,
	}, nil
}

// GetClient returns the underlying Supabase client
func (c *Client) GetClient() *supabase.Client {
	return c.client
}

// ExecuteQuery executes a query with tracing
func (c *Client) ExecuteQuery(ctx context.Context, operation string, table string, query func() error) error {
	ctx, span := supabaseTracer.Start(ctx, fmt.Sprintf("supabase.%s", operation))
	defer span.End()

	span.SetAttributes(
		attribute.String("db.operation", operation),
		attribute.String("db.table", table),
		attribute.String("db.system", "supabase"),
	)

	if err := query(); err != nil {
		span.RecordError(err)
		return fmt.Errorf("supabase %s operation failed: %w", operation, err)
	}

	return nil
}

// ExecuteQueryWithResult executes a query that returns a result with tracing
func (c *Client) ExecuteQueryWithResult(ctx context.Context, operation string, table string, query func() (interface{}, error)) (interface{}, error) {
	ctx, span := supabaseTracer.Start(ctx, fmt.Sprintf("supabase.%s", operation))
	defer span.End()

	span.SetAttributes(
		attribute.String("db.operation", operation),
		attribute.String("db.table", table),
		attribute.String("db.system", "supabase"),
	)

	result, err := query()
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("supabase %s operation failed: %w", operation, err)
	}

	return result, nil
}

// Health checks the health of the Supabase connection
func (c *Client) Health(ctx context.Context) error {
	ctx, span := supabaseTracer.Start(ctx, "supabase.health")
	defer span.End()

	// Simple health check - just verify the client is configured
	if c.client == nil {
		err := fmt.Errorf("supabase client is nil")
		span.RecordError(err)
		return err
	}

	// For now, just return success if client exists
	// In a real implementation, you might want to make a simple API call
	return nil
}

// WithServiceRole creates a new client with service role key for admin operations
func (c *Client) WithServiceRole() (*Client, error) {
	if c.config.SupabaseSecretKey == "" {
		return nil, fmt.Errorf("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
	}

	client, err := supabase.NewClient(c.config.SupabaseURL, c.config.SupabaseSecretKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"apikey": c.config.SupabaseSecretKey,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase service role client: %w", err)
	}

	return &Client{
		client: client,
		config: c.config,
	}, nil
}

// SetAuth sets the authentication token for the client
func (c *Client) SetAuth(token string) {
	// TODO: Implement auth token setting when needed
	// The supabase-go library API might be different
}

// ClearAuth clears the authentication token
func (c *Client) ClearAuth() {
	// TODO: Implement auth clearing when needed
}

// From creates a new query builder for a table
func (c *Client) From(table string) *QueryBuilder {
	return &QueryBuilder{
		client: c,
		table:  table,
		query:  c.client.From(table),
	}
}

// BuildQuery helps build complex queries with filters
type QueryBuilder struct {
	client *Client
	table  string
	query  interface{} // Using interface{} for now to avoid API issues
}

// Select adds select clause
func (qb *QueryBuilder) Select(columns string) *QueryBuilder {
	// TODO: Implement proper query building when Supabase API is clarified
	return qb
}

// Insert adds insert operation
func (qb *QueryBuilder) Insert(data interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Update adds update operation
func (qb *QueryBuilder) Update(data interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Delete adds delete operation
func (qb *QueryBuilder) Delete() *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Eq adds equality filter
func (qb *QueryBuilder) Eq(column string, value interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Gte adds greater than or equal filter
func (qb *QueryBuilder) Gte(column string, value interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Lte adds less than or equal filter
func (qb *QueryBuilder) Lte(column string, value interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Order adds order by clause
func (qb *QueryBuilder) Order(column string, ascending bool) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Limit adds limit clause
func (qb *QueryBuilder) Limit(count int) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Offset adds offset clause
func (qb *QueryBuilder) Offset(count int) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Single executes query and returns single result
func (qb *QueryBuilder) Single(ctx context.Context, dest interface{}) error {
	// TODO: Implement when Supabase API is clarified
	return fmt.Errorf("single query execution not yet implemented")
}

// Or adds OR condition
func (qb *QueryBuilder) Or(conditions string) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Contains adds contains filter
func (qb *QueryBuilder) Contains(column string, value interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Lt adds less than filter
func (qb *QueryBuilder) Lt(column string, value interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// IsNotNull adds is not null filter
func (qb *QueryBuilder) IsNotNull(column string) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// Neq adds not equal filter
func (qb *QueryBuilder) Neq(column string, value interface{}) *QueryBuilder {
	// TODO: Implement when Supabase API is clarified
	return qb
}

// ExecuteWithCount executes query and returns results with count
func (qb *QueryBuilder) ExecuteWithCount(ctx context.Context, dest interface{}) (int, error) {
	// TODO: Implement when Supabase API is clarified
	return 0, fmt.Errorf("query execution with count not yet implemented")
}

// Execute executes query and returns multiple results
func (qb *QueryBuilder) Execute(ctx context.Context, dest interface{}) error {
	// TODO: Implement when Supabase API is clarified
	return fmt.Errorf("query execution not yet implemented")
}
