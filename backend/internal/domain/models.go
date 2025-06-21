package domain

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Email        string     `json:"email" db:"email"`
	Username     string     `json:"username" db:"username"`
	FullName     string     `json:"full_name" db:"full_name"`
	AvatarURL    *string    `json:"avatar_url" db:"avatar_url"`
	Bio          *string    `json:"bio" db:"bio"`
	WalletAddress *string   `json:"wallet_address" db:"wallet_address"`
	Role         UserRole   `json:"role" db:"role"`
	IsActive     bool       `json:"is_active" db:"is_active"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// UserRole represents user roles in the system
type UserRole string

const (
	RoleUser      UserRole = "user"
	RoleCreator   UserRole = "creator"
	RoleAdmin     UserRole = "admin"
	RoleSuperAdmin UserRole = "super_admin"
)

// Challenge represents a social challenge
type Challenge struct {
	ID                  uuid.UUID       `json:"id" db:"id"`
	Title               string          `json:"title" db:"title"`
	Description         string          `json:"description" db:"description"`
	CreatorID           uuid.UUID       `json:"creator_id" db:"creator_id"`
	Creator             *User           `json:"creator,omitempty"`
	StartDate           *time.Time      `json:"start_date" db:"start_date"`
	EndDate             *time.Time      `json:"end_date" db:"end_date"`
	RewardAmount        *float64        `json:"reward_amount" db:"reward_amount"`
	RewardType          RewardType      `json:"reward_type" db:"reward_type"`
	Status              ChallengeStatus `json:"status" db:"status"`
	Rules               []string        `json:"rules" db:"rules"`
	Tags                []string        `json:"tags" db:"tags"`
	ImageURL            *string         `json:"image_url" db:"image_url"`
	MaxParticipants     *int            `json:"max_participants" db:"max_participants"`
	CurrentParticipants int             `json:"current_participants" db:"current_participants"`
	CreatedAt           time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at" db:"updated_at"`
}

// ChallengeStatus represents the status of a challenge
type ChallengeStatus string

const (
	ChallengeStatusDraft     ChallengeStatus = "draft"
	ChallengeStatusActive    ChallengeStatus = "active"
	ChallengeStatusCompleted ChallengeStatus = "completed"
	ChallengeStatusCancelled ChallengeStatus = "cancelled"
)

// RewardType represents the type of reward
type RewardType string

const (
	RewardTypeNFT    RewardType = "nft"
	RewardTypeToken  RewardType = "token"
	RewardTypePoints RewardType = "points"
	RewardTypeBadge  RewardType = "badge"
)

// Film represents a short film
type Film struct {
	ID           uuid.UUID   `json:"id" db:"id"`
	Title        string      `json:"title" db:"title"`
	Description  string      `json:"description" db:"description"`
	CreatorID    uuid.UUID   `json:"creator_id" db:"creator_id"`
	Creator      *User       `json:"creator,omitempty"`
	VideoURL     string      `json:"video_url" db:"video_url"`
	ThumbnailURL *string     `json:"thumbnail_url" db:"thumbnail_url"`
	Duration     int         `json:"duration" db:"duration"` // in seconds
	Genre        []string    `json:"genre" db:"genre"`
	Rating       float64     `json:"rating" db:"rating"`
	ViewCount    int         `json:"view_count" db:"view_count"`
	Status       FilmStatus  `json:"status" db:"status"`
	IsPublic     bool        `json:"is_public" db:"is_public"`
	CreatedAt    time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at" db:"updated_at"`
}

// FilmStatus represents the status of a film
type FilmStatus string

const (
	FilmStatusDraft     FilmStatus = "draft"
	FilmStatusProcessing FilmStatus = "processing"
	FilmStatusPublished FilmStatus = "published"
	FilmStatusArchived  FilmStatus = "archived"
)

// Property represents a real estate property
type Property struct {
	ID              uuid.UUID       `json:"id" db:"id"`
	Name            string          `json:"name" db:"name"`
	Address         string          `json:"address" db:"address"`
	PropertyType    PropertyType    `json:"property_type" db:"property_type"`
	TotalValue      float64         `json:"total_value" db:"total_value"`
	TokenID         *int            `json:"token_id" db:"token_id"`
	ContractAddress *string         `json:"contract_address" db:"contract_address"`
	CreatorID       uuid.UUID       `json:"creator_id" db:"creator_id"`
	Creator         *User           `json:"creator,omitempty"`
	Status          PropertyStatus  `json:"status" db:"status"`
	Images          []string        `json:"images" db:"images"`
	Documents       []string        `json:"documents" db:"documents"`
	Metadata        PropertyMetadata `json:"metadata" db:"metadata"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at" db:"updated_at"`
}

// PropertyType represents the type of property
type PropertyType string

const (
	PropertyTypeResidential PropertyType = "residential"
	PropertyTypeCommercial  PropertyType = "commercial"
	PropertyTypeIndustrial  PropertyType = "industrial"
	PropertyTypeLand        PropertyType = "land"
	PropertyTypeMixedUse    PropertyType = "mixed_use"
)

// PropertyStatus represents the status of a property
type PropertyStatus string

const (
	PropertyStatusDraft     PropertyStatus = "draft"
	PropertyStatusListed    PropertyStatus = "listed"
	PropertyStatusSold      PropertyStatus = "sold"
	PropertyTypeArchived    PropertyStatus = "archived"
)

// PropertyMetadata holds additional property information
type PropertyMetadata struct {
	Bedrooms    *int     `json:"bedrooms,omitempty"`
	Bathrooms   *int     `json:"bathrooms,omitempty"`
	SquareFeet  *int     `json:"square_feet,omitempty"`
	YearBuilt   *int     `json:"year_built,omitempty"`
	Amenities   []string `json:"amenities,omitempty"`
	Description string   `json:"description,omitempty"`
}

// ChallengeParticipation represents user participation in challenges
type ChallengeParticipation struct {
	ID          uuid.UUID `json:"id" db:"id"`
	ChallengeID uuid.UUID `json:"challenge_id" db:"challenge_id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	Status      ParticipationStatus `json:"status" db:"status"`
	Score       *int      `json:"score" db:"score"`
	SubmissionURL *string `json:"submission_url" db:"submission_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// ParticipationStatus represents the status of challenge participation
type ParticipationStatus string

const (
	ParticipationStatusJoined    ParticipationStatus = "joined"
	ParticipationStatusSubmitted ParticipationStatus = "submitted"
	ParticipationStatusCompleted ParticipationStatus = "completed"
	ParticipationStatusWithdrawn ParticipationStatus = "withdrawn"
)

// Notification represents a system notification
type Notification struct {
	ID        uuid.UUID        `json:"id" db:"id"`
	UserID    uuid.UUID        `json:"user_id" db:"user_id"`
	Type      NotificationType `json:"type" db:"type"`
	Title     string           `json:"title" db:"title"`
	Message   string           `json:"message" db:"message"`
	Data      map[string]interface{} `json:"data" db:"data"`
	IsRead    bool             `json:"is_read" db:"is_read"`
	CreatedAt time.Time        `json:"created_at" db:"created_at"`
}

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeChallenge NotificationType = "challenge"
	NotificationTypeFilm      NotificationType = "film"
	NotificationTypeProperty  NotificationType = "property"
	NotificationTypeSystem    NotificationType = "system"
)
