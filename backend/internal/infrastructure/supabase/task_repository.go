package supabase

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var taskTracer = otel.Tracer("goreal-backend/infrastructure/supabase/task")

type taskRepository struct {
	client *Client
}

// NewTaskRepository creates a new task repository
func NewTaskRepository(client *Client) domain.TaskRepository {
	return &taskRepository{
		client: client,
	}
}

// Create creates a new task
func (r *taskRepository) Create(ctx context.Context, task *domain.Task) error {
	ctx, span := taskTracer.Start(ctx, "taskRepository.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.title", task.Title),
		attribute.String("task.id", task.ID.String()),
		attribute.String("task.status", string(task.Status)),
		attribute.String("task.priority", string(task.Priority)),
	)

	// Set timestamps
	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	// Execute insert query
	err := r.client.ExecuteQuery(ctx, "insert", "tasks", func() error {
		return r.client.From("tasks").Insert(task).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create task: %w", err)
	}

	return nil
}

// GetByID retrieves a task by ID
func (r *taskRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("task.id", id.String()))

	var task domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return r.client.From("tasks").
			Select("*, assigned_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*)").
			Eq("id", id).
			Single(ctx, &task)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get task by ID: %w", err)
	}

	return &task, nil
}

// Update updates an existing task
func (r *taskRepository) Update(ctx context.Context, task *domain.Task) error {
	ctx, span := taskTracer.Start(ctx, "taskRepository.Update")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.id", task.ID.String()),
		attribute.String("task.title", task.Title),
		attribute.String("task.status", string(task.Status)),
	)

	// Update timestamp
	task.UpdatedAt = time.Now()

	// Set completion time if status is completed
	if task.Status == domain.TaskStatusCompleted && task.CompletedAt == nil {
		now := time.Now()
		task.CompletedAt = &now
	}

	err := r.client.ExecuteQuery(ctx, "update", "tasks", func() error {
		return r.client.From("tasks").
			Update(task).
			Eq("id", task.ID).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update task: %w", err)
	}

	return nil
}

// Delete deletes a task by ID
func (r *taskRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := taskTracer.Start(ctx, "taskRepository.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("task.id", id.String()))

	err := r.client.ExecuteQuery(ctx, "delete", "tasks", func() error {
		return r.client.From("tasks").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete task: %w", err)
	}

	return nil
}

// List retrieves tasks with pagination and filtering
func (r *taskRepository) List(ctx context.Context, filters domain.TaskFilters) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	query := r.client.From("tasks").
		Select("*, assigned_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*)")

	// Apply filters
	if filters.AssignedTo != nil {
		query = query.Eq("assigned_to", *filters.AssignedTo)
		span.SetAttributes(attribute.String("filters.assigned_to", filters.AssignedTo.String()))
	}

	if filters.AssignedBy != nil {
		query = query.Eq("assigned_by", *filters.AssignedBy)
		span.SetAttributes(attribute.String("filters.assigned_by", filters.AssignedBy.String()))
	}

	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
		span.SetAttributes(attribute.String("filters.status", string(*filters.Status)))
	}

	if filters.Priority != nil {
		query = query.Eq("priority", string(*filters.Priority))
		span.SetAttributes(attribute.String("filters.priority", string(*filters.Priority)))
	}

	if filters.RelatedToType != nil {
		query = query.Eq("related_to_type", *filters.RelatedToType)
		span.SetAttributes(attribute.String("filters.related_to_type", *filters.RelatedToType))
	}

	if filters.RelatedToID != nil {
		query = query.Eq("related_to_id", *filters.RelatedToID)
		span.SetAttributes(attribute.String("filters.related_to_id", filters.RelatedToID.String()))
	}

	if filters.Search != nil {
		// Search in title or description
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("title.ilike.%s,description.ilike.%s",
			searchPattern, searchPattern))
		span.SetAttributes(attribute.String("filters.search", *filters.Search))
	}

	if filters.DueDateFrom != nil {
		query = query.Gte("due_date", filters.DueDateFrom.Format(time.RFC3339))
		span.SetAttributes(attribute.String("filters.due_date_from", filters.DueDateFrom.Format(time.RFC3339)))
	}

	if filters.DueDateTo != nil {
		query = query.Lte("due_date", filters.DueDateTo.Format(time.RFC3339))
		span.SetAttributes(attribute.String("filters.due_date_to", filters.DueDateTo.Format(time.RFC3339)))
	}

	// Apply sorting
	if filters.SortBy != "" {
		ascending := filters.SortOrder == "" || filters.SortOrder == "asc"
		query = query.Order(filters.SortBy, ascending)
		span.SetAttributes(
			attribute.String("filters.sort_by", filters.SortBy),
			attribute.Bool("filters.ascending", ascending),
		)
	}

	// Apply pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	var tasks []*domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return query.Execute(ctx, &tasks)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list tasks: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// Count returns the total number of tasks matching the filters
func (r *taskRepository) Count(ctx context.Context, filters domain.TaskFilters) (int, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.Count")
	defer span.End()

	query := r.client.From("tasks").Select("id")

	// Apply filters (same as List method)
	if filters.AssignedTo != nil {
		query = query.Eq("assigned_to", *filters.AssignedTo)
	}

	if filters.AssignedBy != nil {
		query = query.Eq("assigned_by", *filters.AssignedBy)
	}

	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
	}

	if filters.Priority != nil {
		query = query.Eq("priority", string(*filters.Priority))
	}

	if filters.RelatedToType != nil {
		query = query.Eq("related_to_type", *filters.RelatedToType)
	}

	if filters.RelatedToID != nil {
		query = query.Eq("related_to_id", *filters.RelatedToID)
	}

	if filters.Search != nil {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("title.ilike.%s,description.ilike.%s",
			searchPattern, searchPattern))
	}

	if filters.DueDateFrom != nil {
		query = query.Gte("due_date", filters.DueDateFrom.Format(time.RFC3339))
	}

	if filters.DueDateTo != nil {
		query = query.Lte("due_date", filters.DueDateTo.Format(time.RFC3339))
	}

	var tasks []*domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return query.Execute(ctx, &tasks)
	})

	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	count := len(tasks)
	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// GetByAssignedUser retrieves tasks assigned to a user
func (r *taskRepository) GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.GetByAssignedTo")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	var tasks []*domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return r.client.From("tasks").
			Select("*, assigned_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*)").
			Eq("assigned_to", userID).
			Execute(ctx, &tasks)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get tasks by assigned to: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// GetByStatus retrieves tasks by status
func (r *taskRepository) GetByStatus(ctx context.Context, status domain.TaskStatus) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.GetByStatus")
	defer span.End()

	span.SetAttributes(attribute.String("task.status", string(status)))

	var tasks []*domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return r.client.From("tasks").
			Select("*, assigned_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*)").
			Eq("status", string(status)).
			Execute(ctx, &tasks)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get tasks by status: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// UpdateStatus updates task status
func (r *taskRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.TaskStatus) error {
	ctx, span := taskTracer.Start(ctx, "taskRepository.UpdateStatus")
	defer span.End()

	span.SetAttributes(
		attribute.String("task.id", id.String()),
		attribute.String("task.status", string(status)),
	)

	updateData := map[string]interface{}{
		"status":     string(status),
		"updated_at": time.Now(),
	}

	// Set completion time if status is completed
	if status == domain.TaskStatusCompleted {
		updateData["completed_at"] = time.Now()
	}

	err := r.client.ExecuteQuery(ctx, "update", "tasks", func() error {
		return r.client.From("tasks").
			Update(updateData).
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update task status: %w", err)
	}

	return nil
}

// GetOverdueTasks retrieves all overdue tasks
func (r *taskRepository) GetOverdueTasks(ctx context.Context) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.GetOverdueTasks")
	defer span.End()

	var tasks []*domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return r.client.From("tasks").
			Select("*, assigned_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*)").
			Lt("due_date", time.Now().Format(time.RFC3339)).
			Neq("status", string(domain.TaskStatusCompleted)).
			IsNotNull("due_date").
			Execute(ctx, &tasks)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}

// GetTasksByRelatedEntity retrieves tasks related to a specific entity
func (r *taskRepository) GetTasksByRelatedEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*domain.Task, error) {
	ctx, span := taskTracer.Start(ctx, "taskRepository.GetTasksByRelatedEntity")
	defer span.End()

	span.SetAttributes(
		attribute.String("entity.type", entityType),
		attribute.String("entity.id", entityID.String()),
	)

	var tasks []*domain.Task
	err := r.client.ExecuteQuery(ctx, "select", "tasks", func() error {
		return r.client.From("tasks").
			Select("*, assigned_user:users!assigned_to(*), assigned_by_user:users!assigned_by(*)").
			Eq("related_to_type", entityType).
			Eq("related_to_id", entityID).
			Execute(ctx, &tasks)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get tasks by related entity: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(tasks)))

	return tasks, nil
}
