package domain

import (
	"time"

	"github.com/google/uuid"
)

// CRM-specific user roles are defined in models.go

// Company represents a business organization
type Company struct {
	ID                 uuid.UUID              `json:"id" db:"id"`
	Name               string                 `json:"name" db:"name"`
	RegistrationNumber *string                `json:"registration_number" db:"registration_number"`
	TaxID              *string                `json:"tax_id" db:"tax_id"`
	Industry           *string                `json:"industry" db:"industry"`
	Website            *string                `json:"website" db:"website"`
	Phone              *string                `json:"phone" db:"phone"`
	Email              *string                `json:"email" db:"email"`
	Address            *Address               `json:"address" db:"address"`
	LogoURL            *string                `json:"logo_url" db:"logo_url"`
	IsActive           bool                   `json:"is_active" db:"is_active"`
	CreatedAt          time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at" db:"updated_at"`
}

// Address represents a physical address
type Address struct {
	Street     string `json:"street"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	PostalCode string `json:"postal_code"`
}

// Lead represents a potential customer
type Lead struct {
	ID               uuid.UUID    `json:"id" db:"id"`
	Name             string       `json:"name" db:"name"`
	Email            *string      `json:"email" db:"email"`
	Phone            *string      `json:"phone" db:"phone"`
	CompanyName      *string      `json:"company_name" db:"company_name"`
	Designation      *string      `json:"designation" db:"designation"`
	Source           LeadSource   `json:"source" db:"source"`
	Status           LeadStatus   `json:"status" db:"status"`
	AssignedTo       *uuid.UUID   `json:"assigned_to" db:"assigned_to"`
	AssignedUser     *User        `json:"assigned_user,omitempty"`
	BudgetMin        *float64     `json:"budget_min" db:"budget_min"`
	BudgetMax        *float64     `json:"budget_max" db:"budget_max"`
	Requirements     *string      `json:"requirements" db:"requirements"`
	Notes            *string      `json:"notes" db:"notes"`
	LastContactDate  *time.Time   `json:"last_contact_date" db:"last_contact_date"`
	NextFollowUp     *time.Time   `json:"next_follow_up" db:"next_follow_up"`
	Score            int          `json:"score" db:"score"`
	Tags             []string     `json:"tags" db:"tags"`
	CustomFields     CustomFields `json:"custom_fields" db:"custom_fields"`
	CreatedBy        uuid.UUID    `json:"created_by" db:"created_by"`
	CreatedAt        time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time    `json:"updated_at" db:"updated_at"`
}

// LeadSource represents the source of a lead
type LeadSource string

const (
	LeadSourceWebsite     LeadSource = "website"
	LeadSourceReferral    LeadSource = "referral"
	LeadSourceSocialMedia LeadSource = "social_media"
	LeadSourceAdvertisement LeadSource = "advertisement"
	LeadSourceWalkIn      LeadSource = "walk_in"
	LeadSourcePhone       LeadSource = "phone"
	LeadSourceEmail       LeadSource = "email"
	LeadSourceEvent       LeadSource = "event"
	LeadSourceOther       LeadSource = "other"
)

// LeadStatus represents the status of a lead
type LeadStatus string

const (
	LeadStatusNew         LeadStatus = "new"
	LeadStatusContacted   LeadStatus = "contacted"
	LeadStatusQualified   LeadStatus = "qualified"
	LeadStatusProposal    LeadStatus = "proposal"
	LeadStatusNegotiation LeadStatus = "negotiation"
	LeadStatusConverted   LeadStatus = "converted"
	LeadStatusLost        LeadStatus = "lost"
	LeadStatusInactive    LeadStatus = "inactive"
)

// Client represents a converted lead or direct client
type Client struct {
	ID               uuid.UUID    `json:"id" db:"id"`
	ProfileID        *uuid.UUID   `json:"profile_id" db:"profile_id"`
	Profile          *User        `json:"profile,omitempty"`
	LeadID           *uuid.UUID   `json:"lead_id" db:"lead_id"`
	Lead             *Lead        `json:"lead,omitempty"`
	CompanyID        *uuid.UUID   `json:"company_id" db:"company_id"`
	Company          *Company     `json:"company,omitempty"`
	ClientType       ClientType   `json:"client_type" db:"client_type"`
	Name             string       `json:"name" db:"name"`
	Email            *string      `json:"email" db:"email"`
	Phone            *string      `json:"phone" db:"phone"`
	AlternatePhone   *string      `json:"alternate_phone" db:"alternate_phone"`
	DateOfBirth      *time.Time   `json:"date_of_birth" db:"date_of_birth"`
	AnniversaryDate  *time.Time   `json:"anniversary_date" db:"anniversary_date"`
	Address          *Address     `json:"address" db:"address"`
	EmergencyContact *Contact     `json:"emergency_contact" db:"emergency_contact"`
	KYCDocuments     []string     `json:"kyc_documents" db:"kyc_documents"`
	IsVerified       bool         `json:"is_verified" db:"is_verified"`
	CreditLimit      *float64     `json:"credit_limit" db:"credit_limit"`
	AssignedTo       *uuid.UUID   `json:"assigned_to" db:"assigned_to"`
	AssignedUser     *User        `json:"assigned_user,omitempty"`
	Tags             []string     `json:"tags" db:"tags"`
	CustomFields     CustomFields `json:"custom_fields" db:"custom_fields"`
	CreatedBy        uuid.UUID    `json:"created_by" db:"created_by"`
	CreatedAt        time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time    `json:"updated_at" db:"updated_at"`
}

// ClientType represents the type of client
type ClientType string

const (
	ClientTypeIndividual ClientType = "individual"
	ClientTypeCorporate  ClientType = "corporate"
	ClientTypeInvestor   ClientType = "investor"
	ClientTypeDeveloper  ClientType = "developer"
)

// Contact represents contact information
type Contact struct {
	Name         string `json:"name"`
	Relationship string `json:"relationship"`
	Phone        string `json:"phone"`
	Email        string `json:"email,omitempty"`
}

// Society represents a real estate development/society
type Society struct {
	ID            uuid.UUID `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	DeveloperName *string   `json:"developer_name" db:"developer_name"`
	Location      string    `json:"location" db:"location"`
	Address       *Address  `json:"address" db:"address"`
	TotalArea     *float64  `json:"total_area" db:"total_area"`
	TotalUnits    *int      `json:"total_units" db:"total_units"`
	Amenities     []string  `json:"amenities" db:"amenities"`
	Description   *string   `json:"description" db:"description"`
	Images        []string  `json:"images" db:"images"`
	BrochureURL   *string   `json:"brochure_url" db:"brochure_url"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	CreatedBy     uuid.UUID `json:"created_by" db:"created_by"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// Project represents a project within a society
type Project struct {
	ID                  uuid.UUID     `json:"id" db:"id"`
	SocietyID           uuid.UUID     `json:"society_id" db:"society_id"`
	Society             *Society      `json:"society,omitempty"`
	Name                string        `json:"name" db:"name"`
	ProjectType         *string       `json:"project_type" db:"project_type"`
	Status              ProjectStatus `json:"status" db:"status"`
	StartDate           *time.Time    `json:"start_date" db:"start_date"`
	ExpectedCompletion  *time.Time    `json:"expected_completion" db:"expected_completion"`
	ActualCompletion    *time.Time    `json:"actual_completion" db:"actual_completion"`
	TotalUnits          *int          `json:"total_units" db:"total_units"`
	AvailableUnits      *int          `json:"available_units" db:"available_units"`
	SoldUnits           int           `json:"sold_units" db:"sold_units"`
	BlockedUnits        int           `json:"blocked_units" db:"blocked_units"`
	BasePrice           *float64      `json:"base_price" db:"base_price"`
	PricePerSqft        *float64      `json:"price_per_sqft" db:"price_per_sqft"`
	Description         *string       `json:"description" db:"description"`
	Specifications      *string       `json:"specifications" db:"specifications"`
	FloorPlans          []string      `json:"floor_plans" db:"floor_plans"`
	Images              []string      `json:"images" db:"images"`
	Videos              []string      `json:"videos" db:"videos"`
	BrochureURL         *string       `json:"brochure_url" db:"brochure_url"`
	RERANumber          *string       `json:"rera_number" db:"rera_number"`
	Approvals           CustomFields  `json:"approvals" db:"approvals"`
	Amenities           []string      `json:"amenities" db:"amenities"`
	NearbyFacilities    CustomFields  `json:"nearby_facilities" db:"nearby_facilities"`
	CreatedBy           uuid.UUID     `json:"created_by" db:"created_by"`
	CreatedAt           time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time     `json:"updated_at" db:"updated_at"`
}

// ProjectStatus represents the status of a project
type ProjectStatus string

const (
	ProjectStatusPlanning         ProjectStatus = "planning"
	ProjectStatusApproved         ProjectStatus = "approved"
	ProjectStatusUnderConstruction ProjectStatus = "under_construction"
	ProjectStatusCompleted        ProjectStatus = "completed"
	ProjectStatusOnHold           ProjectStatus = "on_hold"
	ProjectStatusCancelled        ProjectStatus = "cancelled"
)

// Inventory represents individual units/properties
type Inventory struct {
	ID                uuid.UUID    `json:"id" db:"id"`
	ProjectID         uuid.UUID    `json:"project_id" db:"project_id"`
	Project           *Project     `json:"project,omitempty"`
	UnitNumber        string       `json:"unit_number" db:"unit_number"`
	FloorNumber       *int         `json:"floor_number" db:"floor_number"`
	TowerBlock        *string      `json:"tower_block" db:"tower_block"`
	UnitType          *string      `json:"unit_type" db:"unit_type"`
	CarpetArea        *float64     `json:"carpet_area" db:"carpet_area"`
	BuiltUpArea       *float64     `json:"built_up_area" db:"built_up_area"`
	SuperBuiltUpArea  *float64     `json:"super_built_up_area" db:"super_built_up_area"`
	Facing            *string      `json:"facing" db:"facing"`
	Status            UnitStatus   `json:"status" db:"status"`
	BasePrice         *float64     `json:"base_price" db:"base_price"`
	FinalPrice        *float64     `json:"final_price" db:"final_price"`
	PricePerSqft      *float64     `json:"price_per_sqft" db:"price_per_sqft"`
	ParkingSlots      int          `json:"parking_slots" db:"parking_slots"`
	Balconies         int          `json:"balconies" db:"balconies"`
	Bathrooms         int          `json:"bathrooms" db:"bathrooms"`
	FloorPlanURL      *string      `json:"floor_plan_url" db:"floor_plan_url"`
	Features          []string     `json:"features" db:"features"`
	ReservedBy        *uuid.UUID   `json:"reserved_by" db:"reserved_by"`
	ReservedClient    *Client      `json:"reserved_client,omitempty"`
	ReservedUntil     *time.Time   `json:"reserved_until" db:"reserved_until"`
	CreatedBy         uuid.UUID    `json:"created_by" db:"created_by"`
	CreatedAt         time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at" db:"updated_at"`
}

// UnitStatus represents the status of a unit
type UnitStatus string

const (
	UnitStatusAvailable UnitStatus = "available"
	UnitStatusReserved  UnitStatus = "reserved"
	UnitStatusSold      UnitStatus = "sold"
	UnitStatusBlocked   UnitStatus = "blocked"
)

// CustomFields represents flexible key-value data
type CustomFields map[string]interface{}

// Sale represents a property sale transaction
type Sale struct {
	ID               uuid.UUID   `json:"id" db:"id"`
	SaleNumber       string      `json:"sale_number" db:"sale_number"`
	ClientID         uuid.UUID   `json:"client_id" db:"client_id"`
	Client           *Client     `json:"client,omitempty"`
	InventoryID      uuid.UUID   `json:"inventory_id" db:"inventory_id"`
	Inventory        *Inventory  `json:"inventory,omitempty"`
	SalespersonID    *uuid.UUID  `json:"salesperson_id" db:"salesperson_id"`
	Salesperson      *User       `json:"salesperson,omitempty"`
	ManagerID        *uuid.UUID  `json:"manager_id" db:"manager_id"`
	Manager          *User       `json:"manager,omitempty"`
	SaleDate         time.Time   `json:"sale_date" db:"sale_date"`
	Status           SaleStatus  `json:"status" db:"status"`
	TotalAmount      float64     `json:"total_amount" db:"total_amount"`
	DiscountAmount   float64     `json:"discount_amount" db:"discount_amount"`
	FinalAmount      float64     `json:"final_amount" db:"final_amount"`
	BookingAmount    *float64    `json:"booking_amount" db:"booking_amount"`
	PaymentPlan      CustomFields `json:"payment_plan" db:"payment_plan"`
	CommissionRate   *float64    `json:"commission_rate" db:"commission_rate"`
	CommissionAmount *float64    `json:"commission_amount" db:"commission_amount"`
	AgreementDate    *time.Time  `json:"agreement_date" db:"agreement_date"`
	PossessionDate   *time.Time  `json:"possession_date" db:"possession_date"`
	RegistrationDate *time.Time  `json:"registration_date" db:"registration_date"`
	Notes            *string     `json:"notes" db:"notes"`
	Documents        []string    `json:"documents" db:"documents"`
	CreatedBy        uuid.UUID   `json:"created_by" db:"created_by"`
	CreatedAt        time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at" db:"updated_at"`
}

// SaleStatus represents the status of a sale
type SaleStatus string

const (
	SaleStatusDraft     SaleStatus = "draft"
	SaleStatusPending   SaleStatus = "pending"
	SaleStatusApproved  SaleStatus = "approved"
	SaleStatusCompleted SaleStatus = "completed"
	SaleStatusCancelled SaleStatus = "cancelled"
)
