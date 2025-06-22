package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"goreal-backend/internal/config"
	"goreal-backend/internal/domain"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"golang.org/x/crypto/bcrypt"
)

var authTracer = otel.Tracer("goreal-backend/services/auth")

type authService struct {
	config   *config.Config
	userRepo domain.UserRepository
}

// NewAuthService creates a new auth service
func NewAuthService(cfg *config.Config, userRepo domain.UserRepository) domain.AuthService {
	return &authService{
		config:   cfg,
		userRepo: userRepo,
	}
}

// Login authenticates a user and returns a JWT token
func (s *authService) Login(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
	ctx, span := authTracer.Start(ctx, "authService.Login")
	defer span.End()

	span.SetAttributes(attribute.String("user.email", email))

	// Validate credentials
	if email == "" || password == "" {
		err := errors.New("email and password are required")
		span.RecordError(err)
		return nil, err
	}

	// Get user from database
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if user.PasswordHash == "" {
		err := errors.New("user has no password set")
		span.RecordError(err)
		return nil, fmt.Errorf("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("invalid credentials")
	}

	// Check if user is active
	if !user.IsActive {
		err := errors.New("user account is inactive")
		span.RecordError(err)
		return nil, err
	}

	// Generate JWT token
	accessToken, expiresIn, err := s.generateAccessToken(user)
	if err != nil {
		span.RecordError(err)
		return nil, err
	}

	// Generate refresh token
	refreshToken, _, err := s.generateRefreshToken(user)
	if err != nil {
		span.RecordError(err)
		return nil, err
	}

	// Update last login time
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.userRepo.Update(ctx, user); err != nil {
		// Log error but don't fail login
		span.RecordError(fmt.Errorf("failed to update last login: %w", err))
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
		attribute.String("user.role", string(user.Role)),
	)

	return &domain.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
	}, nil
}

// Register creates a new user account
func (s *authService) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.AuthResponse, error) {
	ctx, span := authTracer.Start(ctx, "authService.Register")
	defer span.End()

	span.SetAttributes(attribute.String("user.email", req.Email))

	// Validate input
	if req.Email == "" || req.Password == "" || req.Username == "" {
		err := errors.New("email, password, and username are required")
		span.RecordError(err)
		return nil, err
	}

	// Check if user already exists
	existingUser, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		err := errors.New("user with this email already exists")
		span.RecordError(err)
		return nil, err
	}

	// Check if username is taken
	existingUser, err = s.userRepo.GetByUsername(ctx, req.Username)
	if err == nil && existingUser != nil {
		err := errors.New("username is already taken")
		span.RecordError(err)
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	now := time.Now()
	user := &domain.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Username:     req.Username,
		FullName:     req.FullName,
		Role:         req.Role,
		PasswordHash: string(hashedPassword),
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Save user to database
	if err := s.userRepo.Create(ctx, user); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	accessToken, expiresIn, err := s.generateAccessToken(user)
	if err != nil {
		span.RecordError(err)
		return nil, err
	}

	refreshToken, _, err := s.generateRefreshToken(user)
	if err != nil {
		span.RecordError(err)
		return nil, err
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
		attribute.String("user.role", string(user.Role)),
	)

	return &domain.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
	}, nil
}

// RefreshToken generates a new access token from a refresh token
func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	ctx, span := authTracer.Start(ctx, "authService.RefreshToken")
	defer span.End()

	// Validate refresh token
	claims, err := s.validateRefreshToken(refreshToken)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Get user from database
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("invalid user ID in token: %w", err)
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if user is still active
	if !user.IsActive {
		err := errors.New("user account is inactive")
		span.RecordError(err)
		return nil, err
	}

	// Generate new access token
	accessToken, expiresIn, err := s.generateAccessToken(user)
	if err != nil {
		span.RecordError(err)
		return nil, err
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
		attribute.String("user.email", user.Email),
	)

	return &domain.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken, // Keep the same refresh token
		ExpiresIn:    expiresIn,
	}, nil
}

// Logout handles user logout
func (s *authService) Logout(ctx context.Context, userID uuid.UUID) error {
	ctx, span := authTracer.Start(ctx, "authService.Logout")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	// In a real implementation, you might want to:
	// 1. Invalidate the refresh token in the database
	// 2. Add the access token to a blacklist
	// For now, we'll just log the logout event

	// TODO: Implement token blacklisting or refresh token invalidation
	// This could involve storing active tokens in Redis or database

	return nil
}

// ValidateToken validates a JWT token and returns the user
func (s *authService) ValidateToken(ctx context.Context, tokenString string) (*domain.User, error) {
	ctx, span := authTracer.Start(ctx, "authService.ValidateToken")
	defer span.End()

	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWT.AccessSecret), nil
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		err := errors.New("invalid token")
		span.RecordError(err)
		return nil, err
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		err := errors.New("invalid token claims")
		span.RecordError(err)
		return nil, err
	}

	// Get user from database
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("invalid user ID in token: %w", err)
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if user is still active
	if !user.IsActive {
		err := errors.New("user account is inactive")
		span.RecordError(err)
		return nil, err
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
		attribute.String("user.email", user.Email),
		attribute.String("user.role", string(user.Role)),
	)

	return user, nil
}

// generateAccessToken creates a JWT access token
func (s *authService) generateAccessToken(user *domain.User) (string, int, error) {
	expiresAt := time.Now().Add(s.config.JWT.AccessTokenExpiry)

	claims := jwt.RegisteredClaims{
		Subject:   user.ID.String(),
		Issuer:    user.Email,
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWT.AccessSecret))
	if err != nil {
		return "", 0, err
	}

	// Return expires_in as seconds from now
	expiresIn := int(s.config.JWT.AccessTokenExpiry.Seconds())
	return tokenString, expiresIn, nil
}

// generateRefreshToken creates a JWT refresh token
func (s *authService) generateRefreshToken(user *domain.User) (string, int64, error) {
	expiresAt := time.Now().Add(s.config.JWT.RefreshTokenExpiry)

	claims := jwt.RegisteredClaims{
		Subject:   user.ID.String(),
		Issuer:    user.Email,
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWT.RefreshSecret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresAt.Unix(), nil
}

// validateRefreshToken validates a refresh token
func (s *authService) validateRefreshToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWT.RefreshSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return nil, errors.New("invalid refresh token claims")
	}

	return &TokenClaims{
		UserID: claims.Subject,
		Email:  claims.Issuer,
		Role:   "user",
	}, nil
}

func (s *authService) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	_, span := authTracer.Start(ctx, "authService.ChangePassword")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	// Get user from database
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("user not found: %w", err)
	}

	// Verify old password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword))
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("invalid current password")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, email string) error {
	_, span := authTracer.Start(ctx, "authService.ResetPassword")
	defer span.End()

	span.SetAttributes(attribute.String("user.email", email))

	// Check if user exists
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		// Don't reveal if user exists or not for security
		return nil
	}

	if !user.IsActive {
		// Don't reveal if user exists or not for security
		return nil
	}

	// TODO: Implement password reset with email
	// 1. Generate reset token
	// 2. Store token with expiration in database
	// 3. Send reset email to user
	// For now, just log the request

	return fmt.Errorf("password reset email functionality not yet implemented")
}

func (s *authService) ConfirmPasswordReset(ctx context.Context, token, newPassword string) error {
	ctx, span := authTracer.Start(ctx, "authService.ConfirmPasswordReset")
	defer span.End()

	span.SetAttributes(attribute.String("reset.token", token))

	// TODO: Implement password reset confirmation
	// 1. Validate reset token from database
	// 2. Check if token is not expired
	// 3. Get user associated with token
	// 4. Hash new password
	// 5. Update user password
	// 6. Invalidate reset token

	return fmt.Errorf("password reset confirmation not yet implemented")
}
