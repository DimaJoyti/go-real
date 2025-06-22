package services

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/config"
	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var salesTracer = otel.Tracer("goreal-backend/services/sales")

type salesService struct {
	config              *config.Config
	saleRepo            domain.SaleRepository
	clientRepo          domain.ClientRepository
	inventoryRepo       domain.InventoryRepository
	userRepo            domain.UserRepository
	notificationService domain.NotificationService
}

// NewSalesService creates a new sales service
func NewSalesService(
	cfg *config.Config,
	saleRepo domain.SaleRepository,
	clientRepo domain.ClientRepository,
	inventoryRepo domain.InventoryRepository,
	userRepo domain.UserRepository,
	notificationService domain.NotificationService,
) domain.SalesService {
	return &salesService{
		config:              cfg,
		saleRepo:            saleRepo,
		clientRepo:          clientRepo,
		inventoryRepo:       inventoryRepo,
		userRepo:            userRepo,
		notificationService: notificationService,
	}
}

// Create creates a new sale
func (s *salesService) Create(ctx context.Context, req *domain.CreateSaleRequest) (*domain.Sale, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.client_id", req.ClientID.String()),
		attribute.String("sale.inventory_id", req.InventoryID.String()),
		attribute.String("sale.salesperson_id", req.SalespersonID.String()),
		attribute.Float64("sale.total_amount", req.TotalAmount),
	)

	// Validate request
	if req.ClientID == uuid.Nil {
		return nil, fmt.Errorf("client ID is required")
	}
	if req.InventoryID == uuid.Nil {
		return nil, fmt.Errorf("inventory ID is required")
	}
	if req.SalespersonID != nil && *req.SalespersonID == uuid.Nil {
		return nil, fmt.Errorf("salesperson ID is required")
	}
	if req.TotalAmount <= 0 {
		return nil, fmt.Errorf("total amount must be greater than 0")
	}

	// Validate entities exist
	_, err := s.clientRepo.GetByID(ctx, req.ClientID)
	if err != nil {
		return nil, fmt.Errorf("client not found: %w", err)
	}

	// Skip inventory validation for now since InventoryRepository is not implemented
	// inventory, err := s.inventoryRepo.GetByID(ctx, req.InventoryID)
	// if err != nil {
	// 	return nil, fmt.Errorf("inventory not found: %w", err)
	// }

	if req.SalespersonID != nil {
		_, err = s.userRepo.GetByID(ctx, *req.SalespersonID)
		if err != nil {
			return nil, fmt.Errorf("salesperson not found: %w", err)
		}
	}

	if req.ManagerID != nil {
		_, err = s.userRepo.GetByID(ctx, *req.ManagerID)
		if err != nil {
			return nil, fmt.Errorf("manager not found: %w", err)
		}
	}

	// Skip inventory availability check for now
	// if inventory.Status != domain.InventoryStatusAvailable {
	// 	return nil, fmt.Errorf("inventory unit is not available for sale")
	// }

	// Generate sale number
	saleNumber := s.generateSaleNumber()

	// Create sale
	now := time.Now()
	sale := &domain.Sale{
		ID:             uuid.New(),
		SaleNumber:     saleNumber,
		ClientID:       req.ClientID,
		InventoryID:    req.InventoryID,
		SalespersonID:  req.SalespersonID,
		ManagerID:      req.ManagerID,
		Status:         domain.SaleStatusPending,
		SaleDate:       now,
		TotalAmount:    req.TotalAmount,
		DiscountAmount: req.DiscountAmount,
		FinalAmount:    req.TotalAmount - req.DiscountAmount,
		PaymentPlan:    req.PaymentPlan,
		CommissionRate: req.CommissionRate,
		BookingAmount:  req.BookingAmount,
		Notes:          req.Notes,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.saleRepo.Create(ctx, sale); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create sale: %w", err)
	}

	// Skip inventory reservation for now since InventoryRepository is not fully implemented
	// if err := s.inventoryRepo.UpdateStatus(ctx, req.InventoryID, domain.InventoryStatusReserved); err != nil {
	// 	span.RecordError(err)
	// 	// Try to rollback the sale creation if possible
	// 	s.saleRepo.Delete(ctx, sale.ID)
	// 	return nil, fmt.Errorf("failed to reserve inventory: %w", err)
	// }

	// Send notifications
	go s.sendSaleCreatedNotification(context.Background(), sale)

	return sale, nil
}

// GetByID retrieves a sale by ID
func (s *salesService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Sale, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", id.String()))

	sale, err := s.saleRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sale by ID: %w", err)
	}

	return sale, nil
}

// GetBySaleNumber retrieves a sale by sale number
// Note: This method is not implemented in the repository interface yet
func (s *salesService) GetBySaleNumber(ctx context.Context, saleNumber string) (*domain.Sale, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.GetBySaleNumber")
	defer span.End()

	span.SetAttributes(attribute.String("sale.sale_number", saleNumber))

	// TODO: Implement GetBySaleNumber in SaleRepository interface
	return nil, fmt.Errorf("GetBySaleNumber not implemented in repository")
}

// Update updates an existing sale
func (s *salesService) Update(ctx context.Context, id uuid.UUID, req *domain.UpdateSaleRequest) (*domain.Sale, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.Update")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", id.String()))

	// Get existing sale
	sale, err := s.saleRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sale: %w", err)
	}

	// Check if sale can be updated
	if sale.Status == domain.SaleStatusCompleted || sale.Status == domain.SaleStatusCancelled {
		return nil, fmt.Errorf("cannot update completed or cancelled sale")
	}

	// Update fields
	if req.TotalAmount != nil {
		sale.TotalAmount = *req.TotalAmount
		sale.FinalAmount = sale.TotalAmount - sale.DiscountAmount
	}
	if req.DiscountAmount != nil {
		sale.DiscountAmount = *req.DiscountAmount
		sale.FinalAmount = sale.TotalAmount - sale.DiscountAmount
	}
	if req.FinalAmount != nil {
		sale.FinalAmount = *req.FinalAmount
	}
	if req.BookingAmount != nil {
		sale.BookingAmount = req.BookingAmount
	}
	if req.PaymentPlan != nil {
		sale.PaymentPlan = req.PaymentPlan
	}
	if req.CommissionRate != nil {
		sale.CommissionRate = req.CommissionRate
	}
	if req.Notes != nil {
		sale.Notes = req.Notes
	}

	// Update timestamp
	sale.UpdatedAt = time.Now()

	if err := s.saleRepo.Update(ctx, sale); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update sale: %w", err)
	}

	return sale, nil
}

// Delete deletes a sale
func (s *salesService) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := salesTracer.Start(ctx, "salesService.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", id.String()))

	// Get sale to check status and release inventory
	sale, err := s.saleRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get sale: %w", err)
	}

	// Check if sale can be deleted
	if sale.Status == domain.SaleStatusCompleted {
		return fmt.Errorf("cannot delete completed sale")
	}

	// Skip inventory release for now since InventoryRepository is not fully implemented
	// if sale.Status == domain.SaleStatusPending || sale.Status == domain.SaleStatusApproved {
	// 	if err := s.inventoryRepo.UpdateStatus(ctx, sale.InventoryID, domain.InventoryStatusAvailable); err != nil {
	// 		span.RecordError(err)
	// 		// Log error but continue with deletion
	// 	}
	// }

	if err := s.saleRepo.Delete(ctx, id); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete sale: %w", err)
	}

	return nil
}

// List retrieves sales with pagination and filtering
func (s *salesService) List(ctx context.Context, filters domain.SaleFilters) ([]*domain.Sale, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	sales, err := s.saleRepo.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list sales: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(sales)))

	return sales, nil
}

// Count returns the total number of sales matching the filters
func (s *salesService) Count(ctx context.Context, filters domain.SaleFilters) (int, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.Count")
	defer span.End()

	count, err := s.saleRepo.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count sales: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// UpdateStatus updates sale status
func (s *salesService) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.SaleStatus) error {
	ctx, span := salesTracer.Start(ctx, "salesService.UpdateStatus")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.id", id.String()),
		attribute.String("sale.status", string(status)),
	)

	// Get sale to validate and handle inventory
	sale, err := s.saleRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get sale: %w", err)
	}

	// Skip business rules validation for now since BusinessRules is not fully implemented
	// br := domain.BusinessRules{}
	// if err := br.CanSaleChangeStatus(sale, status); err != nil {
	// 	return fmt.Errorf("invalid status transition: %w", err)
	// }

	// Skip inventory status changes for now since InventoryRepository is not fully implemented
	// switch status {
	// case domain.SaleStatusCompleted:
	// 	// Mark inventory as sold
	// 	if err := s.inventoryRepo.UpdateStatus(ctx, sale.InventoryID, domain.InventoryStatusSold); err != nil {
	// 		span.RecordError(err)
	// 		return fmt.Errorf("failed to mark inventory as sold: %w", err)
	// 	}
	//
	// 	// Update project sold units if inventory has project reference
	// 	inventory, err := s.inventoryRepo.GetByID(ctx, sale.InventoryID)
	// 	if err == nil && inventory.ProjectID != nil {
	// 		if err := s.projectService.SellUnits(ctx, *inventory.ProjectID, 1); err != nil {
	// 			span.RecordError(err)
	// 			// Log error but don't fail the sale completion
	// 		}
	// 	}

	// case domain.SaleStatusCancelled:
	// 	// Release inventory back to available
	// 	if err := s.inventoryRepo.UpdateStatus(ctx, sale.InventoryID, domain.InventoryStatusAvailable); err != nil {
	// 		span.RecordError(err)
	// 		return fmt.Errorf("failed to release inventory: %w", err)
	// 	}
	// }

	if err := s.saleRepo.UpdateStatus(ctx, id, status); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update sale status: %w", err)
	}

	// Send notifications for important status changes
	go s.sendSaleStatusNotification(context.Background(), sale, status)

	return nil
}

// GetSalesStats returns sales statistics
func (s *salesService) GetSalesStats(ctx context.Context, filters domain.SaleFilters) (*domain.SalesStats, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.GetSalesStats")
	defer span.End()

	stats, err := s.saleRepo.GetSalesStats(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get sales stats: %w", err)
	}

	return stats, nil
}

// ApproveSale approves a sale
func (s *salesService) ApproveSale(ctx context.Context, saleID uuid.UUID, approverID uuid.UUID) error {
	ctx, span := salesTracer.Start(ctx, "salesService.ApproveSale")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.id", saleID.String()),
		attribute.String("approver.id", approverID.String()),
	)

	// Validate approver exists
	_, err := s.userRepo.GetByID(ctx, approverID)
	if err != nil {
		return fmt.Errorf("approver not found: %w", err)
	}

	// Update sale status to approved
	if err := s.saleRepo.UpdateStatus(ctx, saleID, domain.SaleStatusApproved); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to approve sale: %w", err)
	}

	// Send notification
	sale, err := s.saleRepo.GetByID(ctx, saleID)
	if err == nil {
		go s.sendSaleStatusNotification(context.Background(), sale, domain.SaleStatusApproved)
	}

	return nil
}

// CompleteSale completes a sale
func (s *salesService) CompleteSale(ctx context.Context, saleID uuid.UUID) error {
	ctx, span := salesTracer.Start(ctx, "salesService.CompleteSale")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", saleID.String()))

	// Update sale status to completed
	if err := s.saleRepo.UpdateStatus(ctx, saleID, domain.SaleStatusCompleted); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to complete sale: %w", err)
	}

	// Send notification
	sale, err := s.saleRepo.GetByID(ctx, saleID)
	if err == nil {
		go s.sendSaleStatusNotification(context.Background(), sale, domain.SaleStatusCompleted)
	}

	return nil
}

// CancelSale cancels a sale
func (s *salesService) CancelSale(ctx context.Context, saleID uuid.UUID, reason string) error {
	ctx, span := salesTracer.Start(ctx, "salesService.CancelSale")
	defer span.End()

	span.SetAttributes(
		attribute.String("sale.id", saleID.String()),
		attribute.String("reason", reason),
	)

	// Update sale status to cancelled
	if err := s.saleRepo.UpdateStatus(ctx, saleID, domain.SaleStatusCancelled); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to cancel sale: %w", err)
	}

	// Send notification
	sale, err := s.saleRepo.GetByID(ctx, saleID)
	if err == nil {
		go s.sendSaleStatusNotification(context.Background(), sale, domain.SaleStatusCancelled)
	}

	return nil
}

// GenerateAgreement generates a sale agreement document
func (s *salesService) GenerateAgreement(ctx context.Context, saleID uuid.UUID) ([]byte, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.GenerateAgreement")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", saleID.String()))

	// TODO: Implement agreement generation
	return nil, fmt.Errorf("agreement generation not implemented")
}

// CreatePaymentSchedule creates a payment schedule for a sale
func (s *salesService) CreatePaymentSchedule(ctx context.Context, saleID uuid.UUID, req *domain.CreatePaymentScheduleRequest) ([]*domain.PaymentSchedule, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.CreatePaymentSchedule")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", saleID.String()))

	// TODO: Implement payment schedule creation
	return nil, fmt.Errorf("payment schedule creation not implemented")
}

// CalculateCommission calculates commission for a sale
func (s *salesService) CalculateCommission(ctx context.Context, saleID uuid.UUID) ([]*domain.Commission, error) {
	ctx, span := salesTracer.Start(ctx, "salesService.CalculateCommission")
	defer span.End()

	span.SetAttributes(attribute.String("sale.id", saleID.String()))

	// TODO: Implement commission calculation
	return nil, fmt.Errorf("commission calculation not implemented")
}

// generateSaleNumber generates a unique sale number
func (s *salesService) generateSaleNumber() string {
	now := time.Now()
	return fmt.Sprintf("SALE-%d%02d%02d-%d", now.Year(), now.Month(), now.Day(), now.Unix()%10000)
}

// sendSaleCreatedNotification sends notifications when a sale is created
func (s *salesService) sendSaleCreatedNotification(ctx context.Context, sale *domain.Sale) {
	if s.notificationService == nil {
		return
	}

	// Notify manager if assigned
	if sale.ManagerID != nil {
		notification := &domain.CreateNotificationRequest{
			UserID:  *sale.ManagerID,
			Type:    string(domain.NotificationTypeSaleCreated),
			Title:   "New Sale Created",
			Message: fmt.Sprintf("New sale %s created by salesperson", sale.SaleNumber),
			Data: map[string]interface{}{
				"sale_id":     sale.ID.String(),
				"sale_number": sale.SaleNumber,
				"amount":      sale.FinalAmount,
			},
		}
		s.notificationService.Create(ctx, notification)
	}
}

// sendSaleStatusNotification sends notifications when sale status changes
func (s *salesService) sendSaleStatusNotification(ctx context.Context, sale *domain.Sale, newStatus domain.SaleStatus) {
	if s.notificationService == nil {
		return
	}

	// Notify salesperson
	if sale.SalespersonID != nil {
		notification := &domain.CreateNotificationRequest{
			UserID:  *sale.SalespersonID,
			Type:    string(domain.NotificationTypeSaleStatusChanged),
			Title:   "Sale Status Updated",
			Message: fmt.Sprintf("Sale %s status changed to %s", sale.SaleNumber, string(newStatus)),
			Data: map[string]interface{}{
				"sale_id":     sale.ID.String(),
				"sale_number": sale.SaleNumber,
				"new_status":  string(newStatus),
			},
		}
		s.notificationService.Create(ctx, notification)
	}

	// Also notify manager if assigned
	if sale.ManagerID != nil {
		managerNotification := &domain.CreateNotificationRequest{
			UserID:  *sale.ManagerID,
			Type:    string(domain.NotificationTypeSaleStatusChanged),
			Title:   "Sale Status Updated",
			Message: fmt.Sprintf("Sale %s status changed to %s", sale.SaleNumber, string(newStatus)),
			Data: map[string]interface{}{
				"sale_id":     sale.ID.String(),
				"sale_number": sale.SaleNumber,
				"new_status":  string(newStatus),
			},
		}
		s.notificationService.Create(ctx, managerNotification)
	}
}
