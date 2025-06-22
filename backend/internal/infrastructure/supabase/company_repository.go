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

var companyTracer = otel.Tracer("goreal-backend/infrastructure/supabase/company")

type companyRepository struct {
	client *Client
}

// NewCompanyRepository creates a new company repository
func NewCompanyRepository(client *Client) domain.CompanyRepository {
	return &companyRepository{
		client: client,
	}
}

// Create creates a new company
func (r *companyRepository) Create(ctx context.Context, company *domain.Company) error {
	ctx, span := companyTracer.Start(ctx, "companyRepository.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("company.name", company.Name),
		attribute.String("company.id", company.ID.String()),
	)

	// Set timestamps
	now := time.Now()
	company.CreatedAt = now
	company.UpdatedAt = now

	// Execute insert query
	err := r.client.ExecuteQuery(ctx, "insert", "companies", func() error {
		return r.client.From("companies").Insert(company).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create company: %w", err)
	}

	return nil
}

// GetByID retrieves a company by ID
func (r *companyRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Company, error) {
	ctx, span := companyTracer.Start(ctx, "companyRepository.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("company.id", id.String()))

	var company domain.Company
	err := r.client.ExecuteQuery(ctx, "select", "companies", func() error {
		return r.client.From("companies").
			Select("*").
			Eq("id", id).
			Single(ctx, &company)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get company by ID: %w", err)
	}

	return &company, nil
}

// GetByName retrieves a company by name
func (r *companyRepository) GetByName(ctx context.Context, name string) (*domain.Company, error) {
	ctx, span := companyTracer.Start(ctx, "companyRepository.GetByName")
	defer span.End()

	span.SetAttributes(attribute.String("company.name", name))

	var company domain.Company
	err := r.client.ExecuteQuery(ctx, "select", "companies", func() error {
		return r.client.From("companies").
			Select("*").
			Eq("name", name).
			Single(ctx, &company)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get company by name: %w", err)
	}

	return &company, nil
}

// Update updates an existing company
func (r *companyRepository) Update(ctx context.Context, company *domain.Company) error {
	ctx, span := companyTracer.Start(ctx, "companyRepository.Update")
	defer span.End()

	span.SetAttributes(
		attribute.String("company.id", company.ID.String()),
		attribute.String("company.name", company.Name),
	)

	// Update timestamp
	company.UpdatedAt = time.Now()

	err := r.client.ExecuteQuery(ctx, "update", "companies", func() error {
		return r.client.From("companies").
			Update(company).
			Eq("id", company.ID).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update company: %w", err)
	}

	return nil
}

// Delete deletes a company by ID
func (r *companyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := companyTracer.Start(ctx, "companyRepository.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("company.id", id.String()))

	err := r.client.ExecuteQuery(ctx, "delete", "companies", func() error {
		return r.client.From("companies").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete company: %w", err)
	}

	return nil
}

// List retrieves companies with pagination and filtering
func (r *companyRepository) List(ctx context.Context, filters domain.CompanyFilters) ([]*domain.Company, error) {
	ctx, span := companyTracer.Start(ctx, "companyRepository.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	query := r.client.From("companies").Select("*")

	// Apply filters
	if filters.Industry != nil {
		query = query.Eq("industry", *filters.Industry)
		span.SetAttributes(attribute.String("filters.industry", *filters.Industry))
	}

	if filters.Search != nil {
		// Search in name, email, or website
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,email.ilike.%s,website.ilike.%s",
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

	var companies []*domain.Company
	err := r.client.ExecuteQuery(ctx, "select", "companies", func() error {
		return query.Execute(ctx, &companies)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list companies: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(companies)))

	return companies, nil
}

// Count returns the total number of companies matching the filters
func (r *companyRepository) Count(ctx context.Context, filters domain.CompanyFilters) (int, error) {
	ctx, span := companyTracer.Start(ctx, "companyRepository.Count")
	defer span.End()

	query := r.client.From("companies").Select("id")

	// Apply filters (same as List method)
	if filters.Industry != nil {
		query = query.Eq("industry", *filters.Industry)
	}

	if filters.Search != nil {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,email.ilike.%s,website.ilike.%s",
			searchPattern, searchPattern, searchPattern))
	}

	var companies []*domain.Company
	err := r.client.ExecuteQuery(ctx, "select", "companies", func() error {
		return query.Execute(ctx, &companies)
	})

	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count companies: %w", err)
	}

	count := len(companies)
	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// GetByRegistrationNumber retrieves a company by registration number
func (r *companyRepository) GetByRegistrationNumber(ctx context.Context, regNumber string) (*domain.Company, error) {
	ctx, span := companyTracer.Start(ctx, "companyRepository.GetByRegistrationNumber")
	defer span.End()

	span.SetAttributes(attribute.String("company.registration_number", regNumber))

	var company domain.Company
	err := r.client.ExecuteQuery(ctx, "select", "companies", func() error {
		return r.client.From("companies").
			Select("*").
			Eq("registration_number", regNumber).
			Single(ctx, &company)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get company by registration number: %w", err)
	}

	return &company, nil
}

// GetByTaxID retrieves a company by tax ID
func (r *companyRepository) GetByTaxID(ctx context.Context, taxID string) (*domain.Company, error) {
	ctx, span := companyTracer.Start(ctx, "companyRepository.GetByTaxID")
	defer span.End()

	span.SetAttributes(attribute.String("company.tax_id", taxID))

	var company domain.Company
	err := r.client.ExecuteQuery(ctx, "select", "companies", func() error {
		return r.client.From("companies").
			Select("*").
			Eq("tax_id", taxID).
			Single(ctx, &company)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get company by tax ID: %w", err)
	}

	return &company, nil
}
