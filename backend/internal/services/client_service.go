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

var clientTracer = otel.Tracer("goreal-backend/services/client")

type clientService struct {
	config              *config.Config
	clientRepo          domain.ClientRepository
	userRepo            domain.UserRepository
	companyRepo         domain.CompanyRepository
	leadRepo            domain.LeadRepository
	notificationService domain.NotificationService
}

// NewClientService creates a new client service
func NewClientService(
	cfg *config.Config,
	clientRepo domain.ClientRepository,
	userRepo domain.UserRepository,
	companyRepo domain.CompanyRepository,
	leadRepo domain.LeadRepository,
	notificationService domain.NotificationService,
) domain.ClientService {
	return &clientService{
		config:              cfg,
		clientRepo:          clientRepo,
		userRepo:            userRepo,
		companyRepo:         companyRepo,
		leadRepo:            leadRepo,
		notificationService: notificationService,
	}
}

// Create creates a new client
func (s *clientService) Create(ctx context.Context, req *domain.CreateClientRequest) (*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.name", req.Name),
		attribute.String("client.type", string(req.ClientType)),
	)

	if req.Email != nil {
		span.SetAttributes(attribute.String("client.email", *req.Email))
	}

	// Validate request
	if req.Name == "" {
		return nil, fmt.Errorf("client name is required")
	}
	if req.Email != nil && *req.Email == "" {
		return nil, fmt.Errorf("client email cannot be empty")
	}

	// Check if client already exists
	if req.Email != nil {
		existingClient, err := s.clientRepo.GetByEmail(ctx, *req.Email)
		if err == nil && existingClient != nil {
			return nil, fmt.Errorf("client with email %s already exists", *req.Email)
		}
	}

	// Validate assigned user if provided
	if req.AssignedTo != nil {
		_, err := s.userRepo.GetByID(ctx, *req.AssignedTo)
		if err != nil {
			return nil, fmt.Errorf("assigned user not found: %w", err)
		}
	}

	// Validate company if provided
	if req.CompanyID != nil {
		_, err := s.companyRepo.GetByID(ctx, *req.CompanyID)
		if err != nil {
			return nil, fmt.Errorf("company not found: %w", err)
		}
	}

	// Create client
	now := time.Now()
	client := &domain.Client{
		ID:               uuid.New(),
		Name:             req.Name,
		Email:            req.Email,
		Phone:            req.Phone,
		AlternatePhone:   req.AlternatePhone,
		Address:          req.Address,
		ClientType:       req.ClientType,
		CompanyID:        req.CompanyID,
		DateOfBirth:      req.DateOfBirth,
		AnniversaryDate:  req.AnniversaryDate,
		EmergencyContact: req.EmergencyContact,
		AssignedTo:       req.AssignedTo,
		Tags:             req.Tags,
		IsVerified:       false,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.clientRepo.Create(ctx, client); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	// Send notification to assigned user
	if client.AssignedTo != nil {
		go s.sendClientAssignmentNotification(context.Background(), client)
	}

	return client, nil
}

// GetByID retrieves a client by ID
func (s *clientService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	client, err := s.clientRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get client by ID: %w", err)
	}

	return client, nil
}

// GetByEmail retrieves a client by email
func (s *clientService) GetByEmail(ctx context.Context, email string) (*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.GetByEmail")
	defer span.End()

	span.SetAttributes(attribute.String("client.email", email))

	client, err := s.clientRepo.GetByEmail(ctx, email)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get client by email: %w", err)
	}

	return client, nil
}

// Update updates an existing client
func (s *clientService) Update(ctx context.Context, id uuid.UUID, req *domain.UpdateClientRequest) (*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.Update")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	// Get existing client
	client, err := s.clientRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get client: %w", err)
	}

	// Update fields
	if req.Name != nil {
		client.Name = *req.Name
	}
	if req.Email != nil {
		// Check if email is already taken by another client
		existingClient, err := s.clientRepo.GetByEmail(ctx, *req.Email)
		if err == nil && existingClient != nil && existingClient.ID != id {
			return nil, fmt.Errorf("email %s is already taken", *req.Email)
		}
		client.Email = req.Email
	}
	if req.Phone != nil {
		client.Phone = req.Phone
	}
	if req.Address != nil {
		client.Address = req.Address
	}
	if req.ClientType != nil {
		client.ClientType = *req.ClientType
	}
	if req.CompanyID != nil {
		// Validate company exists
		if *req.CompanyID != uuid.Nil {
			_, err := s.companyRepo.GetByID(ctx, *req.CompanyID)
			if err != nil {
				return nil, fmt.Errorf("company not found: %w", err)
			}
		}
		client.CompanyID = req.CompanyID
	}
	if req.AssignedTo != nil {
		// Validate user exists
		if *req.AssignedTo != uuid.Nil {
			_, err := s.userRepo.GetByID(ctx, *req.AssignedTo)
			if err != nil {
				return nil, fmt.Errorf("assigned user not found: %w", err)
			}
		}
		
		// Send notification if assignment changed
		if client.AssignedTo == nil || *client.AssignedTo != *req.AssignedTo {
			client.AssignedTo = req.AssignedTo
			go s.sendClientAssignmentNotification(context.Background(), client)
		} else {
			client.AssignedTo = req.AssignedTo
		}
	}
	// Note: Client struct doesn't have Notes field
	// Notes could be stored in CustomFields or a separate notes system

	// Update timestamp
	client.UpdatedAt = time.Now()

	if err := s.clientRepo.Update(ctx, client); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update client: %w", err)
	}

	return client, nil
}

// Delete deletes a client
func (s *clientService) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := clientTracer.Start(ctx, "clientService.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	if err := s.clientRepo.Delete(ctx, id); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete client: %w", err)
	}

	return nil
}

// List retrieves clients with pagination and filtering
func (s *clientService) List(ctx context.Context, filters domain.ClientFilters) ([]*domain.Client, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	clients, err := s.clientRepo.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list clients: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(clients)))

	return clients, nil
}

// Count returns the total number of clients matching the filters
func (s *clientService) Count(ctx context.Context, filters domain.ClientFilters) (int, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.Count")
	defer span.End()

	count, err := s.clientRepo.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count clients: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// VerifyClient verifies a client
func (s *clientService) VerifyClient(ctx context.Context, id uuid.UUID) error {
	ctx, span := clientTracer.Start(ctx, "clientService.VerifyClient")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	if err := s.clientRepo.UpdateVerificationStatus(ctx, id, true); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to verify client: %w", err)
	}

	// Send verification notification
	client, err := s.clientRepo.GetByID(ctx, id)
	if err == nil {
		go s.sendClientVerificationNotification(context.Background(), client)
	}

	return nil
}

// UnverifyClient unverifies a client
func (s *clientService) UnverifyClient(ctx context.Context, id uuid.UUID) error {
	ctx, span := clientTracer.Start(ctx, "clientService.UnverifyClient")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", id.String()))

	if err := s.clientRepo.UpdateVerificationStatus(ctx, id, false); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to unverify client: %w", err)
	}

	return nil
}

// AssignToUser assigns a client to a user
func (s *clientService) AssignToUser(ctx context.Context, clientID, userID uuid.UUID) error {
	ctx, span := clientTracer.Start(ctx, "clientService.AssignToUser")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.id", clientID.String()),
		attribute.String("user.id", userID.String()),
	)

	// Validate user exists
	_, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("assigned user not found: %w", err)
	}

	// Get client
	client, err := s.clientRepo.GetByID(ctx, clientID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get client: %w", err)
	}

	// Update assignment
	client.AssignedTo = &userID
	client.UpdatedAt = time.Now()

	if err := s.clientRepo.Update(ctx, client); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to assign client: %w", err)
	}

	// Send notification
	go s.sendClientAssignmentNotification(context.Background(), client)

	return nil
}

// sendClientAssignmentNotification sends a notification when a client is assigned
func (s *clientService) sendClientAssignmentNotification(ctx context.Context, client *domain.Client) {
	if client.AssignedTo == nil || s.notificationService == nil {
		return
	}

	notification := &domain.CreateNotificationRequest{
		UserID:  *client.AssignedTo,
		Type:    string(domain.NotificationTypeClientAssigned),
		Title:   "New Client Assigned",
		Message: fmt.Sprintf("You have been assigned to client: %s", client.Name),
		Data: map[string]interface{}{
			"client_id":   client.ID.String(),
			"client_name": client.Name,
		},
	}

	s.notificationService.Create(ctx, notification)
}

// sendClientVerificationNotification sends a notification when a client is verified
func (s *clientService) sendClientVerificationNotification(ctx context.Context, client *domain.Client) {
	if client.AssignedTo == nil || s.notificationService == nil {
		return
	}

	notification := &domain.CreateNotificationRequest{
		UserID:  *client.AssignedTo,
		Type:    string(domain.NotificationTypeClientVerified),
		Title:   "Client Verified",
		Message: fmt.Sprintf("Client %s has been verified", client.Name),
		Data: map[string]interface{}{
			"client_id":   client.ID.String(),
			"client_name": client.Name,
		},
	}

	s.notificationService.Create(ctx, notification)
}

// VerifyKYC verifies client KYC documents
func (s *clientService) VerifyKYC(ctx context.Context, clientID uuid.UUID, documents []string) error {
	ctx, span := clientTracer.Start(ctx, "clientService.VerifyKYC")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.id", clientID.String()),
		attribute.Int("documents.count", len(documents)),
	)

	// Get client to validate it exists
	client, err := s.clientRepo.GetByID(ctx, clientID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get client: %w", err)
	}

	// TODO: Implement actual KYC verification logic
	// This would typically involve:
	// 1. Validating document formats and content
	// 2. Running documents through verification services
	// 3. Updating client verification status
	// 4. Storing document references

	// For now, just mark as verified using the VerifyClient method
	if err := s.VerifyClient(ctx, clientID); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update verification status: %w", err)
	}

	// Send verification notification
	go s.sendClientVerificationNotification(context.Background(), client)

	return nil
}

// UpdateCreditLimit updates client credit limit
func (s *clientService) UpdateCreditLimit(ctx context.Context, clientID uuid.UUID, limit float64) error {
	ctx, span := clientTracer.Start(ctx, "clientService.UpdateCreditLimit")
	defer span.End()

	span.SetAttributes(
		attribute.String("client.id", clientID.String()),
		attribute.Float64("credit.limit", limit),
	)

	// Get client to validate it exists
	client, err := s.clientRepo.GetByID(ctx, clientID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get client: %w", err)
	}

	// TODO: Implement credit limit update logic
	// This would typically involve:
	// 1. Validating the new credit limit
	// 2. Checking authorization for the update
	// 3. Updating the client record
	// 4. Logging the change for audit purposes

	// For now, this is a placeholder
	_ = client
	_ = limit

	return fmt.Errorf("credit limit update not implemented")
}

// GetClientHistory retrieves client interaction history
func (s *clientService) GetClientHistory(ctx context.Context, clientID uuid.UUID) (*domain.ClientHistory, error) {
	ctx, span := clientTracer.Start(ctx, "clientService.GetClientHistory")
	defer span.End()

	span.SetAttributes(attribute.String("client.id", clientID.String()))

	// Get client to validate it exists
	client, err := s.clientRepo.GetByID(ctx, clientID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get client: %w", err)
	}

	// TODO: Implement client history retrieval
	// This would typically involve:
	// 1. Getting all interactions (calls, meetings, emails)
	// 2. Getting all transactions and sales
	// 3. Getting all tasks and follow-ups
	// 4. Getting all documents and communications
	// 5. Compiling into a comprehensive history

	// For now, return a placeholder
	history := &domain.ClientHistory{
		Client:      client,
		Sales:       []*domain.Sale{},
		Tasks:       []*domain.Task{},
		FollowUps:   []*domain.FollowUp{},
		TotalValue:  0,
		LastContact: nil,
	}

	return history, nil
}
