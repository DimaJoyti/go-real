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

var saleTracer = otel.Tracer("goreal-backend/infrastructure/supabase/sale")

type saleRepository struct {
	client *Client
}

// NewSaleRepository creates a new sale repository
func NewSaleRepository(client *Client) domain.SaleRepository {
	return &saleRepository{
		client: client,
	}
}

// Create creates a new sale
func (r *saleRepository) Create(ctx context.Context, sale *domain.Sale) error {
	ctx, span := saleTracer.Start(ctx, "saleRepository.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.id", sale.ID.String()),
		attribute.String("sale.sale_number", sale.SaleNumber),
		attribute.String("sale.client_id", sale.ClientID.String()),
		attribute.Float64("sale.total_amount", sale.TotalAmount),
	)

	// Set timestamps
	now := time.Now()
	sale.CreatedAt = now
	sale.UpdatedAt = now

	// Execute insert query
	err := r.client.ExecuteQuery(ctx, "insert", "sales", func() error {
		return r.client.From("sales").Insert(sale).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create sale: %w", err)
	}

	return nil
}

// GetByID retrieves a sale by ID
func (r *saleRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Sale, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", id.String()))

	var sale domain.Sale
	err := r.client.ExecuteQuery(ctx, "select", "sales", func() error {
		return r.client.From("sales").
			Select(`*, 
				client:clients(*), 
				inventory:inventories(*), 
				salesperson:users!salesperson_id(*), 
				manager:users!manager_id(*)`).
			Eq("id", id).
			Single(ctx, &sale)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sale by ID: %w", err)
	}

	return &sale, nil
}

// GetBySaleNumber retrieves a sale by sale number
func (r *saleRepository) GetBySaleNumber(ctx context.Context, saleNumber string) (*domain.Sale, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.GetBySaleNumber")
	defer span.End()

	span.SetAttributes(attribute.String("sale.sale_number", saleNumber))

	var sale domain.Sale
	err := r.client.ExecuteQuery(ctx, "select", "sales", func() error {
		return r.client.From("sales").
			Select(`*, 
				client:clients(*), 
				inventory:inventories(*), 
				salesperson:users!salesperson_id(*), 
				manager:users!manager_id(*)`).
			Eq("sale_number", saleNumber).
			Single(ctx, &sale)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sale by sale number: %w", err)
	}

	return &sale, nil
}

// Update updates an existing sale
func (r *saleRepository) Update(ctx context.Context, sale *domain.Sale) error {
	ctx, span := saleTracer.Start(ctx, "saleRepository.Update")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.id", sale.ID.String()),
		attribute.String("sale.sale_number", sale.SaleNumber),
		attribute.String("sale.status", string(sale.Status)),
	)

	// Update timestamp
	sale.UpdatedAt = time.Now()

	err := r.client.ExecuteQuery(ctx, "update", "sales", func() error {
		return r.client.From("sales").
			Update(sale).
			Eq("id", sale.ID).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update sale: %w", err)
	}

	return nil
}

// Delete deletes a sale by ID
func (r *saleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := saleTracer.Start(ctx, "saleRepository.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", id.String()))

	err := r.client.ExecuteQuery(ctx, "delete", "sales", func() error {
		return r.client.From("sales").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete sale: %w", err)
	}

	return nil
}

// List retrieves sales with pagination and filtering
func (r *saleRepository) List(ctx context.Context, filters domain.SaleFilters) ([]*domain.Sale, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	query := r.client.From("sales").
		Select(`*,
			client:clients(*),
			inventory:inventories(*),
			salesperson:users!salesperson_id(*),
			manager:users!manager_id(*)`)

	// Apply filters
	if filters.ClientID != nil {
		query = query.Eq("client_id", *filters.ClientID)
		span.SetAttributes(attribute.String("filters.client_id", filters.ClientID.String()))
	}

	if filters.SalespersonID != nil {
		query = query.Eq("salesperson_id", *filters.SalespersonID)
		span.SetAttributes(attribute.String("filters.salesperson_id", filters.SalespersonID.String()))
	}

	if filters.ManagerID != nil {
		query = query.Eq("manager_id", *filters.ManagerID)
		span.SetAttributes(attribute.String("filters.manager_id", filters.ManagerID.String()))
	}

	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
		span.SetAttributes(attribute.String("filters.status", string(*filters.Status)))
	}

	if filters.Search != nil {
		// Search in sale number or client name
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("sale_number.ilike.%s", searchPattern))
		span.SetAttributes(attribute.String("filters.search", *filters.Search))
	}

	if filters.SaleDateFrom != nil {
		query = query.Gte("sale_date", filters.SaleDateFrom.Format(time.RFC3339))
		span.SetAttributes(attribute.String("filters.sale_date_from", filters.SaleDateFrom.Format(time.RFC3339)))
	}

	if filters.SaleDateTo != nil {
		query = query.Lte("sale_date", filters.SaleDateTo.Format(time.RFC3339))
		span.SetAttributes(attribute.String("filters.sale_date_to", filters.SaleDateTo.Format(time.RFC3339)))
	}

	if filters.AmountMin != nil {
		query = query.Gte("total_amount", *filters.AmountMin)
		span.SetAttributes(attribute.Float64("filters.amount_min", *filters.AmountMin))
	}

	if filters.AmountMax != nil {
		query = query.Lte("total_amount", *filters.AmountMax)
		span.SetAttributes(attribute.Float64("filters.amount_max", *filters.AmountMax))
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

	var sales []*domain.Sale
	err := r.client.ExecuteQuery(ctx, "select", "sales", func() error {
		return query.Execute(ctx, &sales)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list sales: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(sales)))

	return sales, nil
}

// Count returns the total number of sales matching the filters
func (r *saleRepository) Count(ctx context.Context, filters domain.SaleFilters) (int, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.Count")
	defer span.End()

	query := r.client.From("sales").Select("id")

	// Apply filters (same as List method)
	if filters.ClientID != nil {
		query = query.Eq("client_id", *filters.ClientID)
	}

	if filters.SalespersonID != nil {
		query = query.Eq("salesperson_id", *filters.SalespersonID)
	}

	if filters.ManagerID != nil {
		query = query.Eq("manager_id", *filters.ManagerID)
	}

	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
	}

	if filters.Search != nil {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("sale_number.ilike.%s", searchPattern))
	}

	if filters.SaleDateFrom != nil {
		query = query.Gte("sale_date", filters.SaleDateFrom.Format(time.RFC3339))
	}

	if filters.SaleDateTo != nil {
		query = query.Lte("sale_date", filters.SaleDateTo.Format(time.RFC3339))
	}

	if filters.AmountMin != nil {
		query = query.Gte("total_amount", *filters.AmountMin)
	}

	if filters.AmountMax != nil {
		query = query.Lte("total_amount", *filters.AmountMax)
	}

	var sales []*domain.Sale
	err := r.client.ExecuteQuery(ctx, "select", "sales", func() error {
		return query.Execute(ctx, &sales)
	})

	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count sales: %w", err)
	}

	count := len(sales)
	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// GetByClient retrieves sales by client ID
func (r *saleRepository) GetByClient(ctx context.Context, clientID uuid.UUID) ([]*domain.Sale, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.GetByClientID")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", clientID.String()))

	var sales []*domain.Sale
	err := r.client.ExecuteQuery(ctx, "select", "sales", func() error {
		return r.client.From("sales").
			Select(`*, 
				client:clients(*), 
				inventory:inventories(*), 
				salesperson:users!salesperson_id(*), 
				manager:users!manager_id(*)`).
			Eq("client_id", clientID).
			Execute(ctx, &sales)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sales by client ID: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(sales)))

	return sales, nil
}

// GetBySalesperson retrieves sales by salesperson ID
func (r *saleRepository) GetBySalesperson(ctx context.Context, salespersonID uuid.UUID) ([]*domain.Sale, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.GetBySalesperson")
	defer span.End()

	span.SetAttributes(attribute.String("salesperson.id", salespersonID.String()))

	var sales []*domain.Sale
	err := r.client.ExecuteQuery(ctx, "select", "sales", func() error {
		return r.client.From("sales").
			Select(`*, 
				client:clients(*), 
				inventory:inventories(*), 
				salesperson:users!salesperson_id(*), 
				manager:users!manager_id(*)`).
			Eq("salesperson_id", salespersonID).
			Execute(ctx, &sales)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sales by salesperson: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(sales)))

	return sales, nil
}

// UpdateStatus updates sale status
func (r *saleRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.SaleStatus) error {
	ctx, span := saleTracer.Start(ctx, "saleRepository.UpdateStatus")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.id", id.String()),
		attribute.String("sale.status", string(status)),
	)

	updateData := map[string]interface{}{
		"status":     string(status),
		"updated_at": time.Now(),
	}

	err := r.client.ExecuteQuery(ctx, "update", "sales", func() error {
		return r.client.From("sales").
			Update(updateData).
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update sale status: %w", err)
	}

	return nil
}

// GetSalesStats returns sales statistics based on filters
func (r *saleRepository) GetSalesStats(ctx context.Context, filters domain.SaleFilters) (*domain.SalesStats, error) {
	ctx, span := saleTracer.Start(ctx, "saleRepository.GetSalesStats")
	defer span.End()

	// For now, return a basic implementation
	// In a real implementation, this would calculate various statistics
	// like total sales, average sale amount, sales by period, etc.

	// Get all sales matching the filters
	sales, err := r.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sales for stats: %w", err)
	}

	// Calculate basic statistics
	stats := &domain.SalesStats{
		TotalSales:     len(sales),
		TotalRevenue:   0,
		AverageValue:   0,
		PendingSales:   0,
		ApprovedSales:  0,
		CompletedSales: 0,
		CancelledSales: 0,
		MonthlyRevenue: 0,
		YearlyRevenue:  0,
	}

	for _, sale := range sales {
		stats.TotalRevenue += sale.FinalAmount

		// Count by status
		switch sale.Status {
		case domain.SaleStatusPending:
			stats.PendingSales++
		case domain.SaleStatusApproved:
			stats.ApprovedSales++
		case domain.SaleStatusCompleted:
			stats.CompletedSales++
		case domain.SaleStatusCancelled:
			stats.CancelledSales++
		}
	}

	if stats.TotalSales > 0 {
		stats.AverageValue = stats.TotalRevenue / float64(stats.TotalSales)
	}

	span.SetAttributes(
		attribute.Int("stats.total_sales", stats.TotalSales),
		attribute.Float64("stats.total_revenue", stats.TotalRevenue),
		attribute.Float64("stats.average_value", stats.AverageValue),
	)

	return stats, nil
}
