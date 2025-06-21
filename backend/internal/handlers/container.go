package handlers

import (
	"goreal-backend/internal/services"
)

// Container holds all HTTP handlers
type Container struct {
	AuthHandler      *AuthHandler
	UserHandler      *UserHandler
	ChallengeHandler *ChallengeHandler
	FilmHandler      *FilmHandler
	PropertyHandler  *PropertyHandler
	CRMHandler       *CRMHandler
}

// NewContainer creates a new handler container
func NewContainer(services *services.Container) *Container {
	return &Container{
		AuthHandler:      NewAuthHandler(services.AuthService),
		UserHandler:      NewUserHandler(services.UserService),
		ChallengeHandler: NewChallengeHandler(services.ChallengeService),
		FilmHandler:      NewFilmHandler(services.FilmService),
		PropertyHandler:  NewPropertyHandler(services.PropertyService),
		CRMHandler:       NewCRMHandler(services.CRMService),
	}
}
