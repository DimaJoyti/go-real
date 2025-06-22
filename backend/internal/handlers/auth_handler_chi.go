package handlers

import (
	"encoding/json"
	"net/http"

	"goreal-backend/internal/domain"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

// parseUUID is a helper function to parse UUID strings
func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

var authChiTracer = otel.Tracer("goreal-backend/handlers/auth")

// AuthChiHandler handles authentication-related HTTP requests using Chi router
type AuthChiHandler struct {
	authService domain.AuthService
}

// NewAuthChiHandler creates a new auth handler
func NewAuthChiHandler(authService domain.AuthService) *AuthChiHandler {
	return &AuthChiHandler{
		authService: authService,
	}
}

// Routes registers auth routes
func (h *AuthChiHandler) Routes(r chi.Router) {
	r.Post("/login", h.Login)
	r.Post("/register", h.Register)
	r.Post("/refresh", h.RefreshToken)
	r.Post("/logout", h.Logout)
	r.Post("/change-password", h.ChangePassword)
	r.Post("/reset-password", h.ResetPassword)
	r.Post("/confirm-reset", h.ConfirmPasswordReset)
}

// Login authenticates a user
func (h *AuthChiHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.Login")
	defer span.End()

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	authResponse, err := h.authService.Login(ctx, req.Email, req.Password)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	span.SetAttributes(
		attribute.String("user.email", req.Email),
		attribute.String("user.id", authResponse.User.ID.String()),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"data":    authResponse,
	})
}

// Register creates a new user account
func (h *AuthChiHandler) Register(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.Register")
	defer span.End()

	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	authResponse, err := h.authService.Register(ctx, &req)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("user.email", req.Email),
		attribute.String("user.id", authResponse.User.ID.String()),
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Registration successful",
		"data":    authResponse,
	})
}

// RefreshToken refreshes an access token
func (h *AuthChiHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.RefreshToken")
	defer span.End()

	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	if req.RefreshToken == "" {
		http.Error(w, "Refresh token is required", http.StatusBadRequest)
		return
	}

	authResponse, err := h.authService.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Token refreshed successfully",
		"data":    authResponse,
	})
}

// Logout logs out a user
func (h *AuthChiHandler) Logout(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.Logout")
	defer span.End()

	// Extract user ID from context (set by auth middleware)
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	// Parse user ID
	uid, err := parseUUID(userID)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.authService.Logout(ctx, uid); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(attribute.String("user.id", userID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Logout successful",
	})
}

// ChangePassword changes user password
func (h *AuthChiHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.ChangePassword")
	defer span.End()

	// Extract user ID from context (set by auth middleware)
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		http.Error(w, "Old password and new password are required", http.StatusBadRequest)
		return
	}

	// Parse user ID
	uid, err := parseUUID(userID)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.authService.ChangePassword(ctx, uid, req.OldPassword, req.NewPassword); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(attribute.String("user.id", userID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Password changed successfully",
	})
}

// ResetPassword initiates password reset
func (h *AuthChiHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.ResetPassword")
	defer span.End()

	var req struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	if err := h.authService.ResetPassword(ctx, req.Email); err != nil {
		span.RecordError(err)
		// Don't reveal if email exists or not for security
		// Always return success message
	}

	span.SetAttributes(attribute.String("email", req.Email))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "If the email exists, a password reset link has been sent",
	})
}

// ConfirmPasswordReset confirms password reset with token
func (h *AuthChiHandler) ConfirmPasswordReset(w http.ResponseWriter, r *http.Request) {
	ctx, span := authChiTracer.Start(r.Context(), "authHandler.ConfirmPasswordReset")
	defer span.End()

	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	if req.Token == "" || req.NewPassword == "" {
		http.Error(w, "Token and new password are required", http.StatusBadRequest)
		return
	}

	if err := h.authService.ConfirmPasswordReset(ctx, req.Token, req.NewPassword); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid or expired token", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Password reset successful",
	})
}
