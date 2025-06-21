package services

import (
	"goreal-backend/internal/config"
)

// Container holds all service dependencies
type Container struct {
	Config *config.Config
	
	// Services
	AuthService      AuthService
	UserService      UserService
	ChallengeService ChallengeService
	FilmService      FilmService
	PropertyService  PropertyService
	CRMService       CRMService
}

// NewContainer creates a new service container
func NewContainer(cfg *config.Config) (*Container, error) {
	container := &Container{
		Config: cfg,
	}

	// Initialize services
	container.AuthService = NewAuthService(cfg)
	container.UserService = NewUserService(cfg)
	container.ChallengeService = NewChallengeService(cfg)
	container.FilmService = NewFilmService(cfg)
	container.PropertyService = NewPropertyService(cfg)
	container.CRMService = NewCRMService(cfg)

	return container, nil
}

// Service interfaces
type AuthService interface {
	Login(email, password string) (*AuthResponse, error)
	Register(req *RegisterRequest) (*AuthResponse, error)
	RefreshToken(token string) (*AuthResponse, error)
	ValidateToken(token string) (*TokenClaims, error)
}

type UserService interface {
	GetByID(id string) (*User, error)
	GetByEmail(email string) (*User, error)
	Update(id string, req *UpdateUserRequest) (*User, error)
	Delete(id string) error
}

type ChallengeService interface {
	Create(req *CreateChallengeRequest) (*Challenge, error)
	GetByID(id string) (*Challenge, error)
	List(filters *ChallengeFilters) ([]*Challenge, error)
	Update(id string, req *UpdateChallengeRequest) (*Challenge, error)
	Delete(id string) error
	Join(challengeID, userID string) error
	Submit(challengeID, userID string, req *SubmissionRequest) error
}

type FilmService interface {
	Create(req *CreateFilmRequest) (*Film, error)
	GetByID(id string) (*Film, error)
	List(filters *FilmFilters) ([]*Film, error)
	Update(id string, req *UpdateFilmRequest) (*Film, error)
	Delete(id string) error
	IncrementViews(id string) error
}

type PropertyService interface {
	Create(req *CreatePropertyRequest) (*Property, error)
	GetByID(id string) (*Property, error)
	List(filters *PropertyFilters) ([]*Property, error)
	Update(id string, req *UpdatePropertyRequest) (*Property, error)
	Delete(id string) error
	Tokenize(id string, req *TokenizeRequest) (*TokenizeResponse, error)
}

type CRMService interface {
	// Lead management
	CreateLead(req *CreateLeadRequest) (*Lead, error)
	GetLead(id string) (*Lead, error)
	ListLeads(filters *LeadFilters) ([]*Lead, error)
	UpdateLead(id string, req *UpdateLeadRequest) (*Lead, error)
	
	// Task management
	CreateTask(req *CreateTaskRequest) (*Task, error)
	GetTask(id string) (*Task, error)
	ListTasks(filters *TaskFilters) ([]*Task, error)
	UpdateTask(id string, req *UpdateTaskRequest) (*Task, error)
	
	// Sales management
	CreateSale(req *CreateSaleRequest) (*Sale, error)
	GetSale(id string) (*Sale, error)
	ListSales(filters *SaleFilters) ([]*Sale, error)
	UpdateSale(id string, req *UpdateSaleRequest) (*Sale, error)
}

// Request/Response types
type AuthResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
	ExpiresAt    int64  `json:"expires_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
}

type TokenClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

type User struct {
	ID           string  `json:"id"`
	Email        string  `json:"email"`
	Username     string  `json:"username"`
	FullName     string  `json:"full_name"`
	AvatarURL    *string `json:"avatar_url"`
	Bio          *string `json:"bio"`
	WalletAddress *string `json:"wallet_address"`
	Role         string  `json:"role"`
	IsActive     bool    `json:"is_active"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

type UpdateUserRequest struct {
	Username      *string `json:"username,omitempty"`
	FullName      *string `json:"full_name,omitempty"`
	Bio           *string `json:"bio,omitempty"`
	AvatarURL     *string `json:"avatar_url,omitempty"`
	WalletAddress *string `json:"wallet_address,omitempty"`
}

type Challenge struct {
	ID                  string   `json:"id"`
	Title               string   `json:"title"`
	Description         string   `json:"description"`
	CreatorID           string   `json:"creator_id"`
	StartDate           *string  `json:"start_date"`
	EndDate             *string  `json:"end_date"`
	RewardAmount        *float64 `json:"reward_amount"`
	RewardType          string   `json:"reward_type"`
	Status              string   `json:"status"`
	Rules               []string `json:"rules"`
	Tags                []string `json:"tags"`
	ImageURL            *string  `json:"image_url"`
	MaxParticipants     *int     `json:"max_participants"`
	CurrentParticipants int      `json:"current_participants"`
	CreatedAt           string   `json:"created_at"`
	UpdatedAt           string   `json:"updated_at"`
}

type CreateChallengeRequest struct {
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	StartDate       *string  `json:"start_date"`
	EndDate         *string  `json:"end_date"`
	RewardAmount    *float64 `json:"reward_amount"`
	RewardType      string   `json:"reward_type"`
	Rules           []string `json:"rules"`
	Tags            []string `json:"tags"`
	ImageURL        *string  `json:"image_url"`
	MaxParticipants *int     `json:"max_participants"`
}

type UpdateChallengeRequest struct {
	Title        *string  `json:"title,omitempty"`
	Description  *string  `json:"description,omitempty"`
	StartDate    *string  `json:"start_date,omitempty"`
	EndDate      *string  `json:"end_date,omitempty"`
	RewardAmount *float64 `json:"reward_amount,omitempty"`
	RewardType   *string  `json:"reward_type,omitempty"`
	Status       *string  `json:"status,omitempty"`
	Rules        []string `json:"rules,omitempty"`
	Tags         []string `json:"tags,omitempty"`
	ImageURL     *string  `json:"image_url,omitempty"`
}

type ChallengeFilters struct {
	Status    *string `json:"status"`
	CreatorID *string `json:"creator_id"`
	Tag       *string `json:"tag"`
	Limit     int     `json:"limit"`
	Offset    int     `json:"offset"`
}

type SubmissionRequest struct {
	SubmissionURL string `json:"submission_url"`
	Description   string `json:"description"`
}

// Placeholder types for other services
type Film struct{}
type CreateFilmRequest struct{}
type UpdateFilmRequest struct{}
type FilmFilters struct{}

type Property struct{}
type CreatePropertyRequest struct{}
type UpdatePropertyRequest struct{}
type PropertyFilters struct{}
type TokenizeRequest struct{}
type TokenizeResponse struct{}

type Lead struct{}
type CreateLeadRequest struct{}
type UpdateLeadRequest struct{}
type LeadFilters struct{}

type Task struct{}
type CreateTaskRequest struct{}
type UpdateTaskRequest struct{}
type TaskFilters struct{}

type Sale struct{}
type CreateSaleRequest struct{}
type UpdateSaleRequest struct{}
type SaleFilters struct{}
