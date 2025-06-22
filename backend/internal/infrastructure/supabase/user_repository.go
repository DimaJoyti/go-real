package supabase

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/domain"
	"github.com/google/uuid"
)

// userRepository implements domain.UserRepository using Supabase
type userRepository struct {
	client *Client
}

// NewUserRepository creates a new user repository
func NewUserRepository(client *Client) domain.UserRepository {
	return &userRepository{
		client: client,
	}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	// Convert domain user to database model
	dbUser := &dbUser{
		ID:            user.ID,
		Email:         user.Email,
		Username:      user.Username,
		FullName:      user.FullName,
		Role:          string(user.Role),
		Bio:           user.Bio,
		AvatarURL:     user.AvatarURL,
		WalletAddress: user.WalletAddress,
		PasswordHash:  user.PasswordHash,
		IsActive:      user.IsActive,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}

	return r.client.ExecuteQuery(ctx, "insert", "profiles", func() error {
		return r.client.From("profiles").Insert(dbUser).Execute(ctx, nil)
	})
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var dbUser dbUser
	
	err := r.client.ExecuteQuery(ctx, "select_by_id", "profiles", func() error {
		return r.client.From("profiles").
			Select("*").
			Eq("id", id).
			Single(ctx, &dbUser)
	})
	
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return r.dbUserToDomain(&dbUser), nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var dbUser dbUser
	
	err := r.client.ExecuteQuery(ctx, "select_by_email", "profiles", func() error {
		return r.client.From("profiles").
			Select("*").
			Eq("email", email).
			Single(ctx, &dbUser)
	})
	
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return r.dbUserToDomain(&dbUser), nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	var dbUser dbUser
	
	err := r.client.ExecuteQuery(ctx, "select_by_username", "profiles", func() error {
		return r.client.From("profiles").
			Select("*").
			Eq("username", username).
			Single(ctx, &dbUser)
	})
	
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return r.dbUserToDomain(&dbUser), nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	// Convert domain user to database model
	dbUser := &dbUser{
		ID:            user.ID,
		Email:         user.Email,
		Username:      user.Username,
		FullName:      user.FullName,
		Role:          string(user.Role),
		Bio:           user.Bio,
		AvatarURL:     user.AvatarURL,
		WalletAddress: user.WalletAddress,
		PasswordHash:  user.PasswordHash,
		IsActive:      user.IsActive,
		LastLoginAt:   user.LastLoginAt,
		UpdatedAt:     time.Now(),
	}

	return r.client.ExecuteQuery(ctx, "update", "profiles", func() error {
		return r.client.From("profiles").
			Update(dbUser).
			Eq("id", user.ID).
			Execute(ctx, nil)
	})
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.ExecuteQuery(ctx, "delete", "profiles", func() error {
		return r.client.From("profiles").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})
}

func (r *userRepository) List(ctx context.Context, filters domain.UserFilters) ([]*domain.User, error) {
	query := r.client.From("profiles").Select("*")

	// Apply filters
	if filters.Role != nil {
		query = query.Eq("role", string(*filters.Role))
	}
	if filters.IsActive != nil {
		query = query.Eq("is_active", *filters.IsActive)
	}
	if filters.Search != nil && *filters.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		// Use OR condition for searching across multiple fields
		query = query.Or(fmt.Sprintf("full_name.ilike.%s,email.ilike.%s,username.ilike.%s", 
			searchPattern, searchPattern, searchPattern))
	}

	// Apply sorting
	if filters.SortBy != "" {
		ascending := filters.SortOrder != "desc"
		query = query.Order(filters.SortBy, ascending)
	} else {
		query = query.Order("created_at", false) // Default sort by created_at desc
	}

	// Apply pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	var dbUsers []dbUser
	err := r.client.ExecuteQuery(ctx, "select_list", "profiles", func() error {
		return query.Execute(ctx, &dbUsers)
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	// Convert to domain models
	users := make([]*domain.User, len(dbUsers))
	for i, dbUser := range dbUsers {
		users[i] = r.dbUserToDomain(&dbUser)
	}

	return users, nil
}

func (r *userRepository) Count(ctx context.Context, filters domain.UserFilters) (int, error) {
	query := r.client.From("profiles").Select("id")

	// Apply filters (same as List method)
	if filters.Role != nil {
		query = query.Eq("role", string(*filters.Role))
	}
	if filters.IsActive != nil {
		query = query.Eq("is_active", *filters.IsActive)
	}
	if filters.Search != nil && *filters.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("full_name.ilike.%s,email.ilike.%s,username.ilike.%s", 
			searchPattern, searchPattern, searchPattern))
	}

	var result []map[string]interface{}
	count, err := query.ExecuteWithCount(ctx, &result)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	return count, nil
}

// dbUser represents the database model for users
type dbUser struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	Email         string     `json:"email" db:"email"`
	Username      string     `json:"username" db:"username"`
	FullName      string     `json:"full_name" db:"full_name"`
	Role          string     `json:"role" db:"role"`
	Bio           *string    `json:"bio" db:"bio"`
	AvatarURL     *string    `json:"avatar_url" db:"avatar_url"`
	WalletAddress *string    `json:"wallet_address" db:"wallet_address"`
	PasswordHash  string     `json:"password_hash" db:"password_hash"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	LastLoginAt   *time.Time `json:"last_login_at" db:"last_login_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

// dbUserToDomain converts database user model to domain model
func (r *userRepository) dbUserToDomain(dbUser *dbUser) *domain.User {
	return &domain.User{
		ID:            dbUser.ID,
		Email:         dbUser.Email,
		Username:      dbUser.Username,
		FullName:      dbUser.FullName,
		Role:          domain.UserRole(dbUser.Role),
		Bio:           dbUser.Bio,
		AvatarURL:     dbUser.AvatarURL,
		WalletAddress: dbUser.WalletAddress,
		PasswordHash:  dbUser.PasswordHash,
		IsActive:      dbUser.IsActive,
		LastLoginAt:   dbUser.LastLoginAt,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}
}

// Helper function to handle nullable UUID fields
func nullableUUID(id *uuid.UUID) interface{} {
	if id == nil {
		return nil
	}
	return *id
}

// Helper function to handle nullable string fields
func nullableString(s *string) interface{} {
	if s == nil {
		return nil
	}
	return *s
}

// Helper function to handle nullable time fields
func nullableTime(t *time.Time) interface{} {
	if t == nil {
		return nil
	}
	return *t
}
