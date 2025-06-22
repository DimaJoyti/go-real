package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"goreal-backend/internal/domain"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var taskChiTracer = otel.Tracer("goreal-backend/handlers/task")

// TaskChiHandler handles task-related HTTP requests using Chi router
type TaskChiHandler struct {
	taskService domain.TaskService
}

// NewTaskChiHandler creates a new task handler
func NewTaskChiHandler(taskService domain.TaskService) *TaskChiHandler {
	return &TaskChiHandler{
		taskService: taskService,
	}
}

// Routes registers task routes
func (h *TaskChiHandler) Routes(r chi.Router) {
	r.Get("/", h.ListTasks)
	r.Post("/", h.CreateTask)
	r.Get("/{id}", h.GetTask)
	r.Put("/{id}", h.UpdateTask)
	r.Delete("/{id}", h.DeleteTask)
	r.Post("/{id}/complete", h.CompleteTask)
	r.Get("/assigned/{userID}", h.GetTasksByUser)
	r.Get("/overdue", h.GetOverdueTasks)
	r.Post("/bulk-assign", h.BulkAssignTasks)
}

// CreateTask creates a new task
func (h *TaskChiHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.CreateTask")
	defer span.End()

	var req domain.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	task, err := h.taskService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("task.id", task.ID.String()),
		attribute.String("task.title", task.Title),
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task created successfully",
		"data":    task,
	})
}

// GetTask retrieves a task by ID
func (h *TaskChiHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.GetTask")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	task, err := h.taskService.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	span.SetAttributes(attribute.String("task.id", id.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": task,
	})
}

// UpdateTask updates an existing task
func (h *TaskChiHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.UpdateTask")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var req domain.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	task, err := h.taskService.Update(ctx, id, &req)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(attribute.String("task.id", id.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task updated successfully",
		"data":    task,
	})
}

// DeleteTask deletes a task
func (h *TaskChiHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.DeleteTask")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	if err := h.taskService.Delete(ctx, id); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(attribute.String("task.id", id.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task deleted successfully",
	})
}

// ListTasks lists tasks with filtering and pagination
func (h *TaskChiHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.ListTasks")
	defer span.End()

	// Parse query parameters
	filters := domain.TaskFilters{}

	if status := r.URL.Query().Get("status"); status != "" {
		taskStatus := domain.TaskStatus(status)
		filters.Status = &taskStatus
	}

	if priority := r.URL.Query().Get("priority"); priority != "" {
		taskPriority := domain.TaskPriority(priority)
		filters.Priority = &taskPriority
	}

	if assignedTo := r.URL.Query().Get("assigned_to"); assignedTo != "" {
		if id, err := uuid.Parse(assignedTo); err == nil {
			filters.AssignedTo = &id
		}
	}

	if assignedBy := r.URL.Query().Get("assigned_by"); assignedBy != "" {
		if id, err := uuid.Parse(assignedBy); err == nil {
			filters.AssignedBy = &id
		}
	}

	if search := r.URL.Query().Get("search"); search != "" {
		filters.Search = &search
	}

	// Parse pagination
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filters.Limit = limit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filters.Offset = offset
		}
	}

	// Get tasks
	tasks, err := h.taskService.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(attribute.Int("tasks.count", len(tasks)))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": tasks,
		"pagination": map[string]interface{}{
			"count":  len(tasks),
			"limit":  filters.Limit,
			"offset": filters.Offset,
		},
	})
}

// CompleteTask marks a task as completed
func (h *TaskChiHandler) CompleteTask(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.CompleteTask")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	taskID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}

	// Notes are optional
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.taskService.CompleteTask(ctx, taskID, req.Notes); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("task.id", taskID.String()),
		attribute.Bool("task.completed", true),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Task completed successfully",
	})
}

// GetTasksByUser gets tasks assigned to a specific user
func (h *TaskChiHandler) GetTasksByUser(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.GetTasksByUser")
	defer span.End()

	userIDStr := chi.URLParam(r, "userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	tasks, err := h.taskService.GetByAssignedUser(ctx, userID)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(
		attribute.String("user.id", userID.String()),
		attribute.Int("tasks.count", len(tasks)),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": tasks,
	})
}

// GetOverdueTasks gets all overdue tasks
func (h *TaskChiHandler) GetOverdueTasks(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.GetOverdueTasks")
	defer span.End()

	tasks, err := h.taskService.GetOverdueTasks(ctx)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(attribute.Int("overdue_tasks.count", len(tasks)))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": tasks,
	})
}

// BulkAssignTasks assigns multiple tasks to a user
func (h *TaskChiHandler) BulkAssignTasks(w http.ResponseWriter, r *http.Request) {
	ctx, span := taskChiTracer.Start(r.Context(), "taskHandler.BulkAssignTasks")
	defer span.End()

	var req struct {
		TaskIDs []string `json:"task_ids"`
		UserID  string   `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Parse user ID
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Parse task IDs
	taskIDs := make([]uuid.UUID, len(req.TaskIDs))
	for i, idStr := range req.TaskIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			span.RecordError(err)
			http.Error(w, "Invalid task ID: "+idStr, http.StatusBadRequest)
			return
		}
		taskIDs[i] = id
	}

	if err := h.taskService.BulkAssign(ctx, taskIDs, userID); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("user.id", userID.String()),
		attribute.Int("tasks.count", len(taskIDs)),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Tasks assigned successfully",
	})
}
