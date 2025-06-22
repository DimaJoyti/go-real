package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"goreal-backend/internal/config"
	"goreal-backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var authTracer = otel.Tracer("goreal-backend/middleware/auth")

// AuthMiddleware provides JWT authentication middleware
type AuthMiddleware struct {
	config      *config.Config
	authService domain.AuthService
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(cfg *config.Config, authService domain.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		config:      cfg,
		authService: authService,
	}
}

// RequireAuth middleware that requires valid JWT token
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, span := authTracer.Start(c.Request.Context(), "auth.RequireAuth")
		defer span.End()

		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			span.RecordError(fmt.Errorf("missing authorization header"))
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		// Check Bearer token format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			span.RecordError(fmt.Errorf("invalid authorization header format"))
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := tokenParts[1]

		// Validate token and get user
		user, err := m.authService.ValidateToken(ctx, token)
		if err != nil {
			span.RecordError(err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Add user to context
		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Set("user_role", user.Role)

		// Add to request context for services
		ctx = context.WithValue(ctx, "user", user)
		ctx = context.WithValue(ctx, "user_id", user.ID)
		ctx = context.WithValue(ctx, "user_role", user.Role)
		c.Request = c.Request.WithContext(ctx)

		span.SetAttributes(
			attribute.String("user.id", user.ID.String()),
			attribute.String("user.email", user.Email),
			attribute.String("user.role", string(user.Role)),
		)

		c.Next()
	}
}

// RequireRole middleware that requires specific user role
func (m *AuthMiddleware) RequireRole(requiredRole domain.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, span := authTracer.Start(c.Request.Context(), "auth.RequireRole")
		defer span.End()

		// Get user from context (set by RequireAuth middleware)
		userInterface, exists := c.Get("user")
		if !exists {
			span.RecordError(fmt.Errorf("user not found in context"))
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		user, ok := userInterface.(*domain.User)
		if !ok {
			span.RecordError(fmt.Errorf("invalid user type in context"))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Internal server error",
			})
			c.Abort()
			return
		}

		// Check role hierarchy
		if !m.hasRequiredRole(user.Role, requiredRole) {
			span.RecordError(fmt.Errorf("insufficient permissions"))
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
			})
			c.Abort()
			return
		}

		span.SetAttributes(
			attribute.String("required.role", string(requiredRole)),
			attribute.String("user.role", string(user.Role)),
		)

		c.Next()
	}
}

// RequireAnyRole middleware that requires any of the specified roles
func (m *AuthMiddleware) RequireAnyRole(roles ...domain.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, span := authTracer.Start(c.Request.Context(), "auth.RequireAnyRole")
		defer span.End()

		// Get user from context
		userInterface, exists := c.Get("user")
		if !exists {
			span.RecordError(fmt.Errorf("user not found in context"))
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		user, ok := userInterface.(*domain.User)
		if !ok {
			span.RecordError(fmt.Errorf("invalid user type in context"))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Internal server error",
			})
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		hasRole := false
		for _, role := range roles {
			if m.hasRequiredRole(user.Role, role) {
				hasRole = true
				break
			}
		}

		if !hasRole {
			span.RecordError(fmt.Errorf("insufficient permissions"))
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
			})
			c.Abort()
			return
		}

		span.SetAttributes(
			attribute.String("user.role", string(user.Role)),
		)

		c.Next()
	}
}

// OptionalAuth middleware that extracts user if token is present but doesn't require it
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, span := authTracer.Start(c.Request.Context(), "auth.OptionalAuth")
		defer span.End()

		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Check Bearer token format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		token := tokenParts[1]

		// Validate token and get user
		user, err := m.authService.ValidateToken(ctx, token)
		if err != nil {
			// Log error but continue without user
			span.RecordError(err)
			c.Next()
			return
		}

		// Add user to context
		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Set("user_role", user.Role)

		// Add to request context
		ctx = context.WithValue(ctx, "user", user)
		ctx = context.WithValue(ctx, "user_id", user.ID)
		ctx = context.WithValue(ctx, "user_role", user.Role)
		c.Request = c.Request.WithContext(ctx)

		span.SetAttributes(
			attribute.String("user.id", user.ID.String()),
			attribute.String("user.email", user.Email),
			attribute.String("user.role", string(user.Role)),
		)

		c.Next()
	}
}

// RequireOwnership middleware that checks if user owns the resource
func (m *AuthMiddleware) RequireOwnership(resourceOwnerKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, span := authTracer.Start(c.Request.Context(), "auth.RequireOwnership")
		defer span.End()

		// Get user from context
		userInterface, exists := c.Get("user")
		if !exists {
			span.RecordError(fmt.Errorf("user not found in context"))
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		user, ok := userInterface.(*domain.User)
		if !ok {
			span.RecordError(fmt.Errorf("invalid user type in context"))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Internal server error",
			})
			c.Abort()
			return
		}

		// Admin and super admin can access everything
		if user.Role == domain.RoleAdmin || user.Role == domain.RoleSuperAdmin {
			c.Next()
			return
		}

		// Get resource owner ID from URL parameter
		resourceOwnerIDStr := c.Param(resourceOwnerKey)
		if resourceOwnerIDStr == "" {
			span.RecordError(fmt.Errorf("resource owner ID not found"))
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Resource owner ID required",
			})
			c.Abort()
			return
		}

		resourceOwnerID, err := uuid.Parse(resourceOwnerIDStr)
		if err != nil {
			span.RecordError(err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid resource owner ID",
			})
			c.Abort()
			return
		}

		// Check ownership
		if user.ID != resourceOwnerID {
			span.RecordError(fmt.Errorf("access denied: not resource owner"))
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied",
			})
			c.Abort()
			return
		}

		span.SetAttributes(
			attribute.String("resource.owner", resourceOwnerID.String()),
			attribute.String("user.id", user.ID.String()),
		)

		c.Next()
	}
}

// hasRequiredRole checks if user role meets the required role based on hierarchy
func (m *AuthMiddleware) hasRequiredRole(userRole, requiredRole domain.UserRole) bool {
	// Define role hierarchy (higher number = more permissions)
	roleHierarchy := map[domain.UserRole]int{
		domain.RoleClient:     1,
		domain.RoleEmployee:   2,
		domain.RoleManager:    3,
		domain.RoleAdmin:      4,
		domain.RoleSuperAdmin: 5,
	}

	userLevel := roleHierarchy[userRole]
	requiredLevel := roleHierarchy[requiredRole]

	return userLevel >= requiredLevel
}

// GetUserFromContext extracts user from gin context
func GetUserFromContext(c *gin.Context) (*domain.User, error) {
	userInterface, exists := c.Get("user")
	if !exists {
		return nil, fmt.Errorf("user not found in context")
	}

	user, ok := userInterface.(*domain.User)
	if !ok {
		return nil, fmt.Errorf("invalid user type in context")
	}

	return user, nil
}

// GetUserIDFromContext extracts user ID from gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, fmt.Errorf("user ID not found in context")
	}

	userID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid user ID type in context")
	}

	return userID, nil
}
