package handlers

import (
	"context"
	"goreal-backend/internal/domain"

	"github.com/google/uuid"
)

// Container holds all HTTP handlers
type Container struct {
	AuthHandler         *AuthChiHandler
	UserHandler         *UserHandler
	ClientHandler       *ClientChiHandler
	LeadHandler         *LeadHandler
	SalesHandler        *SalesHandler
	TaskHandler         *TaskChiHandler
	NotificationHandler *NotificationHandler
	AnalyticsHandler    *AnalyticsHandler
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
func NewContainer(
	authService domain.AuthService,
	userService domain.UserService,
	clientService domain.ClientService,
	leadService domain.LeadService,
	salesService domain.SalesService,
	taskService domain.TaskService,
	notificationService domain.NotificationService,
	analyticsService domain.AnalyticsService,
) *Container {
	return &Container{
		AuthHandler:         NewAuthChiHandler(authService),
		UserHandler:         NewUserHandler(userService),
		ClientHandler:       NewClientChiHandler(clientService),
		LeadHandler:         NewLeadHandler(leadService),
		SalesHandler:        NewSalesHandler(salesService),
		TaskHandler:         NewTaskChiHandler(taskService),
		NotificationHandler: NewNotificationHandler(notificationService),
		AnalyticsHandler:    NewAnalyticsHandler(analyticsService),
	}
}
