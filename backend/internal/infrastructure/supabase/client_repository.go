package supabase

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var clientTracer = otel.Tracer("goreal-backend/infrastructure/supabase/client")

type clientRepository struct {
	client *Client
}

// NewClientRepository creates a new client repository
func NewClientRepository(client *Client) domain.ClientRepository {
	return &clientRepository{
		client: client,
	}
}

// Create creates a new client
func (r *clientRepository) Create(ctx context.Context, client *domain.Client) error {
	ctx, span := clientTracer.Start(ctx, "clientRepository.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.name", client.Name),
		attribute.String("client.id", client.ID.String()),
		attribute.String("client.client_type", string(client.ClientType)),
	)

	// Set timestamps
	now := time.Now()
	client.CreatedAt = now
	client.UpdatedAt = now

	// Execute insert query
	err := r.client.ExecuteQuery(ctx, "insert", "clients", func() error {
		return r.client.From("clients").Insert(client).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create client: %w", err)
	}

	return nil
}

// GetByID retrieves a client by ID
func (r *clientRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	var client domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return r.client.From("clients").
			Select(`*, 
				profile:users!profile_id(*), 
				lead:leads!lead_id(*), 
				company:companies!company_id(*), 
				assigned_user:users!assigned_to(*)`).
			Eq("id", id).
			Single(ctx, &client)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get client by ID: %w", err)
	}

	return &client, nil
}

// GetByEmail retrieves a client by email
func (r *clientRepository) GetByEmail(ctx context.Context, email string) (*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.GetByEmail")
	defer span.End()

	span.SetAttributes(attribute.String("client.email", email))

	var client domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return r.client.From("clients").
			Select(`*, 
				profile:users!profile_id(*), 
				lead:leads!lead_id(*), 
				company:companies!company_id(*), 
				assigned_user:users!assigned_to(*)`).
			Eq("email", email).
			Single(ctx, &client)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get client by email: %w", err)
	}

	return &client, nil
}

// Update updates an existing client
func (r *clientRepository) Update(ctx context.Context, client *domain.Client) error {
	ctx, span := clientTracer.Start(ctx, "clientRepository.Update")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.id", client.ID.String()),
		attribute.String("client.name", client.Name),
	)

	// Update timestamp
	client.UpdatedAt = time.Now()

	err := r.client.ExecuteQuery(ctx, "update", "clients", func() error {
		return r.client.From("clients").
			Update(client).
			Eq("id", client.ID).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update client: %w", err)
	}

	return nil
}

// Delete deletes a client by ID
func (r *clientRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := clientTracer.Start(ctx, "clientRepository.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	err := r.client.ExecuteQuery(ctx, "delete", "clients", func() error {
		return r.client.From("clients").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete client: %w", err)
	}

	return nil
}

// List retrieves clients with pagination and filtering
func (r *clientRepository) List(ctx context.Context, filters domain.ClientFilters) ([]*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	query := r.client.From("clients").
		Select(`*,
			profile:users!profile_id(*),
			lead:leads!lead_id(*),
			company:companies!company_id(*),
			assigned_user:users!assigned_to(*)`)

	// Apply filters
	if filters.ClientType != nil {
		query = query.Eq("client_type", string(*filters.ClientType))
		span.SetAttributes(attribute.String("filters.client_type", string(*filters.ClientType)))
	}

	if filters.AssignedTo != nil {
		query = query.Eq("assigned_to", *filters.AssignedTo)
		span.SetAttributes(attribute.String("filters.assigned_to", filters.AssignedTo.String()))
	}

	if filters.CompanyID != nil {
		query = query.Eq("company_id", *filters.CompanyID)
		span.SetAttributes(attribute.String("filters.company_id", filters.CompanyID.String()))
	}

	if filters.IsVerified != nil {
		query = query.Eq("is_verified", *filters.IsVerified)
		span.SetAttributes(attribute.Bool("filters.is_verified", *filters.IsVerified))
	}

	if filters.Search != nil {
		// Search in name, email, or phone
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,email.ilike.%s,phone.ilike.%s",
			searchPattern, searchPattern, searchPattern))
		span.SetAttributes(attribute.String("filters.search", *filters.Search))
	}

	// Apply sorting
	if filters.SortBy != "" {
		ascending := filters.SortOrder == "" || filters.SortOrder == "asc"
		query = query.Order(filters.SortBy, ascending)
		span.SetAttributes(
			attribute.String("filters.sort_by", filters.SortBy),
			attribute.Bool("filters.ascending", ascending),
		)
	}

	// Apply pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	var clients []*domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return query.Execute(ctx, &clients)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list clients: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(clients)))

	return clients, nil
}

// Count returns the total number of clients matching the filters
func (r *clientRepository) Count(ctx context.Context, filters domain.ClientFilters) (int, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.Count")
	defer span.End()

	query := r.client.From("clients").Select("id")

	// Apply filters (same as List method)
	if filters.ClientType != nil {
		query = query.Eq("client_type", string(*filters.ClientType))
	}

	if filters.AssignedTo != nil {
		query = query.Eq("assigned_to", *filters.AssignedTo)
	}

	if filters.CompanyID != nil {
		query = query.Eq("company_id", *filters.CompanyID)
	}

	if filters.IsVerified != nil {
		query = query.Eq("is_verified", *filters.IsVerified)
	}

	if filters.Search != nil {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,email.ilike.%s,phone.ilike.%s",
			searchPattern, searchPattern, searchPattern))
	}

	var clients []*domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return query.Execute(ctx, &clients)
	})

	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count clients: %w", err)
	}

	count := len(clients)
	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// GetByAssignedUser retrieves clients assigned to a user
func (r *clientRepository) GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.GetByAssignedTo")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	var clients []*domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return r.client.From("clients").
			Select(`*, 
				profile:users!profile_id(*), 
				lead:leads!lead_id(*), 
				company:companies!company_id(*), 
				assigned_user:users!assigned_to(*)`).
			Eq("assigned_to", userID).
			Execute(ctx, &clients)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get clients by assigned to: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(clients)))

	return clients, nil
}

// GetByCompanyID retrieves clients by company ID
func (r *clientRepository) GetByCompanyID(ctx context.Context, companyID uuid.UUID) ([]*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.GetByCompanyID")
	defer span.End()

	span.SetAttributes(attribute.String("company.id", companyID.String()))

	var clients []*domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return r.client.From("clients").
			Select(`*, 
				profile:users!profile_id(*), 
				lead:leads!lead_id(*), 
				company:companies!company_id(*), 
				assigned_user:users!assigned_to(*)`).
			Eq("company_id", companyID).
			Execute(ctx, &clients)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get clients by company ID: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(clients)))

	return clients, nil
}

// GetByClientType retrieves clients by type
func (r *clientRepository) GetByClientType(ctx context.Context, clientType domain.ClientType) ([]*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientRepository.GetByClientType")
	defer span.End()

	span.SetAttributes(attribute.String("client.type", string(clientType)))

	var clients []*domain.Client
	err := r.client.ExecuteQuery(ctx, "select", "clients", func() error {
		return r.client.From("clients").
			Select(`*, 
				profile:users!profile_id(*), 
				lead:leads!lead_id(*), 
				company:companies!company_id(*), 
				assigned_user:users!assigned_to(*)`).
			Eq("client_type", string(clientType)).
			Execute(ctx, &clients)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get clients by type: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(clients)))

	return clients, nil
}

// UpdateVerificationStatus updates client verification status
func (r *clientRepository) UpdateVerificationStatus(ctx context.Context, id uuid.UUID, isVerified bool) error {
	ctx, span := clientTracer.Start(ctx, "clientRepository.UpdateVerificationStatus")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.id", id.String()),
		attribute.Bool("client.is_verified", isVerified),
	)

	updateData := map[string]interface{}{
		"is_verified": isVerified,
		"updated_at":  time.Now(),
	}

	err := r.client.ExecuteQuery(ctx, "update", "clients", func() error {
		return r.client.From("clients").
			Update(updateData).
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update client verification status: %w", err)
	}

	return nil
}
