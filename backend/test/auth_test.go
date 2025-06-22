package test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"goreal-backend/internal/domain"
	"goreal-backend/internal/middleware"
	"goreal-backend/pkg/jwt"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAuthService for testing
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Login(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
	args := m.Called(ctx, email, password)
	return args.Get(0).(*domain.AuthResponse), args.Error(1)
}

func (m *MockAuthService) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.AuthResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*domain.AuthResponse), args.Error(1)
}

func (m *MockAuthService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	args := m.Called(ctx, refreshToken)
	return args.Get(0).(*domain.AuthResponse), args.Error(1)
}

func (m *MockAuthService) Logout(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockAuthService) ValidateToken(ctx context.Context, token string) (*domain.User, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockAuthService) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	args := m.Called(ctx, userID, oldPassword, newPassword)
	return args.Error(0)
}

func (m *MockAuthService) ResetPassword(ctx context.Context, email string) error {
	args := m.Called(ctx, email)
	return args.Error(0)
}

func (m *MockAuthService) ConfirmPasswordReset(ctx context.Context, token, newPassword string) error {
	args := m.Called(ctx, token, newPassword)
	return args.Error(0)
}

func TestAuthMiddleware(t *testing.T) {
	mockAuthService := new(MockAuthService)

	// Create test router with auth middleware
	r := chi.NewRouter()
	
	// Protected endpoint
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthRequired(mockAuthService))
		r.Get("/protected", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("protected content"))
		})
	})

	t.Run("NoAuthHeader", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/protected", nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.Contains(t, w.Body.String(), "Authorization header required")
	})

	t.Run("InvalidAuthFormat", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "InvalidFormat")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid authorization format")
	})

	t.Run("InvalidToken", func(t *testing.T) {
		mockAuthService.On("ValidateToken", mock.Anything, "invalid-token").Return(nil, domain.ErrInvalidToken)

		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.Contains(t, w.Body.String(), "Invalid or expired token")

		mockAuthService.AssertExpectations(t)
	})

	t.Run("ValidToken", func(t *testing.T) {
		user := &domain.User{
			ID:       uuid.New(),
			Email:    "test@example.com",
			Username: "testuser",
			Role:     domain.RoleUser,
			IsActive: true,
		}

		mockAuthService.On("ValidateToken", mock.Anything, "valid-token").Return(user, nil)

		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer valid-token")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "protected content", w.Body.String())

		mockAuthService.AssertExpectations(t)
	})
}

func TestRoleBasedAccess(t *testing.T) {
	mockAuthService := new(MockAuthService)

	// Create test router with role-based middleware
	r := chi.NewRouter()
	
	// Admin-only endpoint
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthRequired(mockAuthService))
		r.Use(middleware.AdminOnly())
		r.Get("/admin", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("admin content"))
		})
	})

	// Employee+ endpoint
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthRequired(mockAuthService))
		r.Use(middleware.EmployeeOrAbove())
		r.Get("/employee", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("employee content"))
		})
	})

	t.Run("UserAccessingAdminEndpoint", func(t *testing.T) {
		user := &domain.User{
			ID:       uuid.New(),
			Email:    "user@example.com",
			Username: "user",
			Role:     domain.RoleUser,
			IsActive: true,
		}

		mockAuthService.On("ValidateToken", mock.Anything, "user-token").Return(user, nil)

		req := httptest.NewRequest("GET", "/admin", nil)
		req.Header.Set("Authorization", "Bearer user-token")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
		assert.Contains(t, w.Body.String(), "Insufficient permissions")

		mockAuthService.AssertExpectations(t)
	})

	t.Run("AdminAccessingAdminEndpoint", func(t *testing.T) {
		admin := &domain.User{
			ID:       uuid.New(),
			Email:    "admin@example.com",
			Username: "admin",
			Role:     domain.RoleAdmin,
			IsActive: true,
		}

		mockAuthService.On("ValidateToken", mock.Anything, "admin-token").Return(admin, nil)

		req := httptest.NewRequest("GET", "/admin", nil)
		req.Header.Set("Authorization", "Bearer admin-token")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "admin content", w.Body.String())

		mockAuthService.AssertExpectations(t)
	})

	t.Run("EmployeeAccessingEmployeeEndpoint", func(t *testing.T) {
		employee := &domain.User{
			ID:       uuid.New(),
			Email:    "employee@example.com",
			Username: "employee",
			Role:     domain.RoleEmployee,
			IsActive: true,
		}

		mockAuthService.On("ValidateToken", mock.Anything, "employee-token").Return(employee, nil)

		req := httptest.NewRequest("GET", "/employee", nil)
		req.Header.Set("Authorization", "Bearer employee-token")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "employee content", w.Body.String())

		mockAuthService.AssertExpectations(t)
	})
}

func TestJWTUtilities(t *testing.T) {
	jwtManager := jwt.NewJWTManager(
		"test-access-secret",
		"test-refresh-secret",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()
	email := "test@example.com"
	username := "testuser"
	role := "user"

	t.Run("GenerateAndValidateTokenPair", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, username, role)
		assert.NoError(t, err)
		assert.NotEmpty(t, tokenPair.AccessToken)
		assert.NotEmpty(t, tokenPair.RefreshToken)
		assert.Greater(t, tokenPair.ExpiresIn, int64(0))

		// Validate access token
		claims, err := jwtManager.ValidateAccessToken(tokenPair.AccessToken)
		assert.NoError(t, err)
		assert.Equal(t, userID.String(), claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Equal(t, username, claims.Username)
		assert.Equal(t, role, claims.Role)

		// Validate refresh token
		refreshClaims, err := jwtManager.ValidateRefreshToken(tokenPair.RefreshToken)
		assert.NoError(t, err)
		assert.Equal(t, userID.String(), refreshClaims.UserID)
	})

	t.Run("RefreshTokenPair", func(t *testing.T) {
		// Generate initial token pair
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, username, role)
		assert.NoError(t, err)

		// Refresh tokens
		newTokenPair, err := jwtManager.RefreshTokenPair(tokenPair.RefreshToken)
		assert.NoError(t, err)
		assert.NotEmpty(t, newTokenPair.AccessToken)
		assert.NotEmpty(t, newTokenPair.RefreshToken)

		// New tokens should be different
		assert.NotEqual(t, tokenPair.AccessToken, newTokenPair.AccessToken)
		assert.NotEqual(t, tokenPair.RefreshToken, newTokenPair.RefreshToken)
	})

	t.Run("InvalidToken", func(t *testing.T) {
		_, err := jwtManager.ValidateAccessToken("invalid-token")
		assert.Error(t, err)

		_, err = jwtManager.ValidateRefreshToken("invalid-token")
		assert.Error(t, err)
	})
}
