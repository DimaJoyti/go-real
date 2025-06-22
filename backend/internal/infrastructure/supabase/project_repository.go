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

var projectTracer = otel.Tracer("goreal-backend/infrastructure/supabase/project")

type projectRepository struct {
	client *Client
}

// NewProjectRepository creates a new project repository
func NewProjectRepository(client *Client) domain.ProjectRepository {
	return &projectRepository{
		client: client,
	}
}

// Create creates a new project
func (r *projectRepository) Create(ctx context.Context, project *domain.Project) error {
	ctx, span := projectTracer.Start(ctx, "projectRepository.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("project.name", project.Name),
		attribute.String("project.id", project.ID.String()),
		attribute.String("project.society_id", project.SocietyID.String()),
	)

	// Set timestamps
	now := time.Now()
	project.CreatedAt = now
	project.UpdatedAt = now

	// Execute insert query
	err := r.client.ExecuteQuery(ctx, "insert", "projects", func() error {
		return r.client.From("projects").Insert(project).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create project: %w", err)
	}

	return nil
}

// GetByID retrieves a project by ID
func (r *projectRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	ctx, span := projectTracer.Start(ctx, "projectRepository.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("project.id", id.String()))

	var project domain.Project
	err := r.client.ExecuteQuery(ctx, "select", "projects", func() error {
		return r.client.From("projects").
			Select("*, society:societies(*)").
			Eq("id", id).
			Single(ctx, &project)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get project by ID: %w", err)
	}

	return &project, nil
}

// Update updates an existing project
func (r *projectRepository) Update(ctx context.Context, project *domain.Project) error {
	ctx, span := projectTracer.Start(ctx, "projectRepository.Update")
	defer span.End()

	span.SetAttributes(
		attribute.String("project.id", project.ID.String()),
		attribute.String("project.name", project.Name),
	)

	// Update timestamp
	project.UpdatedAt = time.Now()

	err := r.client.ExecuteQuery(ctx, "update", "projects", func() error {
		return r.client.From("projects").
			Update(project).
			Eq("id", project.ID).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update project: %w", err)
	}

	return nil
}

// Delete deletes a project by ID
func (r *projectRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := projectTracer.Start(ctx, "projectRepository.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("project.id", id.String()))

	err := r.client.ExecuteQuery(ctx, "delete", "projects", func() error {
		return r.client.From("projects").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete project: %w", err)
	}

	return nil
}

// List retrieves projects with pagination and filtering
func (r *projectRepository) List(ctx context.Context, filters domain.ProjectFilters) ([]*domain.Project, error) {
	ctx, span := projectTracer.Start(ctx, "projectRepository.List")
	defer span.End()

	span.SetAttributes(
		attribute.Int("filters.limit", filters.Limit),
		attribute.Int("filters.offset", filters.Offset),
	)

	query := r.client.From("projects").Select("*, society:societies(*)")

	// Apply filters
	if filters.SocietyID != nil {
		query = query.Eq("society_id", *filters.SocietyID)
		span.SetAttributes(attribute.String("filters.society_id", filters.SocietyID.String()))
	}

	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
		span.SetAttributes(attribute.String("filters.status", string(*filters.Status)))
	}

	if filters.ProjectType != nil {
		query = query.Eq("project_type", *filters.ProjectType)
		span.SetAttributes(attribute.String("filters.project_type", *filters.ProjectType))
	}

	if filters.Search != nil {
		// Search in name or description
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,description.ilike.%s",
			searchPattern, searchPattern))
		span.SetAttributes(attribute.String("filters.search", *filters.Search))
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

	var projects []*domain.Project
	err := r.client.ExecuteQuery(ctx, "select", "projects", func() error {
		return query.Execute(ctx, &projects)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(projects)))

	return projects, nil
}

// Count returns the total number of projects matching the filters
func (r *projectRepository) Count(ctx context.Context, filters domain.ProjectFilters) (int, error) {
	ctx, span := projectTracer.Start(ctx, "projectRepository.Count")
	defer span.End()

	query := r.client.From("projects").Select("id")

	// Apply filters (same as List method)
	if filters.SocietyID != nil {
		query = query.Eq("society_id", *filters.SocietyID)
	}

	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
	}

	if filters.ProjectType != nil {
		query = query.Eq("project_type", *filters.ProjectType)
	}

	if filters.Search != nil {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,description.ilike.%s",
			searchPattern, searchPattern))
	}

	var projects []*domain.Project
	err := r.client.ExecuteQuery(ctx, "select", "projects", func() error {
		return query.Execute(ctx, &projects)
	})

	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to count projects: %w", err)
	}

	count := len(projects)
	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// GetBySociety retrieves projects by society ID
func (r *projectRepository) GetBySociety(ctx context.Context, societyID uuid.UUID) ([]*domain.Project, error) {
	ctx, span := projectTracer.Start(ctx, "projectRepository.GetBySocietyID")
	defer span.End()

	span.SetAttributes(attribute.String("society.id", societyID.String()))

	var projects []*domain.Project
	err := r.client.ExecuteQuery(ctx, "select", "projects", func() error {
		return r.client.From("projects").
			Select("*, society:societies(*)").
			Eq("society_id", societyID).
			Execute(ctx, &projects)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get projects by society ID: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(projects)))

	return projects, nil
}

// GetByStatus retrieves projects by status
func (r *projectRepository) GetByStatus(ctx context.Context, status domain.ProjectStatus) ([]*domain.Project, error) {
	ctx, span := projectTracer.Start(ctx, "projectRepository.GetByStatus")
	defer span.End()

	span.SetAttributes(attribute.String("project.status", string(status)))

	var projects []*domain.Project
	err := r.client.ExecuteQuery(ctx, "select", "projects", func() error {
		return r.client.From("projects").
			Select("*, society:societies(*)").
			Eq("status", string(status)).
			Execute(ctx, &projects)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get projects by status: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(projects)))

	return projects, nil
}

// UpdateStatus updates project status
func (r *projectRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.ProjectStatus) error {
	ctx, span := projectTracer.Start(ctx, "projectRepository.UpdateStatus")
	defer span.End()

	span.SetAttributes(
		attribute.String("project.id", id.String()),
		attribute.String("project.status", string(status)),
	)

	updateData := map[string]interface{}{
		"status":     string(status),
		"updated_at": time.Now(),
	}

	// Set completion date if status is completed
	if status == domain.ProjectStatusCompleted {
		updateData["actual_completion"] = time.Now()
	}

	err := r.client.ExecuteQuery(ctx, "update", "projects", func() error {
		return r.client.From("projects").
			Update(updateData).
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update project status: %w", err)
	}

	return nil
}
