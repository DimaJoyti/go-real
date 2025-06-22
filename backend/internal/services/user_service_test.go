package services

import (
	"context"
	"testing"

	"goreal-backend/internal/config"
	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository is a mock implementation of UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	args := m.Called(ctx, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) Update(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepository) List(ctx context.Context, filters domain.UserFilters) ([]*domain.User, error) {
	args := m.Called(ctx, filters)
	return args.Get(0).([]*domain.User), args.Error(1)
}

func (m *MockUserRepository) Count(ctx context.Context, filters domain.UserFilters) (int, error) {
	args := m.Called(ctx, filters)
	return args.Int(0), args.Error(1)
}

func TestUserService_Create(t *testing.T) {
	// Setup
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{}
	service := NewUserService(cfg, mockRepo)

	ctx := context.Background()
	req := &domain.CreateUserRequest{
		Email:    "test@example.com",
		Username: "testuser",
		FullName: "Test User",
		Role:     domain.RoleUser,
	}

	// Mock expectations - return nil and error for "not found"
	mockRepo.On("GetByEmail", mock.Anything, req.Email).Return((*domain.User)(nil), assert.AnError)
	mockRepo.On("GetByUsername", mock.Anything, req.Username).Return((*domain.User)(nil), assert.AnError)
	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.User")).Return(nil)

	// Execute
	user, err := service.Create(ctx, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, req.Email, user.Email)
	assert.Equal(t, req.Username, user.Username)
	assert.Equal(t, req.FullName, user.FullName)
	assert.Equal(t, req.Role, user.Role)
	assert.True(t, user.IsActive)
	assert.NotEqual(t, uuid.Nil, user.ID)

	mockRepo.AssertExpectations(t)
}

func TestUserService_GetByID(t *testing.T) {
	// Setup
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{}
	service := NewUserService(cfg, mockRepo)

	ctx := context.Background()
	userID := uuid.New()
	expectedUser := &domain.User{
		ID:       userID,
		Email:    "test@example.com",
		Username: "testuser",
		FullName: "Test User",
		Role:     domain.RoleUser,
		IsActive: true,
	}

	// Mock expectations
	mockRepo.On("GetByID", mock.Anything, userID).Return(expectedUser, nil)

	// Execute
	user, err := service.GetByID(ctx, userID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedUser, user)

	mockRepo.AssertExpectations(t)
}
