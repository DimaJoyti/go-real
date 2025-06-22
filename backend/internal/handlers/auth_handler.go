package handlers

import (
	"encoding/json"
	"net/http"

	"goreal-backend/internal/domain"

	"github.com/go-chi/chi/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var handlerTracer = otel.Tracer("goreal-backend/handlers")

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService domain.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService domain.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Routes registers authentication routes with Chi router
func (h *AuthHandler) Routes(r chi.Router) {
	r.Post("/login", h.Login)
	r.Post("/register", h.Register)
	r.Post("/refresh", h.RefreshToken)
	r.Post("/logout", h.Logout)
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RefreshTokenRequest represents the refresh token request payload
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx, span := handlerTracer.Start(r.Context(), "authHandler.Login")
	defer span.End()

	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Authenticate user
	authResponse, err := h.authService.Login(ctx, req.Email, req.Password)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	span.SetAttributes(
		attribute.String("user.id", authResponse.User.ID.String()),
		attribute.String("user.email", authResponse.User.Email),
		attribute.String("user.role", string(authResponse.User.Role)),
	)

	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"data":    authResponse,
	})
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	ctx, span := handlerTracer.Start(r.Context(), "authHandler.Register")
	defer span.End()

	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" || req.Username == "" {
		http.Error(w, "Email, password, and username are required", http.StatusBadRequest)
		return
	}

	// Register user
	authResponse, err := h.authService.Register(ctx, &req)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("user.id", authResponse.User.ID.String()),
		attribute.String("user.email", authResponse.User.Email),
		attribute.String("user.role", string(authResponse.User.Role)),
	)

	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Registration successful",
		"data":    authResponse,
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	ctx, span := handlerTracer.Start(r.Context(), "authHandler.RefreshToken")
	defer span.End()

	var req domain.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.RefreshToken == "" {
		http.Error(w, "Refresh token is required", http.StatusBadRequest)
		return
	}

	// Refresh token
	authResponse, err := h.authService.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	span.SetAttributes(
		attribute.String("user.id", authResponse.User.ID.String()),
	)

	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Token refreshed successfully",
		"data":    authResponse,
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	_, span := handlerTracer.Start(r.Context(), "authHandler.Logout")
	defer span.End()

	// TODO: Implement proper logout with token invalidation
	// For now, just return success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logged out successfully",
	})
}
