package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims represents JWT claims
type Claims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// TokenPair represents access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// JWTManager handles JWT operations
type JWTManager struct {
	accessSecret         string
	refreshSecret        string
	accessTokenDuration  time.Duration
	refreshTokenDuration time.Duration
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(accessSecret, refreshSecret string, accessDuration, refreshDuration time.Duration) *JWTManager {
	return &JWTManager{
		accessSecret:         accessSecret,
		refreshSecret:        refreshSecret,
		accessTokenDuration:  accessDuration,
		refreshTokenDuration: refreshDuration,
	}
}

// GenerateTokenPair generates access and refresh tokens
func (j *JWTManager) GenerateTokenPair(userID uuid.UUID, email, username, role string) (*TokenPair, error) {
	// Generate access token
	accessToken, err := j.generateAccessToken(userID, email, username, role)
	if err != nil {
		return nil, err
	}

	// Generate refresh token
	refreshToken, err := j.generateRefreshToken(userID, email, username, role)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(j.accessTokenDuration.Seconds()),
	}, nil
}

// generateAccessToken generates an access token
func (j *JWTManager) generateAccessToken(userID uuid.UUID, email, username, role string) (string, error) {
	claims := Claims{
		UserID:   userID.String(),
		Email:    email,
		Role:     role,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.accessTokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "goreal-backend",
			Subject:   userID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.accessSecret))
}

// generateRefreshToken generates a refresh token
func (j *JWTManager) generateRefreshToken(userID uuid.UUID, email, username, role string) (string, error) {
	claims := Claims{
		UserID:   userID.String(),
		Email:    email,
		Role:     role,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.refreshTokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "goreal-backend",
			Subject:   userID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.refreshSecret))
}

// ValidateAccessToken validates an access token and returns claims
func (j *JWTManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	return j.validateToken(tokenString, j.accessSecret)
}

// ValidateRefreshToken validates a refresh token and returns claims
func (j *JWTManager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	return j.validateToken(tokenString, j.refreshSecret)
}

// validateToken validates a token with the given secret
func (j *JWTManager) validateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Check if token is expired
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}

// RefreshTokenPair generates new tokens using a valid refresh token
func (j *JWTManager) RefreshTokenPair(refreshToken string) (*TokenPair, error) {
	// Validate refresh token
	claims, err := j.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Parse user ID
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, errors.New("invalid user ID in token")
	}

	// Generate new token pair
	return j.GenerateTokenPair(userID, claims.Email, claims.Username, claims.Role)
}

// ExtractUserID extracts user ID from token without validation
func ExtractUserID(tokenString string) (string, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return "", errors.New("invalid claims")
	}

	return claims.UserID, nil
}

// GetTokenExpiration returns the expiration time of a token
func (j *JWTManager) GetTokenExpiration(tokenString string) (time.Time, error) {
	claims, err := j.ValidateAccessToken(tokenString)
	if err != nil {
		return time.Time{}, err
	}

	if claims.ExpiresAt == nil {
		return time.Time{}, errors.New("no expiration time in token")
	}

	return claims.ExpiresAt.Time, nil
}

// IsTokenExpired checks if a token is expired
func (j *JWTManager) IsTokenExpired(tokenString string) bool {
	expTime, err := j.GetTokenExpiration(tokenString)
	if err != nil {
		return true
	}
	return expTime.Before(time.Now())
}

// GetTokenClaims returns all claims from a token
func (j *JWTManager) GetTokenClaims(tokenString string) (*Claims, error) {
	return j.ValidateAccessToken(tokenString)
}
