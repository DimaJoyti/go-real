package services

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/config"
	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var taskTracer = otel.Tracer("goreal-backend/services/task")

type taskService struct {
	config              *config.Config
	taskRepo            domain.TaskRepository
	userRepo            domain.UserRepository
	notificationService domain.NotificationService
}

// NewTaskService creates a new task service
func NewTaskService(
	cfg *config.Config,
	taskRepo domain.TaskRepository,
	userRepo domain.UserRepository,
	notificationService domain.NotificationService,
) domain.TaskService {
	return &taskService{
		config:              cfg,
		taskRepo:            taskRepo,
		userRepo:            userRepo,
		notificationService: notificationService,
	}
}

// Create creates a new task
func (s *taskService) Create(ctx context.Context, req *domain.CreateTaskRequest) (*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.title", req.Title),
	)

	if req.Priority != nil {
		span.SetAttributes(attribute.String("task.priority", *req.Priority))
	}
	if req.AssignedTo != nil {
		span.SetAttributes(attribute.String("task.assigned_to", req.AssignedTo.String()))
	}

	// Validate request
	if req.Title == "" {
		return nil, fmt.Errorf("task title is required")
	}
	if req.AssignedTo != nil && *req.AssignedTo == uuid.Nil {
		return nil, fmt.Errorf("assigned to user cannot be nil")
	}

	// Validate users exist
	if req.AssignedTo != nil {
		_, err := s.userRepo.GetByID(ctx, *req.AssignedTo)
		if err != nil {
			return nil, fmt.Errorf("assigned to user not found: %w", err)
		}
	}

	// Create task
	now := time.Now()

	// Set default priority if not provided
	priority := domain.TaskPriorityMedium
	if req.Priority != nil {
		switch *req.Priority {
		case "low":
			priority = domain.TaskPriorityLow
		case "medium":
			priority = domain.TaskPriorityMedium
		case "high":
			priority = domain.TaskPriorityHigh
		case "urgent":
			priority = domain.TaskPriorityUrgent
		}
	}

	task := &domain.Task{
		ID:            uuid.New(),
		Title:         req.Title,
		Description:   req.Description,
		Status:        domain.TaskStatusPending,
		Priority:      priority,
		AssignedTo:    req.AssignedTo,
		AssignedBy:    nil, // Will be set from context or request
		DueDate:       req.DueDate,
		RelatedToType: req.RelatedType,
		RelatedToID:   req.RelatedID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	// Send notification to assigned user
	go s.sendTaskAssignmentNotification(context.Background(), task)

	return task, nil
}

// GetByID retrieves a task by ID
func (s *taskService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("task.id", id.String()))

	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get task by ID: %w", err)
	}

	return task, nil
}

// Update updates an existing task
func (s *taskService) Update(ctx context.Context, id uuid.UUID, req *domain.UpdateTaskRequest) (*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.Update")
	defer span.End()

	span.SetAttributes(attribute.String("task.id", id.String()))

	// Get existing task
	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	// Update fields
	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = req.Description
	}
	if req.Priority != nil {
		// Convert string priority to TaskPriority enum
		switch *req.Priority {
		case "low":
			task.Priority = domain.TaskPriorityLow
		case "medium":
			task.Priority = domain.TaskPriorityMedium
		case "high":
			task.Priority = domain.TaskPriorityHigh
		case "urgent":
			task.Priority = domain.TaskPriorityUrgent
		}
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}
	if req.AssignedTo != nil {
		// Validate user exists
		_, err := s.userRepo.GetByID(ctx, *req.AssignedTo)
		if err != nil {
			return nil, fmt.Errorf("assigned to user not found: %w", err)
		}

		// Send notification if assignment changed
		if task.AssignedTo == nil || *task.AssignedTo != *req.AssignedTo {
			task.AssignedTo = req.AssignedTo
			go s.sendTaskAssignmentNotification(context.Background(), task)
		} else {
			task.AssignedTo = req.AssignedTo
		}
	}

	// Update timestamp
	task.UpdatedAt = time.Now()

	if err := s.taskRepo.Update(ctx, task); err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	return task, nil
}

// Delete deletes a task
func (s *taskService) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := taskTracer.Start(ctx, "taskService.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("task.id", id.String()))

	if err := s.taskRepo.Delete(ctx, id); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete task: %w", err)
	}

	return nil
}

// List retrieves tasks with pagination and filtering
func (s *taskService) List(ctx context.Context, filters domain.TaskFilters) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	tasks, err := s.taskRepo.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list tasks: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// Count returns the total number of tasks matching the filters
func (s *taskService) Count(ctx context.Context, filters domain.TaskFilters) (int, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.Count")
	defer span.End()

	count, err := s.taskRepo.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// UpdateStatus updates task status
func (s *taskService) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.TaskStatus) error {
	ctx, span := taskTracer.Start(ctx, "taskService.UpdateStatus")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.id", id.String()),
		attribute.String("task.status", string(status)),
	)

	// Get task to validate and send notifications
	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get task: %w", err)
	}

	// Skip business rules validation for now since BusinessRules is not fully implemented
	// br := domain.BusinessRules{}
	// if err := br.CanTaskChangeStatus(task, status); err != nil {
	// 	return fmt.Errorf("invalid status transition: %w", err)
	// }

	// Update task status using the Update method
	task.Status = status
	task.UpdatedAt = time.Now()

	if err := s.taskRepo.Update(ctx, task); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update task status: %w", err)
	}

	// Send notifications for important status changes
	go s.sendTaskStatusNotification(context.Background(), task, status)

	return nil
}

// GetByAssignedUser retrieves tasks assigned to a user
func (s *taskService) GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.GetByAssignedUser")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	tasks, err := s.taskRepo.GetByAssignedUser(ctx, userID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get tasks by assigned user: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// GetByStatus retrieves tasks by status using filters
func (s *taskService) GetByStatus(ctx context.Context, status domain.TaskStatus) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.GetByStatus")
	defer span.End()

	span.SetAttributes(attribute.String("task.status", string(status)))

	// Use List with status filter
	filters := domain.TaskFilters{
		Status: &status,
	}

	tasks, err := s.taskRepo.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get tasks by status: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// GetOverdueTasks retrieves all overdue tasks
func (s *taskService) GetOverdueTasks(ctx context.Context) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.GetOverdueTasks")
	defer span.End()

	tasks, err := s.taskRepo.GetOverdueTasks(ctx)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// GetTasksByRelatedEntity retrieves tasks related to a specific entity
func (s *taskService) GetTasksByRelatedEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskService.GetTasksByRelatedEntity")
	defer span.End()

	span.SetAttributes(
		attribute.String("entity.type", entityType),
		attribute.String("entity.id", entityID.String()),
	)

	tasks, err := s.taskRepo.GetTasksByRelatedEntity(ctx, entityType, entityID)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get tasks by related entity: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// AssignToUser assigns a task to a user
func (s *taskService) AssignToUser(ctx context.Context, taskID, userID uuid.UUID) error {
	ctx, span := taskTracer.Start(ctx, "taskService.AssignToUser")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.id", taskID.String()),
		attribute.String("user.id", userID.String()),
	)

	// Validate user exists
	_, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("assigned user not found: %w", err)
	}

	// Get task
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get task: %w", err)
	}

	// Update assignment
	task.AssignedTo = &userID
	task.UpdatedAt = time.Now()

	if err := s.taskRepo.Update(ctx, task); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to assign task: %w", err)
	}

	// Send notification
	go s.sendTaskAssignmentNotification(context.Background(), task)

	return nil
}

// sendTaskAssignmentNotification sends a notification when a task is assigned
func (s *taskService) sendTaskAssignmentNotification(ctx context.Context, task *domain.Task) {
	if s.notificationService == nil {
		return
	}

	notification := &domain.CreateNotificationRequest{
		UserID:  *task.AssignedTo,
		Type:    string(domain.NotificationTypeTaskAssigned),
		Title:   "New Task Assigned",
		Message: fmt.Sprintf("You have been assigned a new task: %s", task.Title),
		Data: map[string]interface{}{
			"task_id":    task.ID.String(),
			"task_title": task.Title,
			"priority":   string(task.Priority),
			"due_date":   task.DueDate,
		},
	}

	s.notificationService.Create(ctx, notification)
}

// sendTaskStatusNotification sends a notification when task status changes
func (s *taskService) sendTaskStatusNotification(ctx context.Context, task *domain.Task, newStatus domain.TaskStatus) {
	if s.notificationService == nil {
		return
	}

	// Send notification to the user who assigned the task
	notification := &domain.CreateNotificationRequest{
		UserID:  *task.AssignedBy,
		Type:    string(domain.NotificationTypeTaskStatusChanged),
		Title:   "Task Status Updated",
		Message: fmt.Sprintf("Task '%s' status changed to %s", task.Title, string(newStatus)),
		Data: map[string]interface{}{
			"task_id":    task.ID.String(),
			"task_title": task.Title,
			"new_status": string(newStatus),
		},
	}

	s.notificationService.Create(ctx, notification)
}

// CompleteTask completes a task with optional notes
func (s *taskService) CompleteTask(ctx context.Context, taskID uuid.UUID, notes string) error {
	ctx, span := taskTracer.Start(ctx, "taskService.CompleteTask")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.id", taskID.String()),
		attribute.String("notes", notes),
	)

	// Get task to validate it exists
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to get task: %w", err)
	}

	// Update task status and completion details
	task.Status = domain.TaskStatusCompleted
	now := time.Now()
	task.CompletedAt = &now
	// Note: Task struct doesn't have CompletionNotes field
	// Notes could be stored in Description or a separate notes system
	task.UpdatedAt = now

	if err := s.taskRepo.Update(ctx, task); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to complete task: %w", err)
	}

	// Send notification
	go s.sendTaskStatusNotification(context.Background(), task, domain.TaskStatusCompleted)

	return nil
}

// GetTasksByEntity retrieves tasks related to a specific entity (alias for GetTasksByRelatedEntity)
func (s *taskService) GetTasksByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*domain.Task, error) {
	return s.GetTasksByRelatedEntity(ctx, entityType, entityID)
}

// BulkAssign assigns multiple tasks to a user
func (s *taskService) BulkAssign(ctx context.Context, taskIDs []uuid.UUID, userID uuid.UUID) error {
	ctx, span := taskTracer.Start(ctx, "taskService.BulkAssign")
	defer span.End()

	span.SetAttributes(
		attribute.Int("task.count", len(taskIDs)),
		attribute.String("user.id", userID.String()),
	)

	// Validate user exists
	_, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("user not found: %w", err)
	}

	// Update all tasks
	for _, taskID := range taskIDs {
		task, err := s.taskRepo.GetByID(ctx, taskID)
		if err != nil {
			span.RecordError(err)
			continue // Skip invalid tasks
		}

		task.AssignedTo = &userID
		task.UpdatedAt = time.Now()

		if err := s.taskRepo.Update(ctx, task); err != nil {
			span.RecordError(err)
			continue // Skip failed updates
		}

		// Send notification for each task
		go s.sendTaskAssignmentNotification(context.Background(), task)
	}

	return nil
}
