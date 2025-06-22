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

var tracer = otel.Tracer("goreal-backend/services")

// leadService implements the LeadService interface
type leadService struct {
	config     *config.Config
	leadRepo   domain.LeadRepository
	clientRepo domain.ClientRepository
	userRepo   domain.UserRepository
	taskRepo   domain.TaskRepository
	followUpRepo domain.FollowUpRepository
	notificationService domain.NotificationService
}

// NewLeadService creates a new lead service instance
func NewLeadService(
	cfg *config.Config,
	leadRepo domain.LeadRepository,
	clientRepo domain.ClientRepository,
	userRepo domain.UserRepository,
	taskRepo domain.TaskRepository,
	followUpRepo domain.FollowUpRepository,
	notificationService domain.NotificationService,
) domain.LeadService {
	return &leadService{
		config:              cfg,
		leadRepo:            leadRepo,
		clientRepo:          clientRepo,
		userRepo:            userRepo,
		taskRepo:            taskRepo,
		followUpRepo:        followUpRepo,
		notificationService: notificationService,
	}
}

func (s *leadService) Create(ctx context.Context, req *domain.CreateLeadRequest) (*domain.Lead, error) {
	ctx, span := tracer.Start(ctx, "leadService.Create")
	defer span.End()

	// Validate request
	if req.Name == "" {
		return nil, fmt.Errorf("lead name is required")
	}

	// Validate email if provided
	if req.Email != nil && *req.Email != "" {
		if _, err := domain.NewEmail(*req.Email); err != nil {
			return nil, fmt.Errorf("invalid email format: %w", err)
		}
	}

	// Validate phone if provided
	if req.Phone != nil && *req.Phone != "" {
		if _, err := domain.NewPhoneNumber(*req.Phone); err != nil {
			return nil, fmt.Errorf("invalid phone format: %w", err)
		}
	}

	// Validate budget range
	if req.BudgetMin != nil && req.BudgetMax != nil && *req.BudgetMin > *req.BudgetMax {
		return nil, fmt.Errorf("budget minimum cannot be greater than maximum")
	}

	// Create lead entity
	lead := &domain.Lead{
		ID:           uuid.New(),
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		CompanyName:  req.CompanyName,
		Designation:  req.Designation,
		Source:       req.Source,
		Status:       domain.LeadStatusNew,
		AssignedTo:   req.AssignedTo,
		BudgetMin:    req.BudgetMin,
		BudgetMax:    req.BudgetMax,
		Requirements: req.Requirements,
		Notes:        req.Notes,
		Score:        0,
		Tags:         req.Tags,
		CustomFields: make(domain.CustomFields),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Get current user from context (this would be set by auth middleware)
	if userID := getUserIDFromContext(ctx); userID != uuid.Nil {
		lead.CreatedBy = userID
	}

	// Save to repository
	if err := s.leadRepo.Create(ctx, lead); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create lead: %w", err)
	}

	// Send notification to assigned user if specified
	if req.AssignedTo != nil {
		go s.sendLeadAssignmentNotification(context.Background(), lead)
	}

	span.SetAttributes(
		attribute.String("lead.id", lead.ID.String()),
		attribute.String("lead.name", lead.Name),
		attribute.String("lead.source", string(lead.Source)),
	)

	return lead, nil
}

func (s *leadService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Lead, error) {
	ctx, span := tracer.Start(ctx, "leadService.GetByID")
	defer span.End()

	lead, err := s.leadRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get lead: %w", err)
	}

	span.SetAttributes(attribute.String("lead.id", id.String()))
	return lead, nil
}

func (s *leadService) Update(ctx context.Context, id uuid.UUID, req *domain.UpdateLeadRequest) (*domain.Lead, error) {
	ctx, span := tracer.Start(ctx, "leadService.Update")
	defer span.End()

	// Get existing lead
	lead, err := s.leadRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get lead: %w", err)
	}

	// Update fields
	if req.Name != nil {
		lead.Name = *req.Name
	}
	if req.Email != nil {
		if *req.Email != "" {
			if _, err := domain.NewEmail(*req.Email); err != nil {
				return nil, fmt.Errorf("invalid email format: %w", err)
			}
		}
		lead.Email = req.Email
	}
	if req.Phone != nil {
		if *req.Phone != "" {
			if _, err := domain.NewPhoneNumber(*req.Phone); err != nil {
				return nil, fmt.Errorf("invalid phone format: %w", err)
			}
		}
		lead.Phone = req.Phone
	}
	if req.CompanyName != nil {
		lead.CompanyName = req.CompanyName
	}
	if req.Designation != nil {
		lead.Designation = req.Designation
	}
	if req.Source != nil {
		lead.Source = *req.Source
	}
	if req.Status != nil {
		lead.Status = *req.Status
	}
	if req.AssignedTo != nil {
		// Check if assignment changed
		oldAssignedTo := lead.AssignedTo
		lead.AssignedTo = req.AssignedTo
		
		// Send notification if assignment changed
		if (oldAssignedTo == nil && req.AssignedTo != nil) ||
		   (oldAssignedTo != nil && req.AssignedTo != nil && *oldAssignedTo != *req.AssignedTo) {
			go s.sendLeadAssignmentNotification(context.Background(), lead)
		}
	}
	if req.BudgetMin != nil {
		lead.BudgetMin = req.BudgetMin
	}
	if req.BudgetMax != nil {
		lead.BudgetMax = req.BudgetMax
	}
	if req.Requirements != nil {
		lead.Requirements = req.Requirements
	}
	if req.Notes != nil {
		lead.Notes = req.Notes
	}
	if req.LastContactDate != nil {
		lead.LastContactDate = req.LastContactDate
	}
	if req.NextFollowUp != nil {
		lead.NextFollowUp = req.NextFollowUp
	}
	if req.Score != nil {
		// Validate score
		br := domain.BusinessRules{}
		if err := br.ValidateLeadScore(*req.Score); err != nil {
			return nil, fmt.Errorf("invalid lead score: %w", err)
		}
		lead.Score = *req.Score
	}
	if req.Tags != nil {
		lead.Tags = req.Tags
	}

	// Validate budget range
	if lead.BudgetMin != nil && lead.BudgetMax != nil && *lead.BudgetMin > *lead.BudgetMax {
		return nil, fmt.Errorf("budget minimum cannot be greater than maximum")
	}

	lead.UpdatedAt = time.Now()

	// Save to repository
	if err := s.leadRepo.Update(ctx, lead); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update lead: %w", err)
	}

	span.SetAttributes(attribute.String("lead.id", id.String()))
	return lead, nil
}

func (s *leadService) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := tracer.Start(ctx, "leadService.Delete")
	defer span.End()

	if err := s.leadRepo.Delete(ctx, id); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete lead: %w", err)
	}

	span.SetAttributes(attribute.String("lead.id", id.String()))
	return nil
}

func (s *leadService) List(ctx context.Context, filters domain.LeadFilters) ([]*domain.Lead, error) {
	ctx, span := tracer.Start(ctx, "leadService.List")
	defer span.End()

	leads, err := s.leadRepo.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list leads: %w", err)
	}

	span.SetAttributes(attribute.Int("leads.count", len(leads)))
	return leads, nil
}

func (s *leadService) Count(ctx context.Context, filters domain.LeadFilters) (int, error) {
	ctx, span := tracer.Start(ctx, "leadService.Count")
	defer span.End()

	count, err := s.leadRepo.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count leads: %w", err)
	}

	span.SetAttributes(attribute.Int("leads.count", count))
	return count, nil
}

func (s *leadService) AssignToUser(ctx context.Context, leadID, userID uuid.UUID) error {
	ctx, span := tracer.Start(ctx, "leadService.AssignToUser")
	defer span.End()

	// Get lead
	lead, err := s.leadRepo.GetByID(ctx, leadID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get lead: %w", err)
	}

	// Verify user exists
	if _, err := s.userRepo.GetByID(ctx, userID); err != nil {
		span.RecordError(err)
		return fmt.Errorf("user not found: %w", err)
	}

	// Update assignment
	lead.AssignedTo = &userID
	lead.UpdatedAt = time.Now()

	if err := s.leadRepo.Update(ctx, lead); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to assign lead: %w", err)
	}

	// Send notification
	go s.sendLeadAssignmentNotification(context.Background(), lead)

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.String("user.id", userID.String()),
	)

	return nil
}

func (s *leadService) ConvertToClient(ctx context.Context, leadID uuid.UUID, req *domain.ConvertLeadRequest) (*domain.Client, error) {
	ctx, span := tracer.Start(ctx, "leadService.ConvertToClient")
	defer span.End()

	// Get lead
	lead, err := s.leadRepo.GetByID(ctx, leadID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get lead: %w", err)
	}

	// Validate if lead can be converted
	br := domain.BusinessRules{}
	if err := br.CanLeadBeConverted(lead); err != nil {
		return nil, fmt.Errorf("cannot convert lead: %w", err)
	}

	// Create client from lead
	client := &domain.Client{
		ID:               uuid.New(),
		LeadID:           &leadID,
		Name:             lead.Name,
		Email:            lead.Email,
		Phone:            lead.Phone,
		ClientType:       req.ClientType,
		Address:          req.Address,
		DateOfBirth:      req.DateOfBirth,
		AnniversaryDate:  req.AnniversaryDate,
		EmergencyContact: req.EmergencyContact,
		AssignedTo:       lead.AssignedTo,
		Tags:             lead.Tags,
		CustomFields:     make(domain.CustomFields),
		CreatedBy:        lead.CreatedBy,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// Save client
	if err := s.clientRepo.Create(ctx, client); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	// Update lead status to converted
	lead.Status = domain.LeadStatusConverted
	lead.UpdatedAt = time.Now()
	if err := s.leadRepo.Update(ctx, lead); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update lead status: %w", err)
	}

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.String("client.id", client.ID.String()),
	)

	return client, nil
}

func (s *leadService) BulkAssign(ctx context.Context, leadIDs []uuid.UUID, userID uuid.UUID) error {
	ctx, span := tracer.Start(ctx, "leadService.BulkAssign")
	defer span.End()

	// Verify user exists
	if _, err := s.userRepo.GetByID(ctx, userID); err != nil {
		span.RecordError(err)
		return fmt.Errorf("user not found: %w", err)
	}

	// Update all leads
	for _, leadID := range leadIDs {
		lead, err := s.leadRepo.GetByID(ctx, leadID)
		if err != nil {
			span.RecordError(err)
			continue // Skip invalid leads
		}

		lead.AssignedTo = &userID
		lead.UpdatedAt = time.Now()

		if err := s.leadRepo.Update(ctx, lead); err != nil {
			span.RecordError(err)
			continue // Skip failed updates
		}
	}

	span.SetAttributes(
		attribute.Int("leads.count", len(leadIDs)),
		attribute.String("user.id", userID.String()),
	)

	return nil
}

func (s *leadService) ImportLeads(ctx context.Context, req *domain.ImportLeadsRequest) (*domain.ImportResult, error) {
	ctx, span := tracer.Start(ctx, "leadService.ImportLeads")
	defer span.End()

	result := &domain.ImportResult{
		TotalRecords: len(req.Data),
	}

	for _, leadReq := range req.Data {
		_, err := s.Create(ctx, &leadReq)
		if err != nil {
			result.FailedImports++
			result.Errors = append(result.Errors, err.Error())
		} else {
			result.SuccessfulImports++
		}
	}

	span.SetAttributes(
		attribute.Int("import.total", result.TotalRecords),
		attribute.Int("import.success", result.SuccessfulImports),
		attribute.Int("import.failed", result.FailedImports),
	)

	return result, nil
}

func (s *leadService) UpdateScore(ctx context.Context, leadID uuid.UUID, score int) error {
	ctx, span := tracer.Start(ctx, "leadService.UpdateScore")
	defer span.End()

	// Validate score
	br := domain.BusinessRules{}
	if err := br.ValidateLeadScore(score); err != nil {
		return fmt.Errorf("invalid lead score: %w", err)
	}

	// Get lead
	lead, err := s.leadRepo.GetByID(ctx, leadID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get lead: %w", err)
	}

	// Update score
	lead.Score = score
	lead.UpdatedAt = time.Now()

	if err := s.leadRepo.Update(ctx, lead); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update lead score: %w", err)
	}

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.Int("lead.score", score),
	)

	return nil
}

func (s *leadService) ScheduleFollowUp(ctx context.Context, leadID uuid.UUID, req *domain.ScheduleFollowUpRequest) (*domain.FollowUp, error) {
	ctx, span := tracer.Start(ctx, "leadService.ScheduleFollowUp")
	defer span.End()

	// Get lead
	lead, err := s.leadRepo.GetByID(ctx, leadID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get lead: %w", err)
	}

	// Create follow-up
	followUp := &domain.FollowUp{
		ID:           uuid.New(),
		LeadID:       &leadID,
		FollowUpDate: req.FollowUpDate,
		FollowUpType: req.FollowUpType,
		Notes:        req.Notes,
		Status:       "pending",
		CreatedBy:    getUserIDFromContext(ctx),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.followUpRepo.Create(ctx, followUp); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create follow-up: %w", err)
	}

	// Update lead's next follow-up date
	lead.NextFollowUp = &req.FollowUpDate
	lead.UpdatedAt = time.Now()

	if err := s.leadRepo.Update(ctx, lead); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update lead: %w", err)
	}

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.String("followup.id", followUp.ID.String()),
	)

	return followUp, nil
}

func (s *leadService) GetOverdueFollowUps(ctx context.Context) ([]*domain.Lead, error) {
	ctx, span := tracer.Start(ctx, "leadService.GetOverdueFollowUps")
	defer span.End()

	leads, err := s.leadRepo.GetOverdueFollowUps(ctx)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get overdue follow-ups: %w", err)
	}

	span.SetAttributes(attribute.Int("leads.count", len(leads)))
	return leads, nil
}

// Helper functions
func getUserIDFromContext(ctx context.Context) uuid.UUID {
	if userID, ok := ctx.Value("user_id").(uuid.UUID); ok {
		return userID
	}
	return uuid.Nil
}

func (s *leadService) sendLeadAssignmentNotification(ctx context.Context, lead *domain.Lead) {
	if lead.AssignedTo == nil {
		return
	}

	notification := &domain.CreateNotificationRequest{
		UserID:  *lead.AssignedTo,
		Type:    "lead_assignment",
		Title:   "New Lead Assigned",
		Message: fmt.Sprintf("You have been assigned a new lead: %s", lead.Name),
		Data: map[string]interface{}{
			"lead_id": lead.ID.String(),
			"lead_name": lead.Name,
		},
	}

	if _, err := s.notificationService.Create(ctx, notification); err != nil {
		// Log error but don't fail the main operation
		fmt.Printf("Failed to send notification: %v\n", err)
	}
}
