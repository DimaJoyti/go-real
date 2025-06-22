package domain

import (
	"time"

	"github.com/google/uuid"
)

// Filter types for repository queries

// BaseFilters contains common filtering options
type BaseFilters struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
	SortBy string `json:"sort_by"`
	SortOrder string `json:"sort_order"` // asc, desc
}

// UserFilters for filtering user queries
type UserFilters struct {
	BaseFilters
	Role     *UserRole `json:"role"`
	IsActive *bool     `json:"is_active"`
	Search   *string   `json:"search"` // Search in name, email, username
}

// LeadFilters for filtering lead queries
type LeadFilters struct {
	BaseFilters
	Status       *LeadStatus `json:"status"`
	Source       *LeadSource `json:"source"`
	AssignedTo   *uuid.UUID  `json:"assigned_to"`
	CreatedBy    *uuid.UUID  `json:"created_by"`
	BudgetMin    *float64    `json:"budget_min"`
	BudgetMax    *float64    `json:"budget_max"`
	ScoreMin     *int        `json:"score_min"`
	ScoreMax     *int        `json:"score_max"`
	Tags         []string    `json:"tags"`
	Search       *string     `json:"search"`
	CreatedAfter *time.Time  `json:"created_after"`
	CreatedBefore *time.Time `json:"created_before"`
}

// ClientFilters for filtering client queries
type ClientFilters struct {
	BaseFilters
	ClientType   *ClientType `json:"client_type"`
	AssignedTo   *uuid.UUID  `json:"assigned_to"`
	CreatedBy    *uuid.UUID  `json:"created_by"`
	IsVerified   *bool       `json:"is_verified"`
	CompanyID    *uuid.UUID  `json:"company_id"`
	Tags         []string    `json:"tags"`
	Search       *string     `json:"search"`
	CreatedAfter *time.Time  `json:"created_after"`
	CreatedBefore *time.Time `json:"created_before"`
}

// CompanyFilters for filtering company queries
type CompanyFilters struct {
	BaseFilters
	Industry  *string `json:"industry"`
	IsActive  *bool   `json:"is_active"`
	Search    *string `json:"search"`
}

// SocietyFilters for filtering society queries
type SocietyFilters struct {
	BaseFilters
	Location  *string `json:"location"`
	IsActive  *bool   `json:"is_active"`
	CreatedBy *uuid.UUID `json:"created_by"`
	Search    *string `json:"search"`
}

// ProjectFilters for filtering project queries
type ProjectFilters struct {
	BaseFilters
	SocietyID     *uuid.UUID     `json:"society_id"`
	ProjectType   *string        `json:"project_type"`
	Status        *ProjectStatus `json:"status"`
	CreatedBy     *uuid.UUID     `json:"created_by"`
	PriceMin      *float64       `json:"price_min"`
	PriceMax      *float64       `json:"price_max"`
	Search        *string        `json:"search"`
}

// InventoryFilters for filtering inventory queries
type InventoryFilters struct {
	BaseFilters
	ProjectID        *uuid.UUID  `json:"project_id"`
	UnitType         *string     `json:"unit_type"`
	Status           *UnitStatus `json:"status"`
	FloorNumber      *int        `json:"floor_number"`
	Facing           *string     `json:"facing"`
	PriceMin         *float64    `json:"price_min"`
	PriceMax         *float64    `json:"price_max"`
	AreaMin          *float64    `json:"area_min"`
	AreaMax          *float64    `json:"area_max"`
	ParkingSlots     *int        `json:"parking_slots"`
	ReservedBy       *uuid.UUID  `json:"reserved_by"`
	Search           *string     `json:"search"`
}

// SaleFilters for filtering sale queries
type SaleFilters struct {
	BaseFilters
	ClientID      *uuid.UUID  `json:"client_id"`
	SalespersonID *uuid.UUID  `json:"salesperson_id"`
	ManagerID     *uuid.UUID  `json:"manager_id"`
	Status        *SaleStatus `json:"status"`
	AmountMin     *float64    `json:"amount_min"`
	AmountMax     *float64    `json:"amount_max"`
	SaleDateFrom  *time.Time  `json:"sale_date_from"`
	SaleDateTo    *time.Time  `json:"sale_date_to"`
	ProjectID     *uuid.UUID  `json:"project_id"`
	Search        *string     `json:"search"`
}

// TaskFilters for filtering task queries
type TaskFilters struct {
	BaseFilters
	AssignedTo     *uuid.UUID    `json:"assigned_to"`
	AssignedBy     *uuid.UUID    `json:"assigned_by"`
	Status         *TaskStatus   `json:"status"`
	Priority       *TaskPriority `json:"priority"`
	RelatedToType  *string       `json:"related_to_type"`
	RelatedToID    *uuid.UUID    `json:"related_to_id"`
	DueDateFrom    *time.Time    `json:"due_date_from"`
	DueDateTo      *time.Time    `json:"due_date_to"`
	Tags           []string      `json:"tags"`
	Search         *string       `json:"search"`
}

// FollowUpFilters for filtering follow-up queries
type FollowUpFilters struct {
	BaseFilters
	LeadID         *uuid.UUID `json:"lead_id"`
	ClientID       *uuid.UUID `json:"client_id"`
	AssignedTo     *uuid.UUID `json:"assigned_to"`
	FollowUpType   *string    `json:"follow_up_type"`
	Status         *string    `json:"status"`
	DateFrom       *time.Time `json:"date_from"`
	DateTo         *time.Time `json:"date_to"`
}

// CashbookFilters for filtering financial transaction queries
type CashbookFilters struct {
	BaseFilters
	TransactionType *TransactionType `json:"transaction_type"`
	Category        *string          `json:"category"`
	AmountMin       *float64         `json:"amount_min"`
	AmountMax       *float64         `json:"amount_max"`
	DateFrom        *time.Time       `json:"date_from"`
	DateTo          *time.Time       `json:"date_to"`
	CreatedBy       *uuid.UUID       `json:"created_by"`
	ApprovedBy      *uuid.UUID       `json:"approved_by"`
	Search          *string          `json:"search"`
}

// VoucherFilters for filtering voucher queries
type VoucherFilters struct {
	BaseFilters
	VoucherType  *string         `json:"voucher_type"`
	Status       *ApprovalStatus `json:"status"`
	RequestedBy  *uuid.UUID      `json:"requested_by"`
	ApprovedBy   *uuid.UUID      `json:"approved_by"`
	AmountMin    *float64        `json:"amount_min"`
	AmountMax    *float64        `json:"amount_max"`
	DateFrom     *time.Time      `json:"date_from"`
	DateTo       *time.Time      `json:"date_to"`
	Search       *string         `json:"search"`
}

// RefundFilters for filtering refund queries
type RefundFilters struct {
	BaseFilters
	SaleID       *uuid.UUID      `json:"sale_id"`
	ClientID     *uuid.UUID      `json:"client_id"`
	Status       *ApprovalStatus `json:"status"`
	RequestedBy  *uuid.UUID      `json:"requested_by"`
	ApprovedBy   *uuid.UUID      `json:"approved_by"`
	AmountMin    *float64        `json:"amount_min"`
	AmountMax    *float64        `json:"amount_max"`
	DateFrom     *time.Time      `json:"date_from"`
	DateTo       *time.Time      `json:"date_to"`
}

// PaymentScheduleFilters for filtering payment schedule queries
type PaymentScheduleFilters struct {
	BaseFilters
	SaleID       *uuid.UUID     `json:"sale_id"`
	Status       *PaymentStatus `json:"status"`
	DueDateFrom  *time.Time     `json:"due_date_from"`
	DueDateTo    *time.Time     `json:"due_date_to"`
	AmountMin    *float64       `json:"amount_min"`
	AmountMax    *float64       `json:"amount_max"`
}

// CommissionFilters for filtering commission queries
type CommissionFilters struct {
	BaseFilters
	SaleID         *uuid.UUID     `json:"sale_id"`
	EmployeeID     *uuid.UUID     `json:"employee_id"`
	CommissionType *string        `json:"commission_type"`
	Status         *PaymentStatus `json:"status"`
	AmountMin      *float64       `json:"amount_min"`
	AmountMax      *float64       `json:"amount_max"`
}

// NFTFilters for filtering NFT queries
type NFTFilters struct {
	BaseFilters
	PropertyID    *uuid.UUID    `json:"property_id"`
	PropertyType  *PropertyType `json:"property_type"`
	CreatorID     *uuid.UUID    `json:"creator_id"`
	IsListed      *bool         `json:"is_listed"`
	PriceMin      *float64      `json:"price_min"`
	PriceMax      *float64      `json:"price_max"`
	Currency      *string       `json:"currency"`
	Search        *string       `json:"search"`
}

// ListingFilters for filtering NFT listing queries
type ListingFilters struct {
	BaseFilters
	NFTID         *uuid.UUID     `json:"nft_id"`
	SellerAddress *string        `json:"seller_address"`
	Status        *ListingStatus `json:"status"`
	PriceMin      *float64       `json:"price_min"`
	PriceMax      *float64       `json:"price_max"`
	Currency      *string        `json:"currency"`
}

// BlockchainTransactionFilters for filtering blockchain transaction queries
type BlockchainTransactionFilters struct {
	BaseFilters
	FromAddress     *string            `json:"from_address"`
	ToAddress       *string            `json:"to_address"`
	TransactionType *string            `json:"transaction_type"`
	Status          *TransactionStatus `json:"status"`
	RelatedTable    *string            `json:"related_table"`
	RelatedID       *uuid.UUID         `json:"related_id"`
	BlockNumber     *int64             `json:"block_number"`
}

// ChallengeFilters for filtering challenge queries
type ChallengeFilters struct {
	BaseFilters
	CreatorID   *uuid.UUID `json:"creator_id"`
	Status      *string    `json:"status"`
	RewardType  *string    `json:"reward_type"`
	Tags        []string   `json:"tags"`
	Search      *string    `json:"search"`
	StartAfter  *time.Time `json:"start_after"`
	StartBefore *time.Time `json:"start_before"`
	EndAfter    *time.Time `json:"end_after"`
	EndBefore   *time.Time `json:"end_before"`
}

// FilmFilters for filtering film queries
type FilmFilters struct {
	BaseFilters
	CreatorID *uuid.UUID `json:"creator_id"`
	Status    *string    `json:"status"`
	Genre     []string   `json:"genre"`
	IsPublic  *bool      `json:"is_public"`
	Search    *string    `json:"search"`
}

// Stats and summary types
type SalesStats struct {
	TotalSales      int     `json:"total_sales"`
	TotalRevenue    float64 `json:"total_revenue"`
	AverageValue    float64 `json:"average_value"`
	PendingSales    int     `json:"pending_sales"`
	ApprovedSales   int     `json:"approved_sales"`
	CompletedSales  int     `json:"completed_sales"`
	CancelledSales  int     `json:"cancelled_sales"`
	MonthlyRevenue  float64 `json:"monthly_revenue"`
	YearlyRevenue   float64 `json:"yearly_revenue"`
}

// FinancialSummary represents financial summary data
type FinancialSummary struct {
	TotalIncome     float64 `json:"total_income"`
	TotalExpense    float64 `json:"total_expense"`
	NetProfit       float64 `json:"net_profit"`
	MonthlyIncome   float64 `json:"monthly_income"`
	MonthlyExpense  float64 `json:"monthly_expense"`
	YearlyIncome    float64 `json:"yearly_income"`
	YearlyExpense   float64 `json:"yearly_expense"`
	PendingPayments float64 `json:"pending_payments"`
	OverduePayments float64 `json:"overdue_payments"`
}
