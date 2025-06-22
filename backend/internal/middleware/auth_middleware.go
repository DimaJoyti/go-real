package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"goreal-backend/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var authTracer = otel.Tracer("goreal-backend/middleware/auth")

// AuthRequired middleware that requires valid JWT token
func AuthRequired(authService domain.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "middleware.AuthRequired")
			defer span.End()

			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				span.SetAttributes(attribute.String("error", "missing_authorization_header"))
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			// Check if it's a Bearer token
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				span.SetAttributes(attribute.String("error", "invalid_authorization_format"))
				http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
				return
			}

			token := parts[1]
			if token == "" {
				span.SetAttributes(attribute.String("error", "empty_token"))
				http.Error(w, "Token required", http.StatusUnauthorized)
				return
			}

			// Validate token
			user, err := authService.ValidateToken(ctx, token)
			if err != nil {
				span.RecordError(err)
				span.SetAttributes(attribute.String("error", "invalid_token"))
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			// Add user to context
			ctx = context.WithValue(ctx, "user", user)
			ctx = context.WithValue(ctx, "user_id", user.ID.String())

			span.SetAttributes(
				attribute.String("user.id", user.ID.String()),
				attribute.String("user.email", user.Email),
				attribute.String("user.role", string(user.Role)),
			)

			// Continue with the request
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole middleware that requires specific user role
func RequireRole(roles ...domain.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "middleware.RequireRole")
			defer span.End()

			// Get user from context (should be set by AuthRequired middleware)
			user, ok := ctx.Value("user").(*domain.User)
			if !ok {
				span.SetAttributes(attribute.String("error", "user_not_in_context"))
				http.Error(w, "User not authenticated", http.StatusUnauthorized)
				return
			}

			// Check if user has required role
			hasRole := false
			for _, role := range roles {
				if user.Role == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				span.SetAttributes(
					attribute.String("user.role", string(user.Role)),
					attribute.StringSlice("required.roles", roleSliceToStringSlice(roles)),
					attribute.String("error", "insufficient_permissions"),
				)
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			span.SetAttributes(
				attribute.String("user.id", user.ID.String()),
				attribute.String("user.role", string(user.Role)),
				attribute.Bool("access.granted", true),
			)

			// Continue with the request
			next.ServeHTTP(w, r)
		})
	}
}

// RequireMinRole middleware that requires minimum user role level
func RequireMinRole(minRole domain.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "middleware.RequireMinRole")
			defer span.End()

			// Get user from context
			user, ok := ctx.Value("user").(*domain.User)
			if !ok {
				span.SetAttributes(attribute.String("error", "user_not_in_context"))
				http.Error(w, "User not authenticated", http.StatusUnauthorized)
				return
			}

			// Check role hierarchy
			if !hasMinimumRole(user.Role, minRole) {
				span.SetAttributes(
					attribute.String("user.role", string(user.Role)),
					attribute.String("required.min_role", string(minRole)),
					attribute.String("error", "insufficient_role_level"),
				)
				http.Error(w, "Insufficient role level", http.StatusForbidden)
				return
			}

			span.SetAttributes(
				attribute.String("user.id", user.ID.String()),
				attribute.String("user.role", string(user.Role)),
				attribute.String("required.min_role", string(minRole)),
				attribute.Bool("access.granted", true),
			)

			// Continue with the request
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserFromContext extracts user from request context
func GetUserFromContext(r *http.Request) (*domain.User, error) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok {
		return nil, domain.ErrUserNotFound
	}
	return user, nil
}

// GetUserIDFromContext extracts user ID from request context
func GetUserIDFromContext(r *http.Request) (string, error) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		return "", domain.ErrUserNotFound
	}
	return userID, nil
}

// Helper functions

// roleSliceToStringSlice converts UserRole slice to string slice
func roleSliceToStringSlice(roles []domain.UserRole) []string {
	result := make([]string, len(roles))
	for i, role := range roles {
		result[i] = string(role)
	}
	return result
}

// hasMinimumRole checks if user role meets minimum requirement
func hasMinimumRole(userRole, minRole domain.UserRole) bool {
	roleHierarchy := map[domain.UserRole]int{
		domain.RoleUser:       1,
		domain.RoleCreator:    2,
		domain.RoleClient:     2,
		domain.RoleEmployee:   3,
		domain.RoleManager:    4,
		domain.RoleAdmin:      5,
		domain.RoleSuperAdmin: 6,
	}

	userLevel, userExists := roleHierarchy[userRole]
	minLevel, minExists := roleHierarchy[minRole]

	if !userExists || !minExists {
		return false
	}

	return userLevel >= minLevel
}

// OptionalAuth middleware that extracts user if token is present but doesn't require it
func OptionalAuth(authService domain.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := authTracer.Start(r.Context(), "middleware.OptionalAuth")
			defer span.End()

			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && parts[0] == "Bearer" && parts[1] != "" {
					// Try to validate token
					user, err := authService.ValidateToken(ctx, parts[1])
					if err == nil {
						// Add user to context if token is valid
						ctx = context.WithValue(ctx, "user", user)
						ctx = context.WithValue(ctx, "user_id", user.ID.String())

						span.SetAttributes(
							attribute.String("user.id", user.ID.String()),
							attribute.String("user.email", user.Email),
							attribute.String("user.role", string(user.Role)),
							attribute.Bool("authenticated", true),
						)
					} else {
						span.SetAttributes(attribute.Bool("authenticated", false))
					}
				}
			} else {
				span.SetAttributes(attribute.Bool("authenticated", false))
			}

			// Continue with the request regardless of authentication status
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminOnly is a convenience middleware for admin-only endpoints
func AdminOnly() func(http.Handler) http.Handler {
	return RequireRole(domain.RoleAdmin, domain.RoleSuperAdmin)
}

// ManagerOrAbove is a convenience middleware for manager+ endpoints
func ManagerOrAbove() func(http.Handler) http.Handler {
	return RequireMinRole(domain.RoleManager)
}

// EmployeeOrAbove is a convenience middleware for employee+ endpoints
func EmployeeOrAbove() func(http.Handler) http.Handler {
	return RequireMinRole(domain.RoleEmployee)
}

// Gin compatibility functions for existing handlers

// GetUserFromGinContext extracts user from gin context (for backward compatibility)
func GetUserFromGinContext(c *gin.Context) (*domain.User, error) {
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

// GetUserIDFromGinContext extracts user ID from gin context (for backward compatibility)
func GetUserIDFromGinContext(c *gin.Context) (uuid.UUID, error) {
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
