package supabase

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// leadRepository implements domain.LeadRepository using Supabase
type leadRepository struct {
	client *Client
}

// NewLeadRepository creates a new lead repository
func NewLeadRepository(client *Client) domain.LeadRepository {
	return &leadRepository{
		client: client,
	}
}

func (r *leadRepository) Create(ctx context.Context, lead *domain.Lead) error {
	dbLead := r.domainToDBLead(lead)

	return r.client.ExecuteQuery(ctx, "insert", "leads", func() error {
		return r.client.From("leads").Insert(dbLead).Execute(ctx, nil)
	})
}

func (r *leadRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Lead, error) {
	var dbLead dbLead
	
	err := r.client.ExecuteQuery(ctx, "select_by_id", "leads", func() error {
		return r.client.From("leads").
			Select(`
				*,
				assigned_user:assigned_to(id, username, full_name, email, role)
			`).
			Eq("id", id).
			Single(ctx, &dbLead)
	})
	
	if err != nil {
		return nil, fmt.Errorf("lead not found: %w", err)
	}

	return r.dbToDomainLead(&dbLead), nil
}

func (r *leadRepository) Update(ctx context.Context, lead *domain.Lead) error {
	dbLead := r.domainToDBLead(lead)
	dbLead.UpdatedAt = time.Now()

	return r.client.ExecuteQuery(ctx, "update", "leads", func() error {
		return r.client.From("leads").
			Update(dbLead).
			Eq("id", lead.ID).
			Execute(ctx, nil)
	})
}

func (r *leadRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.ExecuteQuery(ctx, "delete", "leads", func() error {
		return r.client.From("leads").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})
}

func (r *leadRepository) List(ctx context.Context, filters domain.LeadFilters) ([]*domain.Lead, error) {
	query := r.client.From("leads").Select(`
		*,
		assigned_user:assigned_to(id, username, full_name, email, role)
	`)

	// Apply filters
	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
	}
	if filters.Source != nil {
		query = query.Eq("source", string(*filters.Source))
	}
	if filters.AssignedTo != nil {
		query = query.Eq("assigned_to", *filters.AssignedTo)
	}
	if filters.CreatedBy != nil {
		query = query.Eq("created_by", *filters.CreatedBy)
	}
	if filters.BudgetMin != nil {
		query = query.Gte("budget_min", *filters.BudgetMin)
	}
	if filters.BudgetMax != nil {
		query = query.Lte("budget_max", *filters.BudgetMax)
	}
	if filters.ScoreMin != nil {
		query = query.Gte("score", *filters.ScoreMin)
	}
	if filters.ScoreMax != nil {
		query = query.Lte("score", *filters.ScoreMax)
	}
	if filters.CreatedAfter != nil {
		query = query.Gte("created_at", filters.CreatedAfter.Format(time.RFC3339))
	}
	if filters.CreatedBefore != nil {
		query = query.Lte("created_at", filters.CreatedBefore.Format(time.RFC3339))
	}
	if filters.Search != nil && *filters.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,email.ilike.%s,company_name.ilike.%s,requirements.ilike.%s", 
			searchPattern, searchPattern, searchPattern, searchPattern))
	}
	if len(filters.Tags) > 0 {
		// PostgreSQL array contains operator
		for _, tag := range filters.Tags {
			query = query.Contains("tags", fmt.Sprintf(`["%s"]`, tag))
		}
	}

	// Apply sorting
	if filters.SortBy != "" {
		ascending := filters.SortOrder != "desc"
		query = query.Order(filters.SortBy, ascending)
	} else {
		query = query.Order("created_at", false) // Default sort by created_at desc
	}

	// Apply pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	var dbLeads []dbLead
	err := r.client.ExecuteQuery(ctx, "select_list", "leads", func() error {
		return query.Execute(ctx, &dbLeads)
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to list leads: %w", err)
	}

	// Convert to domain models
	leads := make([]*domain.Lead, len(dbLeads))
	for i, dbLead := range dbLeads {
		leads[i] = r.dbToDomainLead(&dbLead)
	}

	return leads, nil
}

func (r *leadRepository) Count(ctx context.Context, filters domain.LeadFilters) (int, error) {
	query := r.client.From("leads").Select("id")

	// Apply same filters as List method
	if filters.Status != nil {
		query = query.Eq("status", string(*filters.Status))
	}
	if filters.Source != nil {
		query = query.Eq("source", string(*filters.Source))
	}
	if filters.AssignedTo != nil {
		query = query.Eq("assigned_to", *filters.AssignedTo)
	}
	if filters.CreatedBy != nil {
		query = query.Eq("created_by", *filters.CreatedBy)
	}
	if filters.BudgetMin != nil {
		query = query.Gte("budget_min", *filters.BudgetMin)
	}
	if filters.BudgetMax != nil {
		query = query.Lte("budget_max", *filters.BudgetMax)
	}
	if filters.ScoreMin != nil {
		query = query.Gte("score", *filters.ScoreMin)
	}
	if filters.ScoreMax != nil {
		query = query.Lte("score", *filters.ScoreMax)
	}
	if filters.CreatedAfter != nil {
		query = query.Gte("created_at", filters.CreatedAfter.Format(time.RFC3339))
	}
	if filters.CreatedBefore != nil {
		query = query.Lte("created_at", filters.CreatedBefore.Format(time.RFC3339))
	}
	if filters.Search != nil && *filters.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", *filters.Search)
		query = query.Or(fmt.Sprintf("name.ilike.%s,email.ilike.%s,company_name.ilike.%s,requirements.ilike.%s", 
			searchPattern, searchPattern, searchPattern, searchPattern))
	}

	var result []map[string]interface{}
	count, err := query.ExecuteWithCount(ctx, &result)
	if err != nil {
		return 0, fmt.Errorf("failed to count leads: %w", err)
	}

	return count, nil
}

func (r *leadRepository) GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*domain.Lead, error) {
	var dbLeads []dbLead
	
	err := r.client.ExecuteQuery(ctx, "select_by_assigned_user", "leads", func() error {
		return r.client.From("leads").
			Select(`
				*,
				assigned_user:assigned_to(id, username, full_name, email, role)
			`).
			Eq("assigned_to", userID).
			Order("created_at", false).
			Execute(ctx, &dbLeads)
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to get leads by assigned user: %w", err)
	}

	// Convert to domain models
	leads := make([]*domain.Lead, len(dbLeads))
	for i, dbLead := range dbLeads {
		leads[i] = r.dbToDomainLead(&dbLead)
	}

	return leads, nil
}

func (r *leadRepository) GetOverdueFollowUps(ctx context.Context) ([]*domain.Lead, error) {
	var dbLeads []dbLead
	
	err := r.client.ExecuteQuery(ctx, "select_overdue_followups", "leads", func() error {
		return r.client.From("leads").
			Select(`
				*,
				assigned_user:assigned_to(id, username, full_name, email, role)
			`).
			Lt("next_follow_up", time.Now().Format(time.RFC3339)).
			IsNotNull("next_follow_up").
			Neq("status", string(domain.LeadStatusConverted)).
			Neq("status", string(domain.LeadStatusLost)).
			Order("next_follow_up", true).
			Execute(ctx, &dbLeads)
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue follow-ups: %w", err)
	}

	// Convert to domain models
	leads := make([]*domain.Lead, len(dbLeads))
	for i, dbLead := range dbLeads {
		leads[i] = r.dbToDomainLead(&dbLead)
	}

	return leads, nil
}

// dbLead represents the database model for leads
type dbLead struct {
	ID               uuid.UUID              `json:"id" db:"id"`
	Name             string                 `json:"name" db:"name"`
	Email            *string                `json:"email" db:"email"`
	Phone            *string                `json:"phone" db:"phone"`
	CompanyName      *string                `json:"company_name" db:"company_name"`
	Designation      *string                `json:"designation" db:"designation"`
	Source           string                 `json:"source" db:"source"`
	Status           string                 `json:"status" db:"status"`
	AssignedTo       *uuid.UUID             `json:"assigned_to" db:"assigned_to"`
	AssignedUser     *dbUser                `json:"assigned_user,omitempty"`
	BudgetMin        *float64               `json:"budget_min" db:"budget_min"`
	BudgetMax        *float64               `json:"budget_max" db:"budget_max"`
	Requirements     *string                `json:"requirements" db:"requirements"`
	Notes            *string                `json:"notes" db:"notes"`
	LastContactDate  *time.Time             `json:"last_contact_date" db:"last_contact_date"`
	NextFollowUp     *time.Time             `json:"next_follow_up" db:"next_follow_up"`
	Score            int                    `json:"score" db:"score"`
	Tags             pq.StringArray         `json:"tags" db:"tags"`
	CustomFields     map[string]interface{} `json:"custom_fields" db:"custom_fields"`
	CreatedBy        uuid.UUID              `json:"created_by" db:"created_by"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
}

// domainToDBLead converts domain lead to database model
func (r *leadRepository) domainToDBLead(lead *domain.Lead) *dbLead {
	return &dbLead{
		ID:              lead.ID,
		Name:            lead.Name,
		Email:           lead.Email,
		Phone:           lead.Phone,
		CompanyName:     lead.CompanyName,
		Designation:     lead.Designation,
		Source:          string(lead.Source),
		Status:          string(lead.Status),
		AssignedTo:      lead.AssignedTo,
		BudgetMin:       lead.BudgetMin,
		BudgetMax:       lead.BudgetMax,
		Requirements:    lead.Requirements,
		Notes:           lead.Notes,
		LastContactDate: lead.LastContactDate,
		NextFollowUp:    lead.NextFollowUp,
		Score:           lead.Score,
		Tags:            pq.StringArray(lead.Tags),
		CustomFields:    map[string]interface{}(lead.CustomFields),
		CreatedBy:       lead.CreatedBy,
		CreatedAt:       lead.CreatedAt,
		UpdatedAt:       lead.UpdatedAt,
	}
}

// dbToDomainLead converts database lead to domain model
func (r *leadRepository) dbToDomainLead(dbLead *dbLead) *domain.Lead {
	lead := &domain.Lead{
		ID:              dbLead.ID,
		Name:            dbLead.Name,
		Email:           dbLead.Email,
		Phone:           dbLead.Phone,
		CompanyName:     dbLead.CompanyName,
		Designation:     dbLead.Designation,
		Source:          domain.LeadSource(dbLead.Source),
		Status:          domain.LeadStatus(dbLead.Status),
		AssignedTo:      dbLead.AssignedTo,
		BudgetMin:       dbLead.BudgetMin,
		BudgetMax:       dbLead.BudgetMax,
		Requirements:    dbLead.Requirements,
		Notes:           dbLead.Notes,
		LastContactDate: dbLead.LastContactDate,
		NextFollowUp:    dbLead.NextFollowUp,
		Score:           dbLead.Score,
		Tags:            []string(dbLead.Tags),
		CustomFields:    domain.CustomFields(dbLead.CustomFields),
		CreatedBy:       dbLead.CreatedBy,
		CreatedAt:       dbLead.CreatedAt,
		UpdatedAt:       dbLead.UpdatedAt,
	}

	// Convert assigned user if present
	if dbLead.AssignedUser != nil {
		lead.AssignedUser = &domain.User{
			ID:       dbLead.AssignedUser.ID,
			Username: dbLead.AssignedUser.Username,
			FullName: dbLead.AssignedUser.FullName,
			Email:    dbLead.AssignedUser.Email,
			Role:     domain.UserRole(dbLead.AssignedUser.Role),
		}
	}

	return lead
}
