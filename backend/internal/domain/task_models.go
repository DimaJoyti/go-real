package domain

import (
	"time"

	"github.com/google/uuid"
)

// Task represents a task in the system
type Task struct {
	ID             uuid.UUID    `json:"id" db:"id"`
	Title          string       `json:"title" db:"title"`
	Description    *string      `json:"description" db:"description"`
	AssignedTo     *uuid.UUID   `json:"assigned_to" db:"assigned_to"`
	AssignedUser   *User        `json:"assigned_user,omitempty"`
	AssignedBy     *uuid.UUID   `json:"assigned_by" db:"assigned_by"`
	AssignedByUser *User        `json:"assigned_by_user,omitempty"`
	RelatedToType  *string      `json:"related_to_type" db:"related_to_type"`
	RelatedToID    *uuid.UUID   `json:"related_to_id" db:"related_to_id"`
	Status         TaskStatus   `json:"status" db:"status"`
	Priority       TaskPriority `json:"priority" db:"priority"`
	DueDate        *time.Time   `json:"due_date" db:"due_date"`
	CompletedAt    *time.Time   `json:"completed_at" db:"completed_at"`
	EstimatedHours *float64     `json:"estimated_hours" db:"estimated_hours"`
	ActualHours    *float64     `json:"actual_hours" db:"actual_hours"`
	Tags           []string     `json:"tags" db:"tags"`
	Attachments    []string     `json:"attachments" db:"attachments"`
	CreatedBy      uuid.UUID    `json:"created_by" db:"created_by"`
	CreatedAt      time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at" db:"updated_at"`
}

// TaskStatus represents the status of a task
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusCancelled  TaskStatus = "cancelled"
	TaskStatusOverdue    TaskStatus = "overdue"
)

// TaskPriority represents the priority of a task
type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityUrgent TaskPriority = "urgent"
)

// FollowUp represents a follow-up activity
type FollowUp struct {
	ID             uuid.UUID    `json:"id" db:"id"`
	LeadID         *uuid.UUID   `json:"lead_id" db:"lead_id"`
	Lead           *Lead        `json:"lead,omitempty"`
	ClientID       *uuid.UUID   `json:"client_id" db:"client_id"`
	Client         *Client      `json:"client,omitempty"`
	AssignedTo     *uuid.UUID   `json:"assigned_to" db:"assigned_to"`
	AssignedUser   *User        `json:"assigned_user,omitempty"`
	FollowUpDate   time.Time    `json:"follow_up_date" db:"follow_up_date"`
	FollowUpType   string       `json:"follow_up_type" db:"follow_up_type"`
	Status         string       `json:"status" db:"status"`
	Notes          *string      `json:"notes" db:"notes"`
	Outcome        *string      `json:"outcome" db:"outcome"`
	NextFollowUp   *time.Time   `json:"next_follow_up" db:"next_follow_up"`
	CreatedBy      uuid.UUID    `json:"created_by" db:"created_by"`
	CreatedAt      time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at" db:"updated_at"`
}

// Approval represents an approval workflow
type Approval struct {
	ID            uuid.UUID       `json:"id" db:"id"`
	ApprovalType  string          `json:"approval_type" db:"approval_type"`
	RelatedTable  string          `json:"related_table" db:"related_table"`
	RelatedID     uuid.UUID       `json:"related_id" db:"related_id"`
	RequestedBy   *uuid.UUID      `json:"requested_by" db:"requested_by"`
	Requester     *User           `json:"requester,omitempty"`
	ApproverID    *uuid.UUID      `json:"approver_id" db:"approver_id"`
	Approver      *User           `json:"approver,omitempty"`
	Status        ApprovalStatus  `json:"status" db:"status"`
	RequestData   CustomFields    `json:"request_data" db:"request_data"`
	ApprovalNotes *string         `json:"approval_notes" db:"approval_notes"`
	RejectionReason *string       `json:"rejection_reason" db:"rejection_reason"`
	ApprovedAt    *time.Time      `json:"approved_at" db:"approved_at"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
}

// ApprovalStatus represents the status of an approval
type ApprovalStatus string

const (
	ApprovalStatusPending   ApprovalStatus = "pending"
	ApprovalStatusApproved  ApprovalStatus = "approved"
	ApprovalStatusRejected  ApprovalStatus = "rejected"
	ApprovalStatusCancelled ApprovalStatus = "cancelled"
)

// Cashbook represents financial transactions
type Cashbook struct {
	ID                uuid.UUID       `json:"id" db:"id"`
	TransactionNumber string          `json:"transaction_number" db:"transaction_number"`
	TransactionDate   time.Time       `json:"transaction_date" db:"transaction_date"`
	TransactionType   TransactionType `json:"transaction_type" db:"transaction_type"`
	Category          *string         `json:"category" db:"category"`
	Description       string          `json:"description" db:"description"`
	Amount            float64         `json:"amount" db:"amount"`
	PaymentMethod     *string         `json:"payment_method" db:"payment_method"`
	ReferenceNumber   *string         `json:"reference_number" db:"reference_number"`
	RelatedToType     *string         `json:"related_to_type" db:"related_to_type"`
	RelatedToID       *uuid.UUID      `json:"related_to_id" db:"related_to_id"`
	AccountHead       *string         `json:"account_head" db:"account_head"`
	VoucherNumber     *string         `json:"voucher_number" db:"voucher_number"`
	Attachments       []string        `json:"attachments" db:"attachments"`
	ApprovedBy        *uuid.UUID      `json:"approved_by" db:"approved_by"`
	Approver          *User           `json:"approver,omitempty"`
	ApprovalDate      *time.Time      `json:"approval_date" db:"approval_date"`
	CreatedBy         uuid.UUID       `json:"created_by" db:"created_by"`
	CreatedAt         time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at" db:"updated_at"`
}

// TransactionType represents the type of financial transaction
type TransactionType string

const (
	TransactionTypeIncome   TransactionType = "income"
	TransactionTypeExpense  TransactionType = "expense"
	TransactionTypeTransfer TransactionType = "transfer"
)

// Voucher represents a payment voucher
type Voucher struct {
	ID              uuid.UUID       `json:"id" db:"id"`
	VoucherNumber   string          `json:"voucher_number" db:"voucher_number"`
	VoucherType     *string         `json:"voucher_type" db:"voucher_type"`
	VoucherDate     time.Time       `json:"voucher_date" db:"voucher_date"`
	PartyName       *string         `json:"party_name" db:"party_name"`
	Amount          float64         `json:"amount" db:"amount"`
	Description     string          `json:"description" db:"description"`
	PaymentMethod   *string         `json:"payment_method" db:"payment_method"`
	BankDetails     CustomFields    `json:"bank_details" db:"bank_details"`
	Status          ApprovalStatus  `json:"status" db:"status"`
	RequestedBy     *uuid.UUID      `json:"requested_by" db:"requested_by"`
	Requester       *User           `json:"requester,omitempty"`
	ApprovedBy      *uuid.UUID      `json:"approved_by" db:"approved_by"`
	Approver        *User           `json:"approver,omitempty"`
	ApprovalDate    *time.Time      `json:"approval_date" db:"approval_date"`
	RejectionReason *string         `json:"rejection_reason" db:"rejection_reason"`
	Attachments     []string        `json:"attachments" db:"attachments"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at" db:"updated_at"`
}

// Refund represents a refund request
type Refund struct {
	ID               uuid.UUID      `json:"id" db:"id"`
	RefundNumber     string         `json:"refund_number" db:"refund_number"`
	SaleID           *uuid.UUID     `json:"sale_id" db:"sale_id"`
	Sale             *Sale          `json:"sale,omitempty"`
	ClientID         uuid.UUID      `json:"client_id" db:"client_id"`
	Client           *Client        `json:"client,omitempty"`
	OriginalAmount   float64        `json:"original_amount" db:"original_amount"`
	RefundAmount     float64        `json:"refund_amount" db:"refund_amount"`
	RefundReason     string         `json:"refund_reason" db:"refund_reason"`
	DeductionAmount  float64        `json:"deduction_amount" db:"deduction_amount"`
	DeductionReason  *string        `json:"deduction_reason" db:"deduction_reason"`
	RefundDate       *time.Time     `json:"refund_date" db:"refund_date"`
	PaymentMethod    *string        `json:"payment_method" db:"payment_method"`
	BankDetails      CustomFields   `json:"bank_details" db:"bank_details"`
	Status           ApprovalStatus `json:"status" db:"status"`
	RequestedBy      *uuid.UUID     `json:"requested_by" db:"requested_by"`
	Requester        *User          `json:"requester,omitempty"`
	ApprovedBy       *uuid.UUID     `json:"approved_by" db:"approved_by"`
	Approver         *User          `json:"approver,omitempty"`
	ApprovalDate     *time.Time     `json:"approval_date" db:"approval_date"`
	RejectionReason  *string        `json:"rejection_reason" db:"rejection_reason"`
	Documents        []string       `json:"documents" db:"documents"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

// PaymentSchedule represents installment payment schedule
type PaymentSchedule struct {
	ID                  uuid.UUID     `json:"id" db:"id"`
	SaleID              uuid.UUID     `json:"sale_id" db:"sale_id"`
	Sale                *Sale         `json:"sale,omitempty"`
	InstallmentNumber   int           `json:"installment_number" db:"installment_number"`
	DueDate             time.Time     `json:"due_date" db:"due_date"`
	Amount              float64       `json:"amount" db:"amount"`
	Description         *string       `json:"description" db:"description"`
	Status              PaymentStatus `json:"status" db:"status"`
	PaidAmount          float64       `json:"paid_amount" db:"paid_amount"`
	PaidDate            *time.Time    `json:"paid_date" db:"paid_date"`
	PaymentMethod       *string       `json:"payment_method" db:"payment_method"`
	TransactionReference *string      `json:"transaction_reference" db:"transaction_reference"`
	LateFee             float64       `json:"late_fee" db:"late_fee"`
	Notes               *string       `json:"notes" db:"notes"`
	CreatedAt           time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time     `json:"updated_at" db:"updated_at"`
}

// PaymentStatus represents the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusPaid      PaymentStatus = "paid"
	PaymentStatusOverdue   PaymentStatus = "overdue"
	PaymentStatusCancelled PaymentStatus = "cancelled"
)

// Commission represents sales commission
type Commission struct {
	ID               uuid.UUID     `json:"id" db:"id"`
	SaleID           uuid.UUID     `json:"sale_id" db:"sale_id"`
	Sale             *Sale         `json:"sale,omitempty"`
	EmployeeID       *uuid.UUID    `json:"employee_id" db:"employee_id"`
	Employee         *User         `json:"employee,omitempty"`
	CommissionType   string        `json:"commission_type" db:"commission_type"`
	CommissionRate   *float64      `json:"commission_rate" db:"commission_rate"`
	CommissionAmount float64       `json:"commission_amount" db:"commission_amount"`
	Status           PaymentStatus `json:"status" db:"status"`
	PaidDate         *time.Time    `json:"paid_date" db:"paid_date"`
	PaymentReference *string       `json:"payment_reference" db:"payment_reference"`
	Notes            *string       `json:"notes" db:"notes"`
	CreatedAt        time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at" db:"updated_at"`
}
