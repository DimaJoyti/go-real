package domain

import "errors"

// Common domain errors
var (
	ErrInvalidInput     = errors.New("invalid input")
	ErrNotFound         = errors.New("not found")
	ErrAlreadyExists    = errors.New("already exists")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrForbidden        = errors.New("forbidden")
	ErrInternalError    = errors.New("internal error")
	ErrValidationFailed = errors.New("validation failed")
	ErrUserNotFound     = errors.New("user not found")
	ErrInvalidToken     = errors.New("invalid token")
	ErrTokenExpired     = errors.New("token expired")
)

// Authentication errors
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountLocked      = errors.New("account locked")
	ErrAccountInactive    = errors.New("account inactive")
	ErrPasswordTooWeak    = errors.New("password too weak")
	ErrEmailNotVerified   = errors.New("email not verified")
)

// Business logic errors
var (
	ErrClientNotVerified    = errors.New("client not verified")
	ErrInsufficientFunds    = errors.New("insufficient funds")
	ErrTaskAlreadyCompleted = errors.New("task already completed")
	ErrLeadAlreadyConverted = errors.New("lead already converted")
	ErrSaleAlreadyApproved  = errors.New("sale already approved")
	ErrInventoryNotAvailable = errors.New("inventory not available")
)

// Validation errors
var (
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrInvalidPhoneNumber = errors.New("invalid phone number format")
	ErrInvalidAmount      = errors.New("invalid amount")
	ErrInvalidDate        = errors.New("invalid date")
	ErrRequiredField      = errors.New("required field missing")
)
