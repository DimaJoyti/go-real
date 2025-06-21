package services

import (
	"errors"
	"time"

	"goreal-backend/internal/config"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type authService struct {
	config *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(cfg *config.Config) AuthService {
	return &authService{
		config: cfg,
	}
}

// Login authenticates a user and returns a JWT token
func (s *authService) Login(email, password string) (*AuthResponse, error) {
	// TODO: Implement actual user lookup from Supabase
	// For now, return a mock response
	
	// Validate credentials (mock implementation)
	if email == "" || password == "" {
		return nil, errors.New("email and password are required")
	}

	// Mock user data
	user := &User{
		ID:       "mock-user-id",
		Email:    email,
		Username: "mockuser",
		FullName: "Mock User",
		Role:     "user",
		IsActive: true,
	}

	// Generate JWT token
	token, expiresAt, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	// Generate refresh token
	refreshToken, _, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
		ExpiresAt:    expiresAt,
	}, nil
}

// Register creates a new user account
func (s *authService) Register(req *RegisterRequest) (*AuthResponse, error) {
	// Validate input
	if req.Email == "" || req.Password == "" || req.Username == "" {
		return nil, errors.New("email, password, and username are required")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// TODO: Save user to Supabase
	_ = hashedPassword // Use the hashed password when implementing database save

	// Mock user creation
	user := &User{
		ID:       "new-user-id",
		Email:    req.Email,
		Username: req.Username,
		FullName: req.FullName,
		Role:     "user",
		IsActive: true,
	}

	// Generate tokens
	token, expiresAt, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, _, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
		ExpiresAt:    expiresAt,
	}, nil
}

// RefreshToken generates a new access token from a refresh token
func (s *authService) RefreshToken(refreshToken string) (*AuthResponse, error) {
	// Validate refresh token
	claims, err := s.validateRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// TODO: Get user from database using claims.UserID
	user := &User{
		ID:       claims.UserID,
		Email:    claims.Email,
		Role:     claims.Role,
		IsActive: true,
	}

	// Generate new access token
	token, expiresAt, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken, // Keep the same refresh token
		User:         user,
		ExpiresAt:    expiresAt,
	}, nil
}

// ValidateToken validates a JWT token and returns claims
func (s *authService) ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return &TokenClaims{
		UserID: claims.Subject,
		Email:  claims.Issuer, // Using issuer field for email (not ideal, but for demo)
		Role:   "user",        // TODO: Extract role from custom claims
	}, nil
}

// generateToken creates a JWT access token
func (s *authService) generateToken(user *User) (string, int64, error) {
	expiresAt := time.Now().Add(time.Duration(s.config.JWTExpiration) * time.Hour)
	
	claims := jwt.RegisteredClaims{
		Subject:   user.ID,
		Issuer:    user.Email,
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresAt.Unix(), nil
}

// generateRefreshToken creates a JWT refresh token
func (s *authService) generateRefreshToken(user *User) (string, int64, error) {
	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days
	
	claims := jwt.RegisteredClaims{
		Subject:   user.ID,
		Issuer:    user.Email,
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWTSecret + "_refresh"))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresAt.Unix(), nil
}

// validateRefreshToken validates a refresh token
func (s *authService) validateRefreshToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret + "_refresh"), nil
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
