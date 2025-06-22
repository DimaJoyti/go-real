package container

import (
	"fmt"

	"goreal-backend/internal/config"
	"goreal-backend/internal/domain"
	"goreal-backend/internal/handlers"
	"goreal-backend/internal/infrastructure/supabase"
	"goreal-backend/internal/observability"
	"goreal-backend/internal/services"
)

// Container holds all application dependencies
type Container struct {
	Config *config.Config

	// Observability
	Observability *observability.Observability

	// Infrastructure
	SupabaseClient *supabase.Client

	// Repositories
	UserRepository         domain.UserRepository
	LeadRepository         domain.LeadRepository
	CompanyRepository      domain.CompanyRepository
	ProjectRepository      domain.ProjectRepository
	TaskRepository         domain.TaskRepository
	SaleRepository         domain.SaleRepository
	ClientRepository       domain.ClientRepository
	NotificationRepository domain.NotificationRepository

	// Services
	AuthService      domain.AuthService
	UserService      domain.UserService
	LeadService      domain.LeadService
	ClientService    domain.ClientService
	TaskService      domain.TaskService
	SalesService     domain.SalesService
	AnalyticsService domain.AnalyticsService

	// Handlers
	AuthHandler *handlers.AuthHandlerNew
	// Add other handlers as needed
}

// NewContainer creates and initializes a new container with all dependencies
func NewContainer() (*Container, error) {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	// Initialize Supabase client
	supabaseClient, err := supabase.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase client: %w", err)
	}

	// Initialize repositories
	userRepo := supabase.NewUserRepository(supabaseClient)
	leadRepo := supabase.NewLeadRepository(supabaseClient)
	companyRepo := supabase.NewCompanyRepository(supabaseClient)
	projectRepo := supabase.NewProjectRepository(supabaseClient)
	taskRepo := supabase.NewTaskRepository(supabaseClient)
	saleRepo := supabase.NewSaleRepository(supabaseClient)
	clientRepo := supabase.NewClientRepository(supabaseClient)
	notificationRepo := supabase.NewNotificationRepository(supabaseClient)

	// Initialize observability
	obsConfig := observability.DefaultConfig("goreal-backend", "1.0.0", cfg.Environment)
	obs, err := observability.New(obsConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create observability: %w", err)
	}

	// Initialize services
	authService := services.NewAuthService(cfg, userRepo)
	userService := services.NewUserService(cfg, userRepo)
	notificationService := services.NewNotificationService(cfg)

	// Initialize core business services
	clientService := services.NewClientService(cfg, clientRepo, userRepo, companyRepo, leadRepo, notificationService)
	taskService := services.NewTaskService(cfg, taskRepo, userRepo, notificationService)
	salesService := services.NewSalesService(cfg, saleRepo, clientRepo, nil, userRepo, notificationService) // inventoryRepo will be added when implemented

	leadService := services.NewLeadService(cfg, leadRepo, clientRepo, userRepo, taskRepo, nil, notificationService) // followUpRepo will be added when implemented

	// Initialize analytics service
	analyticsService := services.NewAnalyticsService(leadRepo, clientRepo, saleRepo, nil, taskRepo, userRepo, nil) // inventoryRepo and cashbookRepo will be added when implemented

	// Initialize handlers
	authHandler := handlers.NewAuthHandlerNew(authService)

	return &Container{
		Config:               cfg,
		Observability:        obs,
		SupabaseClient:       supabaseClient,
		UserRepository:       userRepo,
		LeadRepository:       leadRepo,
		CompanyRepository:    companyRepo,
		ProjectRepository:    projectRepo,
		TaskRepository:       taskRepo,
		SaleRepository:       saleRepo,
		ClientRepository:     clientRepo,
		NotificationRepository: notificationRepo,
		AuthService:          authService,
		UserService:          userService,
		LeadService:          leadService,
		ClientService:        clientService,
		TaskService:          taskService,
		SalesService:         salesService,
		AnalyticsService:     analyticsService,
		AuthHandler:          authHandler,
	}, nil
}

// Health checks the health of all dependencies
func (c *Container) Health() error {
	// Check Supabase connection
	if err := c.SupabaseClient.Health(nil); err != nil {
		return fmt.Errorf("supabase health check failed: %w", err)
	}

	// Add other health checks as needed

	return nil
}

// Close gracefully shuts down all dependencies
func (c *Container) Close() error {
	// Add cleanup logic for any resources that need to be closed
	// For example, database connections, message queues, etc.
	
	return nil
}

// GetAuthHandler returns the authentication handler
func (c *Container) GetAuthHandler() *handlers.AuthHandlerNew {
	return c.AuthHandler
}

// GetConfig returns the application configuration
func (c *Container) GetConfig() *config.Config {
	return c.Config
}

// GetSupabaseClient returns the Supabase client
func (c *Container) GetSupabaseClient() *supabase.Client {
	return c.SupabaseClient
}

// GetUserService returns the user service
func (c *Container) GetUserService() domain.UserService {
	return c.UserService
}

// GetLeadService returns the lead service
func (c *Container) GetLeadService() domain.LeadService {
	return c.LeadService
}

// GetAuthService returns the auth service
func (c *Container) GetAuthService() domain.AuthService {
	return c.AuthService
}
