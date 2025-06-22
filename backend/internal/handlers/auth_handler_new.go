package handlers

import (
	"net/http"

	"goreal-backend/internal/domain"
	"goreal-backend/internal/middleware"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var authTracer = otel.Tracer("goreal-backend/handlers/auth")

// AuthHandlerNew handles authentication-related HTTP requests using Gin
type AuthHandlerNew struct {
	authService domain.AuthService
}

// NewAuthHandlerNew creates a new auth handler
func NewAuthHandlerNew(authService domain.AuthService) *AuthHandlerNew {
	return &AuthHandlerNew{
		authService: authService,
	}
}

// RegisterRoutes registers authentication routes
func (h *AuthHandlerNew) RegisterRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		auth.POST("/login", h.Login)
		auth.POST("/register", h.Register)
		auth.POST("/refresh", h.RefreshToken)
		auth.POST("/logout", h.Logout)
		auth.POST("/change-password", h.ChangePassword)
		auth.POST("/reset-password", h.ResetPassword)
		auth.POST("/confirm-reset", h.ConfirmPasswordReset)
	}
}

// Login handles user login
func (h *AuthHandlerNew) Login(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.Login")
	defer span.End()

	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Authenticate user
	authResponse, err := h.authService.Login(ctx, req.Email, req.Password)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication failed",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", authResponse.User.ID.String()),
		attribute.String("user.email", authResponse.User.Email),
		attribute.String("user.role", string(authResponse.User.Role)),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"data": authResponse,
	})
}

// Register handles user registration
func (h *AuthHandlerNew) Register(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.Register")
	defer span.End()

	var req domain.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Register user
	authResponse, err := h.authService.Register(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Registration failed",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", authResponse.User.ID.String()),
		attribute.String("user.email", authResponse.User.Email),
		attribute.String("user.role", string(authResponse.User.Role)),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful",
		"data": authResponse,
	})
}

// RefreshToken handles token refresh
func (h *AuthHandlerNew) RefreshToken(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.RefreshToken")
	defer span.End()

	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Refresh token
	authResponse, err := h.authService.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Token refresh failed",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", authResponse.User.ID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"data": authResponse,
	})
}

// Logout handles user logout
func (h *AuthHandlerNew) Logout(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.Logout")
	defer span.End()

	// Get user from context (set by auth middleware)
	user, err := middleware.GetUserFromGinContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Logout user
	if err := h.authService.Logout(ctx, user.ID); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Logout failed",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}

// ChangePassword handles password change
func (h *AuthHandlerNew) ChangePassword(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.ChangePassword")
	defer span.End()

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get user from context
	user, err := middleware.GetUserFromGinContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Change password
	if err := h.authService.ChangePassword(ctx, user.ID, req.OldPassword, req.NewPassword); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password change failed",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
}

// ResetPassword handles password reset request
func (h *AuthHandlerNew) ResetPassword(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.ResetPassword")
	defer span.End()

	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Request password reset
	if err := h.authService.ResetPassword(ctx, req.Email); err != nil {
		span.RecordError(err)
		// Don't reveal if email exists for security
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists, a password reset link has been sent",
		})
		return
	}

	span.SetAttributes(
		attribute.String("email", req.Email),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "If the email exists, a password reset link has been sent",
	})
}

// ConfirmPasswordReset handles password reset confirmation
func (h *AuthHandlerNew) ConfirmPasswordReset(c *gin.Context) {
	ctx, span := authTracer.Start(c.Request.Context(), "authHandler.ConfirmPasswordReset")
	defer span.End()

	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Confirm password reset
	if err := h.authService.ConfirmPasswordReset(ctx, req.Token, req.NewPassword); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Password reset failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successful",
	})
}
