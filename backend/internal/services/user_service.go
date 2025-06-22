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

var userTracer = otel.Tracer("goreal-backend/services/user")

type userService struct {
	config   *config.Config
	userRepo domain.UserRepository
}

// NewUserService creates a new user service
func NewUserService(cfg *config.Config, userRepo domain.UserRepository) domain.UserService {
	return &userService{
		config:   cfg,
		userRepo: userRepo,
	}
}

// GetByID retrieves a user by ID
func (s *userService) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", id.String()))

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return user, nil
}

// GetByEmail retrieves a user by email
func (s *userService) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.GetByEmail")
	defer span.End()

	span.SetAttributes(attribute.String("user.email", email))

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return user, nil
}

// GetByUsername retrieves a user by username
func (s *userService) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.GetByUsername")
	defer span.End()

	span.SetAttributes(attribute.String("user.username", username))

	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return user, nil
}

// Create creates a new user
func (s *userService) Create(ctx context.Context, req *domain.CreateUserRequest) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("user.email", req.Email),
		attribute.String("user.username", req.Username),
		attribute.String("user.role", string(req.Role)),
	)

	// Validate request
	if req.Email == "" {
		return nil, fmt.Errorf("email is required")
	}
	if req.Username == "" {
		return nil, fmt.Errorf("username is required")
	}
	if req.FullName == "" {
		return nil, fmt.Errorf("full name is required")
	}

	// Check if user already exists
	existingUser, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", req.Email)
	}

	existingUser, err = s.userRepo.GetByUsername(ctx, req.Username)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with username %s already exists", req.Username)
	}

	// Create user without password (password will be set during registration)
	now := time.Now()
	user := &domain.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Username:     req.Username,
		FullName:     req.FullName,
		Bio:          req.Bio,
		Role:         req.Role,
		PasswordHash: "", // Will be set during registration
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// Update updates an existing user
func (s *userService) Update(ctx context.Context, id uuid.UUID, req *domain.UpdateUserRequest) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.Update")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", id.String()))

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Update fields
	if req.Username != nil {
		// Check if username is already taken by another user
		existingUser, err := s.userRepo.GetByUsername(ctx, *req.Username)
		if err == nil && existingUser != nil && existingUser.ID != id {
			return nil, fmt.Errorf("username %s is already taken", *req.Username)
		}
		user.Username = *req.Username
	}

	if req.FullName != nil {
		user.FullName = *req.FullName
	}

	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}

	if req.Bio != nil {
		user.Bio = req.Bio
	}

	if req.WalletAddress != nil {
		user.WalletAddress = req.WalletAddress
	}

	// Update timestamp
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return user, nil
}

// Delete deletes a user (soft delete by setting IsActive to false)
func (s *userService) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := userTracer.Start(ctx, "userService.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", id.String()))

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Soft delete by setting IsActive to false
	user.IsActive = false
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// List retrieves users with pagination and filtering
func (s *userService) List(ctx context.Context, filters domain.UserFilters) ([]*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	users, err := s.userRepo.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(users)))

	return users, nil
}

// Count returns the total number of users matching the filters
func (s *userService) Count(ctx context.Context, filters domain.UserFilters) (int, error) {
	ctx, span := userTracer.Start(ctx, "userService.Count")
	defer span.End()

	count, err := s.userRepo.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// UpdateRole updates a user's role
func (s *userService) UpdateRole(ctx context.Context, id uuid.UUID, role domain.UserRole) error {
	ctx, span := userTracer.Start(ctx, "userService.UpdateRole")
	defer span.End()

	span.SetAttributes(
		attribute.String("user.id", id.String()),
		attribute.String("user.role", string(role)),
	)

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Update role
	user.Role = role
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update user role: %w", err)
	}

	return nil
}

// ActivateUser activates a user account
func (s *userService) ActivateUser(ctx context.Context, id uuid.UUID) error {
	ctx, span := userTracer.Start(ctx, "userService.ActivateUser")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", id.String()))

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Activate user
	user.IsActive = true
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to activate user: %w", err)
	}

	return nil
}

// DeactivateUser deactivates a user account
func (s *userService) DeactivateUser(ctx context.Context, id uuid.UUID) error {
	ctx, span := userTracer.Start(ctx, "userService.DeactivateUser")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", id.String()))

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Deactivate user
	user.IsActive = false
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to deactivate user: %w", err)
	}

	return nil
}

// UpdateProfile updates user profile information
func (s *userService) UpdateProfile(ctx context.Context, id uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.UpdateProfile")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", id.String()))

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Update profile fields
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.Bio != nil {
		user.Bio = req.Bio
	}
	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}

	// Update timestamp
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	return user, nil
}

// UploadAvatar uploads and sets user avatar
func (s *userService) UploadAvatar(ctx context.Context, id uuid.UUID, fileData []byte, fileName string) (*domain.User, error) {
	ctx, span := userTracer.Start(ctx, "userService.UploadAvatar")
	defer span.End()

	span.SetAttributes(
		attribute.String("user.id", id.String()),
		attribute.String("file.name", fileName),
		attribute.Int("file.size", len(fileData)),
	)

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// TODO: Implement file upload to storage service
	// For now, just set a placeholder URL
	avatarURL := fmt.Sprintf("/uploads/avatars/%s_%s", id.String(), fileName)
	user.AvatarURL = &avatarURL
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update user avatar: %w", err)
	}

	return user, nil
}
