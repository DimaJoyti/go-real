package handlers

import (
	"context"
	"goreal-backend/internal/domain"
	"goreal-backend/internal/services"

	"github.com/google/uuid"
)

// Container holds all HTTP handlers
type Container struct {
	AuthHandler      *AuthHandler
	UserHandler      *UserHandler
	ChallengeHandler *ChallengeHandler
	FilmHandler      *FilmHandler
	PropertyHandler  *PropertyHandler
	CRMHandler       *CRMHandler
}

// authServiceAdapter adapts services.AuthService to domain.AuthService
type authServiceAdapter struct {
	authService domain.AuthService
}

func (a *authServiceAdapter) Login(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
	// TODO: Implement proper adapter
	return nil, nil
}

func (a *authServiceAdapter) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.AuthResponse, error) {
	// TODO: Implement proper adapter
	return nil, nil
}

func (a *authServiceAdapter) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	// TODO: Implement proper adapter
	return nil, nil
}

func (a *authServiceAdapter) Logout(ctx context.Context, userID uuid.UUID) error {
	// TODO: Implement proper adapter
	return nil
}

func (a *authServiceAdapter) ValidateToken(ctx context.Context, token string) (*domain.User, error) {
	// TODO: Implement proper adapter
	return nil, nil
}

func (a *authServiceAdapter) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	// TODO: Implement proper adapter
	return nil
}

func (a *authServiceAdapter) ResetPassword(ctx context.Context, email string) error {
	// TODO: Implement proper adapter
	return nil
}

func (a *authServiceAdapter) ConfirmPasswordReset(ctx context.Context, token, newPassword string) error {
	// TODO: Implement proper adapter
	return nil
}

// NewContainer creates a new handler container
func NewContainer(services *services.Container) *Container {
	authAdapter := &authServiceAdapter{authService: services.AuthService}

	return &Container{
		AuthHandler:      NewAuthHandler(authAdapter),
		UserHandler:      NewUserHandler(services.UserService),
		ChallengeHandler: NewChallengeHandler(services.ChallengeService),
		FilmHandler:      NewFilmHandler(services.FilmService),
		PropertyHandler:  NewPropertyHandler(services.PropertyService),
		CRMHandler:       NewCRMHandler(services.CRMService),
	}
}
