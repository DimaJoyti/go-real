package handlers

import (
	"encoding/json"
	"net/http"

	"goreal-backend/internal/services"

	"github.com/go-chi/chi/v5"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userService services.UserService
}

func NewUserHandler(userService services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) Routes(r chi.Router) {
	r.Get("/{id}", h.GetUser)
	r.Put("/{id}", h.UpdateUser)
	r.Delete("/{id}", h.DeleteUser)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := h.userService.GetByID(id)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	user, err := h.userService.Update(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	if err := h.userService.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

// ChallengeHandler handles challenge-related HTTP requests
type ChallengeHandler struct {
	challengeService services.ChallengeService
}

func NewChallengeHandler(challengeService services.ChallengeService) *ChallengeHandler {
	return &ChallengeHandler{challengeService: challengeService}
}

func (h *ChallengeHandler) Routes(r chi.Router) {
	r.Get("/", h.ListChallenges)
	r.Post("/", h.CreateChallenge)
	r.Get("/{id}", h.GetChallenge)
	r.Put("/{id}", h.UpdateChallenge)
	r.Delete("/{id}", h.DeleteChallenge)
	r.Post("/{id}/join", h.JoinChallenge)
	r.Post("/{id}/submit", h.SubmitChallenge)
}

func (h *ChallengeHandler) ListChallenges(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters for filters
	filters := &services.ChallengeFilters{
		Limit:  10,
		Offset: 0,
	}
	
	challenges, err := h.challengeService.List(filters)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(challenges)
}

func (h *ChallengeHandler) CreateChallenge(w http.ResponseWriter, r *http.Request) {
	var req services.CreateChallengeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	challenge, err := h.challengeService.Create(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(challenge)
}

func (h *ChallengeHandler) GetChallenge(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	challenge, err := h.challengeService.GetByID(id)
	if err != nil {
		http.Error(w, "Challenge not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(challenge)
}

func (h *ChallengeHandler) UpdateChallenge(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdateChallengeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	challenge, err := h.challengeService.Update(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(challenge)
}

func (h *ChallengeHandler) DeleteChallenge(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	if err := h.challengeService.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

func (h *ChallengeHandler) JoinChallenge(w http.ResponseWriter, r *http.Request) {
	challengeID := chi.URLParam(r, "id")
	userID := "current-user-id" // TODO: Extract from JWT token
	
	if err := h.challengeService.Join(challengeID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Successfully joined challenge",
	})
}

func (h *ChallengeHandler) SubmitChallenge(w http.ResponseWriter, r *http.Request) {
	challengeID := chi.URLParam(r, "id")
	userID := "current-user-id" // TODO: Extract from JWT token
	
	var req services.SubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	if err := h.challengeService.Submit(challengeID, userID, &req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Submission successful",
	})
}

// FilmHandler handles film-related HTTP requests
type FilmHandler struct {
	filmService services.FilmService
}

func NewFilmHandler(filmService services.FilmService) *FilmHandler {
	return &FilmHandler{filmService: filmService}
}

func (h *FilmHandler) Routes(r chi.Router) {
	r.Get("/", h.ListFilms)
	r.Post("/", h.CreateFilm)
	r.Get("/{id}", h.GetFilm)
	r.Put("/{id}", h.UpdateFilm)
	r.Delete("/{id}", h.DeleteFilm)
	r.Post("/{id}/view", h.IncrementViews)
}

func (h *FilmHandler) ListFilms(w http.ResponseWriter, r *http.Request) {
	films, err := h.filmService.List(&services.FilmFilters{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(films)
}

func (h *FilmHandler) CreateFilm(w http.ResponseWriter, r *http.Request) {
	var req services.CreateFilmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	film, err := h.filmService.Create(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(film)
}

func (h *FilmHandler) GetFilm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	film, err := h.filmService.GetByID(id)
	if err != nil {
		http.Error(w, "Film not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(film)
}

func (h *FilmHandler) UpdateFilm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdateFilmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	film, err := h.filmService.Update(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(film)
}

func (h *FilmHandler) DeleteFilm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	if err := h.filmService.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

func (h *FilmHandler) IncrementViews(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	if err := h.filmService.IncrementViews(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "View count incremented",
	})
}

// PropertyHandler handles property-related HTTP requests
type PropertyHandler struct {
	propertyService services.PropertyService
}

func NewPropertyHandler(propertyService services.PropertyService) *PropertyHandler {
	return &PropertyHandler{propertyService: propertyService}
}

func (h *PropertyHandler) Routes(r chi.Router) {
	r.Get("/", h.ListProperties)
	r.Post("/", h.CreateProperty)
	r.Get("/{id}", h.GetProperty)
	r.Put("/{id}", h.UpdateProperty)
	r.Delete("/{id}", h.DeleteProperty)
	r.Post("/{id}/tokenize", h.TokenizeProperty)
}

func (h *PropertyHandler) ListProperties(w http.ResponseWriter, r *http.Request) {
	properties, err := h.propertyService.List(&services.PropertyFilters{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(properties)
}

func (h *PropertyHandler) CreateProperty(w http.ResponseWriter, r *http.Request) {
	var req services.CreatePropertyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	property, err := h.propertyService.Create(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(property)
}

func (h *PropertyHandler) GetProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	property, err := h.propertyService.GetByID(id)
	if err != nil {
		http.Error(w, "Property not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(property)
}

func (h *PropertyHandler) UpdateProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdatePropertyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	property, err := h.propertyService.Update(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(property)
}

func (h *PropertyHandler) DeleteProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	if err := h.propertyService.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

func (h *PropertyHandler) TokenizeProperty(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.TokenizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	response, err := h.propertyService.Tokenize(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CRMHandler handles CRM-related HTTP requests
type CRMHandler struct {
	crmService services.CRMService
}

func NewCRMHandler(crmService services.CRMService) *CRMHandler {
	return &CRMHandler{crmService: crmService}
}

func (h *CRMHandler) Routes(r chi.Router) {
	// Lead routes
	r.Route("/leads", func(r chi.Router) {
		r.Get("/", h.ListLeads)
		r.Post("/", h.CreateLead)
		r.Get("/{id}", h.GetLead)
		r.Put("/{id}", h.UpdateLead)
	})
	
	// Task routes
	r.Route("/tasks", func(r chi.Router) {
		r.Get("/", h.ListTasks)
		r.Post("/", h.CreateTask)
		r.Get("/{id}", h.GetTask)
		r.Put("/{id}", h.UpdateTask)
	})
	
	// Sale routes
	r.Route("/sales", func(r chi.Router) {
		r.Get("/", h.ListSales)
		r.Post("/", h.CreateSale)
		r.Get("/{id}", h.GetSale)
		r.Put("/{id}", h.UpdateSale)
	})
}

// Lead handlers
func (h *CRMHandler) ListLeads(w http.ResponseWriter, r *http.Request) {
	leads, err := h.crmService.ListLeads(&services.LeadFilters{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(leads)
}

func (h *CRMHandler) CreateLead(w http.ResponseWriter, r *http.Request) {
	var req services.CreateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	lead, err := h.crmService.CreateLead(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(lead)
}

func (h *CRMHandler) GetLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	lead, err := h.crmService.GetLead(id)
	if err != nil {
		http.Error(w, "Lead not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lead)
}

func (h *CRMHandler) UpdateLead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	lead, err := h.crmService.UpdateLead(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lead)
}

// Task handlers
func (h *CRMHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.crmService.ListTasks(&services.TaskFilters{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func (h *CRMHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	var req services.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	task, err := h.crmService.CreateTask(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func (h *CRMHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	task, err := h.crmService.GetTask(id)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func (h *CRMHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	task, err := h.crmService.UpdateTask(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

// Sale handlers
func (h *CRMHandler) ListSales(w http.ResponseWriter, r *http.Request) {
	sales, err := h.crmService.ListSales(&services.SaleFilters{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

func (h *CRMHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	var req services.CreateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	sale, err := h.crmService.CreateSale(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sale)
}

func (h *CRMHandler) GetSale(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	sale, err := h.crmService.GetSale(id)
	if err != nil {
		http.Error(w, "Sale not found", http.StatusNotFound)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sale)
}

func (h *CRMHandler) UpdateSale(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	
	var req services.UpdateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	sale, err := h.crmService.UpdateSale(id, &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sale)
}
