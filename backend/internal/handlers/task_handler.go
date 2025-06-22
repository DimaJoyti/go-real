package handlers

import (
	"net/http"
	"strconv"

	"goreal-backend/internal/domain"
	"goreal-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var taskTracer = otel.Tracer("goreal-backend/handlers/task")

// TaskHandler handles task-related HTTP requests
type TaskHandler struct {
	taskService domain.TaskService
}

// NewTaskHandler creates a new task handler
func NewTaskHandler(taskService domain.TaskService) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
	}
}

// RegisterRoutes registers task routes
func (h *TaskHandler) RegisterRoutes(router *gin.RouterGroup) {
	tasks := router.Group("/tasks")
	{
		tasks.GET("", h.ListTasks)
		tasks.POST("", h.CreateTask)
		tasks.GET("/:id", h.GetTask)
		tasks.PUT("/:id", h.UpdateTask)
		tasks.DELETE("/:id", h.DeleteTask)
		tasks.POST("/:id/complete", h.CompleteTask)
		tasks.GET("/assigned/:user_id", h.GetTasksByUser)
		tasks.GET("/overdue", h.GetOverdueTasks)
		tasks.GET("/entity/:type/:id", h.GetTasksByEntity)
		tasks.POST("/bulk-assign", h.BulkAssignTasks)
	}
}

// CreateTask creates a new task
func (h *TaskHandler) CreateTask(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.CreateTask")
	defer span.End()

	var req domain.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get current user from context
	_, err := middleware.GetUserFromGinContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// AssignedBy field not available in CreateTaskRequest
	// Tasks are created by the current user by default

	task, err := h.taskService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create task",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("task.id", task.ID.String()),
		attribute.String("task.title", task.Title),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Task created successfully",
		"data": task,
	})
}

// GetTask retrieves a task by ID
func (h *TaskHandler) GetTask(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.GetTask")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	task, err := h.taskService.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Task not found",
		})
		return
	}

	span.SetAttributes(attribute.String("task.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"data": task,
	})
}

// UpdateTask updates an existing task
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.UpdateTask")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	var req domain.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	task, err := h.taskService.Update(ctx, id, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to update task",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("task.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"data": task,
	})
}

// DeleteTask deletes a task
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.DeleteTask")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	if err := h.taskService.Delete(ctx, id); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete task",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("task.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Task deleted successfully",
	})
}

// ListTasks lists tasks with filtering and pagination
func (h *TaskHandler) ListTasks(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.ListTasks")
	defer span.End()

	// Parse query parameters
	filters := domain.TaskFilters{}

	if assignedTo := c.Query("assigned_to"); assignedTo != "" {
		if id, err := uuid.Parse(assignedTo); err == nil {
			filters.AssignedTo = &id
		}
	}

	if assignedBy := c.Query("assigned_by"); assignedBy != "" {
		if id, err := uuid.Parse(assignedBy); err == nil {
			filters.AssignedBy = &id
		}
	}

	if status := c.Query("status"); status != "" {
		taskStatus := domain.TaskStatus(status)
		filters.Status = &taskStatus
	}

	if priority := c.Query("priority"); priority != "" {
		taskPriority := domain.TaskPriority(priority)
		filters.Priority = &taskPriority
	}

	if relatedType := c.Query("related_type"); relatedType != "" {
		filters.RelatedToType = &relatedType
	}

	if relatedID := c.Query("related_id"); relatedID != "" {
		if id, err := uuid.Parse(relatedID); err == nil {
			filters.RelatedToID = &id
		}
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	// Parse pagination
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filters.Limit = limit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filters.Offset = offset
		}
	}

	// Get tasks
	tasks, err := h.taskService.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve tasks",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.Int("tasks.count", len(tasks)))

	c.JSON(http.StatusOK, gin.H{
		"data": tasks,
		"pagination": gin.H{
			"count": len(tasks),
			"limit": filters.Limit,
			"offset": filters.Offset,
		},
	})
}

// CompleteTask marks a task as completed
func (h *TaskHandler) CompleteTask(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.CompleteTask")
	defer span.End()

	idStr := c.Param("id")
	taskID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid task ID",
		})
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if err := h.taskService.CompleteTask(ctx, taskID, req.Notes); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to complete task",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("task.id", taskID.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Task completed successfully",
	})
}

// GetTasksByUser gets tasks assigned to a specific user
func (h *TaskHandler) GetTasksByUser(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.GetTasksByUser")
	defer span.End()

	userIDStr := c.Param("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	tasks, err := h.taskService.GetByAssignedUser(ctx, userID)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve user tasks",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", userID.String()),
		attribute.Int("tasks.count", len(tasks)),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": tasks,
	})
}

// GetOverdueTasks gets all overdue tasks
func (h *TaskHandler) GetOverdueTasks(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.GetOverdueTasks")
	defer span.End()

	tasks, err := h.taskService.GetOverdueTasks(ctx)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve overdue tasks",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.Int("overdue_tasks.count", len(tasks)))

	c.JSON(http.StatusOK, gin.H{
		"data": tasks,
	})
}

// GetTasksByEntity gets tasks related to a specific entity
func (h *TaskHandler) GetTasksByEntity(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.GetTasksByEntity")
	defer span.End()

	entityType := c.Param("type")
	entityIDStr := c.Param("id")
	
	entityID, err := uuid.Parse(entityIDStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid entity ID",
		})
		return
	}

	tasks, err := h.taskService.GetTasksByEntity(ctx, entityType, entityID)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve entity tasks",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("entity.type", entityType),
		attribute.String("entity.id", entityID.String()),
		attribute.Int("tasks.count", len(tasks)),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": tasks,
	})
}

// BulkAssignTasks assigns multiple tasks to users
func (h *TaskHandler) BulkAssignTasks(c *gin.Context) {
	ctx, span := taskTracer.Start(c.Request.Context(), "taskHandler.BulkAssignTasks")
	defer span.End()

	var req struct {
		TaskIDs []uuid.UUID `json:"task_ids" binding:"required"`
		UserID  uuid.UUID   `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if err := h.taskService.BulkAssign(ctx, req.TaskIDs, req.UserID); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to bulk assign tasks",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.Int("tasks.assigned", len(req.TaskIDs)),
		attribute.String("user.id", req.UserID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Tasks assigned successfully",
		"assigned": len(req.TaskIDs),
	})
}
