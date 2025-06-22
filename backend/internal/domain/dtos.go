package domain

import (
	"time"

	"github.com/google/uuid"
)

// Data Transfer Objects (DTOs) for API requests and responses

// Auth DTOs
type AuthResponse struct {
	User         *User  `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type RegisterRequest struct {
	Email    string   `json:"email" validate:"required,email"`
	Password string   `json:"password" validate:"required,min=8"`
	Username string   `json:"username" validate:"required,min=3"`
	FullName string   `json:"full_name" validate:"required"`
	Role     UserRole `json:"role" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type ResetPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ConfirmPasswordResetRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// User DTOs
type CreateUserRequest struct {
	Email    string   `json:"email" validate:"required,email"`
	Username string   `json:"username" validate:"required,min=3"`
	FullName string   `json:"full_name" validate:"required"`
	Role     UserRole `json:"role" validate:"required"`
	Bio      *string  `json:"bio"`
}

type UpdateUserRequest struct {
	Username      *string `json:"username"`
	FullName      *string `json:"full_name"`
	Bio           *string `json:"bio"`
	AvatarURL     *string `json:"avatar_url"`
	WalletAddress *string `json:"wallet_address"`
	IsActive      *bool   `json:"is_active"`
}

type UpdateProfileRequest struct {
	FullName  *string `json:"full_name"`
	Bio       *string `json:"bio"`
	AvatarURL *string `json:"avatar_url"`
}

// Lead DTOs
type CreateLeadRequest struct {
	Name         string     `json:"name" validate:"required"`
	Email        *string    `json:"email" validate:"omitempty,email"`
	Phone        *string    `json:"phone"`
	CompanyName  *string    `json:"company_name"`
	Designation  *string    `json:"designation"`
	Source       LeadSource `json:"source" validate:"required"`
	AssignedTo   *uuid.UUID `json:"assigned_to"`
	BudgetMin    *float64   `json:"budget_min"`
	BudgetMax    *float64   `json:"budget_max"`
	Requirements *string    `json:"requirements"`
	Notes        *string    `json:"notes"`
	Tags         []string   `json:"tags"`
}

type UpdateLeadRequest struct {
	Name            *string     `json:"name"`
	Email           *string     `json:"email" validate:"omitempty,email"`
	Phone           *string     `json:"phone"`
	CompanyName     *string     `json:"company_name"`
	Designation     *string     `json:"designation"`
	Source          *LeadSource `json:"source"`
	Status          *LeadStatus `json:"status"`
	AssignedTo      *uuid.UUID  `json:"assigned_to"`
	BudgetMin       *float64    `json:"budget_min"`
	BudgetMax       *float64    `json:"budget_max"`
	Requirements    *string     `json:"requirements"`
	Notes           *string     `json:"notes"`
	LastContactDate *time.Time  `json:"last_contact_date"`
	NextFollowUp    *time.Time  `json:"next_follow_up"`
	Score           *int        `json:"score"`
	Tags            []string    `json:"tags"`
}

type ConvertLeadRequest struct {
	ClientType      ClientType   `json:"client_type" validate:"required"`
	Address         *Address     `json:"address"`
	DateOfBirth     *time.Time   `json:"date_of_birth"`
	AnniversaryDate *time.Time   `json:"anniversary_date"`
	EmergencyContact *Contact    `json:"emergency_contact"`
}

type ScheduleFollowUpRequest struct {
	FollowUpDate time.Time `json:"follow_up_date" validate:"required"`
	FollowUpType string    `json:"follow_up_type" validate:"required"`
	Notes        *string   `json:"notes"`
}

type ImportLeadsRequest struct {
	Data []CreateLeadRequest `json:"data" validate:"required"`
}

type ImportResult struct {
	TotalRecords    int      `json:"total_records"`
	SuccessfulImports int    `json:"successful_imports"`
	FailedImports   int      `json:"failed_imports"`
	Errors          []string `json:"errors"`
}

// Client DTOs
type CreateClientRequest struct {
	Name             string     `json:"name" validate:"required"`
	Email            *string    `json:"email" validate:"omitempty,email"`
	Phone            *string    `json:"phone"`
	AlternatePhone   *string    `json:"alternate_phone"`
	ClientType       ClientType `json:"client_type" validate:"required"`
	CompanyID        *uuid.UUID `json:"company_id"`
	Address          *Address   `json:"address"`
	DateOfBirth      *time.Time `json:"date_of_birth"`
	AnniversaryDate  *time.Time `json:"anniversary_date"`
	EmergencyContact *Contact   `json:"emergency_contact"`
	AssignedTo       *uuid.UUID `json:"assigned_to"`
	Tags             []string   `json:"tags"`
}

type UpdateClientRequest struct {
	Name             *string     `json:"name"`
	Email            *string     `json:"email" validate:"omitempty,email"`
	Phone            *string     `json:"phone"`
	AlternatePhone   *string     `json:"alternate_phone"`
	ClientType       *ClientType `json:"client_type"`
	CompanyID        *uuid.UUID  `json:"company_id"`
	Address          *Address    `json:"address"`
	DateOfBirth      *time.Time  `json:"date_of_birth"`
	AnniversaryDate  *time.Time  `json:"anniversary_date"`
	EmergencyContact *Contact    `json:"emergency_contact"`
	AssignedTo       *uuid.UUID  `json:"assigned_to"`
	CreditLimit      *float64    `json:"credit_limit"`
	Tags             []string    `json:"tags"`
}

type ClientHistory struct {
	Client      *Client     `json:"client"`
	Sales       []*Sale     `json:"sales"`
	Tasks       []*Task     `json:"tasks"`
	FollowUps   []*FollowUp `json:"follow_ups"`
	TotalValue  float64     `json:"total_value"`
	LastContact *time.Time  `json:"last_contact"`
}

// Property DTOs
type CreateSocietyRequest struct {
	Name          string   `json:"name" validate:"required"`
	DeveloperName *string  `json:"developer_name"`
	Location      string   `json:"location" validate:"required"`
	Address       *Address `json:"address"`
	TotalArea     *float64 `json:"total_area"`
	TotalUnits    *int     `json:"total_units"`
	Amenities     []string `json:"amenities"`
	Description   *string  `json:"description"`
	Images        []string `json:"images"`
	BrochureURL   *string  `json:"brochure_url"`
}

type UpdateSocietyRequest struct {
	Name          *string  `json:"name"`
	DeveloperName *string  `json:"developer_name"`
	Location      *string  `json:"location"`
	Address       *Address `json:"address"`
	TotalArea     *float64 `json:"total_area"`
	TotalUnits    *int     `json:"total_units"`
	Amenities     []string `json:"amenities"`
	Description   *string  `json:"description"`
	Images        []string `json:"images"`
	BrochureURL   *string  `json:"brochure_url"`
	IsActive      *bool    `json:"is_active"`
}

type CreateProjectRequest struct {
	SocietyID           uuid.UUID     `json:"society_id" validate:"required"`
	Name                string        `json:"name" validate:"required"`
	ProjectType         *string       `json:"project_type"`
	Status              ProjectStatus `json:"status"`
	StartDate           *time.Time    `json:"start_date"`
	ExpectedCompletion  *time.Time    `json:"expected_completion"`
	TotalUnits          *int          `json:"total_units"`
	BasePrice           *float64      `json:"base_price"`
	PricePerSqft        *float64      `json:"price_per_sqft"`
	Description         *string       `json:"description"`
	Specifications      *string       `json:"specifications"`
	FloorPlans          []string      `json:"floor_plans"`
	Images              []string      `json:"images"`
	Videos              []string      `json:"videos"`
	BrochureURL         *string       `json:"brochure_url"`
	RERANumber          *string       `json:"rera_number"`
	Amenities           []string      `json:"amenities"`
}

type UpdateProjectRequest struct {
	Name                *string        `json:"name"`
	ProjectType         *string        `json:"project_type"`
	Status              *ProjectStatus `json:"status"`
	StartDate           *time.Time     `json:"start_date"`
	ExpectedCompletion  *time.Time     `json:"expected_completion"`
	ActualCompletion    *time.Time     `json:"actual_completion"`
	TotalUnits          *int           `json:"total_units"`
	AvailableUnits      *int           `json:"available_units"`
	BasePrice           *float64       `json:"base_price"`
	PricePerSqft        *float64       `json:"price_per_sqft"`
	Description         *string        `json:"description"`
	Specifications      *string        `json:"specifications"`
	FloorPlans          []string       `json:"floor_plans"`
	Images              []string       `json:"images"`
	Videos              []string       `json:"videos"`
	BrochureURL         *string        `json:"brochure_url"`
	RERANumber          *string        `json:"rera_number"`
	Amenities           []string       `json:"amenities"`
}

type CreateInventoryRequest struct {
	ProjectID         uuid.UUID `json:"project_id" validate:"required"`
	UnitNumber        string    `json:"unit_number" validate:"required"`
	FloorNumber       *int      `json:"floor_number"`
	TowerBlock        *string   `json:"tower_block"`
	UnitType          *string   `json:"unit_type"`
	CarpetArea        *float64  `json:"carpet_area"`
	BuiltUpArea       *float64  `json:"built_up_area"`
	SuperBuiltUpArea  *float64  `json:"super_built_up_area"`
	Facing            *string   `json:"facing"`
	BasePrice         *float64  `json:"base_price"`
	FinalPrice        *float64  `json:"final_price"`
	PricePerSqft      *float64  `json:"price_per_sqft"`
	ParkingSlots      int       `json:"parking_slots"`
	Balconies         int       `json:"balconies"`
	Bathrooms         int       `json:"bathrooms"`
	FloorPlanURL      *string   `json:"floor_plan_url"`
	Features          []string  `json:"features"`
}

type UpdateInventoryRequest struct {
	UnitNumber        *string     `json:"unit_number"`
	FloorNumber       *int        `json:"floor_number"`
	TowerBlock        *string     `json:"tower_block"`
	UnitType          *string     `json:"unit_type"`
	CarpetArea        *float64    `json:"carpet_area"`
	BuiltUpArea       *float64    `json:"built_up_area"`
	SuperBuiltUpArea  *float64    `json:"super_built_up_area"`
	Facing            *string     `json:"facing"`
	Status            *UnitStatus `json:"status"`
	BasePrice         *float64    `json:"base_price"`
	FinalPrice        *float64    `json:"final_price"`
	PricePerSqft      *float64    `json:"price_per_sqft"`
	ParkingSlots      *int        `json:"parking_slots"`
	Balconies         *int        `json:"balconies"`
	Bathrooms         *int        `json:"bathrooms"`
	FloorPlanURL      *string     `json:"floor_plan_url"`
	Features          []string    `json:"features"`
}

type PropertySearchRequest struct {
	Location         *string     `json:"location"`
	ProjectType      *string     `json:"project_type"`
	UnitType         *string     `json:"unit_type"`
	PriceMin         *float64    `json:"price_min"`
	PriceMax         *float64    `json:"price_max"`
	AreaMin          *float64    `json:"area_min"`
	AreaMax          *float64    `json:"area_max"`
	Amenities        []string    `json:"amenities"`
	Status           *UnitStatus `json:"status"`
	Facing           *string     `json:"facing"`
	ParkingRequired  *bool       `json:"parking_required"`
	Limit            int         `json:"limit"`
	Offset           int         `json:"offset"`
}

// Sale DTOs
type CreateSaleRequest struct {
	ClientID         uuid.UUID    `json:"client_id" validate:"required"`
	InventoryID      uuid.UUID    `json:"inventory_id" validate:"required"`
	SalespersonID    *uuid.UUID   `json:"salesperson_id"`
	ManagerID        *uuid.UUID   `json:"manager_id"`
	TotalAmount      float64      `json:"total_amount" validate:"required,gt=0"`
	DiscountAmount   float64      `json:"discount_amount"`
	BookingAmount    *float64     `json:"booking_amount"`
	PaymentPlan      CustomFields `json:"payment_plan"`
	CommissionRate   *float64     `json:"commission_rate"`
	Notes            *string      `json:"notes"`
}

type UpdateSaleRequest struct {
	Status           *SaleStatus  `json:"status"`
	TotalAmount      *float64     `json:"total_amount"`
	DiscountAmount   *float64     `json:"discount_amount"`
	FinalAmount      *float64     `json:"final_amount"`
	BookingAmount    *float64     `json:"booking_amount"`
	PaymentPlan      CustomFields `json:"payment_plan"`
	CommissionRate   *float64     `json:"commission_rate"`
	AgreementDate    *time.Time   `json:"agreement_date"`
	PossessionDate   *time.Time   `json:"possession_date"`
	RegistrationDate *time.Time   `json:"registration_date"`
	Notes            *string      `json:"notes"`
	Documents        []string     `json:"documents"`
}

type CreatePaymentScheduleRequest struct {
	Installments []PaymentInstallment `json:"installments" validate:"required"`
}

type PaymentInstallment struct {
	InstallmentNumber int     `json:"installment_number" validate:"required"`
	DueDate           time.Time `json:"due_date" validate:"required"`
	Amount            float64 `json:"amount" validate:"required,gt=0"`
	Description       *string `json:"description"`
}

// Notification DTOs
type CreateNotificationRequest struct {
	UserID  uuid.UUID              `json:"user_id" validate:"required"`
	Type    string                 `json:"type" validate:"required"`
	Title   string                 `json:"title" validate:"required"`
	Message string                 `json:"message" validate:"required"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

type BulkNotificationRequest struct {
	UserIDs []uuid.UUID            `json:"user_ids" validate:"required"`
	Type    string                 `json:"type" validate:"required"`
	Title   string                 `json:"title" validate:"required"`
	Message string                 `json:"message" validate:"required"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

type EmailNotificationRequest struct {
	To      []string               `json:"to" validate:"required"`
	Subject string                 `json:"subject" validate:"required"`
	Body    string                 `json:"body" validate:"required"`
	IsHTML  bool                   `json:"is_html"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

type PushNotificationRequest struct {
	UserIDs []uuid.UUID            `json:"user_ids" validate:"required"`
	Title   string                 `json:"title" validate:"required"`
	Body    string                 `json:"body" validate:"required"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Badge   *int                   `json:"badge,omitempty"`
	Sound   *string                `json:"sound,omitempty"`
}

// Task DTOs
type CreateTaskRequest struct {
	Title        string     `json:"title" validate:"required"`
	Description  *string    `json:"description"`
	AssignedTo   *uuid.UUID `json:"assigned_to"`
	DueDate      *time.Time `json:"due_date"`
	Priority     *string    `json:"priority"`
	Status       *string    `json:"status"`
	RelatedType  *string    `json:"related_type"`
	RelatedID    *uuid.UUID `json:"related_id"`
	Tags         []string   `json:"tags"`
}

type UpdateTaskRequest struct {
	Title        *string    `json:"title"`
	Description  *string    `json:"description"`
	AssignedTo   *uuid.UUID `json:"assigned_to"`
	DueDate      *time.Time `json:"due_date"`
	Priority     *string    `json:"priority"`
	Status       *string    `json:"status"`
	CompletedAt  *time.Time `json:"completed_at"`
	Notes        *string    `json:"notes"`
	Tags         []string   `json:"tags"`
}

// Financial DTOs
type CreateTransactionRequest struct {
	Type        string     `json:"type" validate:"required"`
	Amount      float64    `json:"amount" validate:"required"`
	Description *string    `json:"description"`
	Category    *string    `json:"category"`
	Reference   *string    `json:"reference"`
	Date        *time.Time `json:"date"`
	RelatedType *string    `json:"related_type"`
	RelatedID   *uuid.UUID `json:"related_id"`
}

type UpdateTransactionRequest struct {
	Type        *string    `json:"type"`
	Amount      *float64   `json:"amount"`
	Description *string    `json:"description"`
	Category    *string    `json:"category"`
	Reference   *string    `json:"reference"`
	Date        *time.Time `json:"date"`
	Status      *string    `json:"status"`
}

type CreateVoucherRequest struct {
	Type        string     `json:"type" validate:"required"`
	Amount      float64    `json:"amount" validate:"required"`
	Description string     `json:"description" validate:"required"`
	RequestedBy uuid.UUID  `json:"requested_by" validate:"required"`
	ApproverID  *uuid.UUID `json:"approver_id"`
	DueDate     *time.Time `json:"due_date"`
	Reference   *string    `json:"reference"`
	Documents   []string   `json:"documents"`
}

type CreateRefundRequest struct {
	SaleID      uuid.UUID `json:"sale_id" validate:"required"`
	Amount      float64   `json:"amount" validate:"required"`
	Reason      string    `json:"reason" validate:"required"`
	RequestedBy uuid.UUID `json:"requested_by" validate:"required"`
	ApproverID  *uuid.UUID `json:"approver_id"`
	Documents   []string  `json:"documents"`
}

type RecordPaymentRequest struct {
	Amount        float64    `json:"amount" validate:"required"`
	PaymentMethod string     `json:"payment_method" validate:"required"`
	PaymentDate   *time.Time `json:"payment_date"`
	Reference     *string    `json:"reference"`
	Notes         *string    `json:"notes"`
}

type PayCommissionRequest struct {
	Amount        float64    `json:"amount" validate:"required"`
	PaymentMethod string     `json:"payment_method" validate:"required"`
	PaymentDate   *time.Time `json:"payment_date"`
	Reference     *string    `json:"reference"`
	Notes         *string    `json:"notes"`
}

// Commission DTOs
type CommissionReport struct {
	UserID          uuid.UUID `json:"user_id"`
	UserName        string    `json:"user_name"`
	TotalSales      float64   `json:"total_sales"`
	TotalCommission float64   `json:"total_commission"`
	PaidCommission  float64   `json:"paid_commission"`
	PendingCommission float64 `json:"pending_commission"`
	SalesCount      int       `json:"sales_count"`
	Period          string    `json:"period"`
}

// NFT DTOs
type CreateNFTRequest struct {
	Name        string   `json:"name" validate:"required"`
	Description string   `json:"description" validate:"required"`
	ImageURL    string   `json:"image_url" validate:"required"`
	MetadataURL *string  `json:"metadata_url"`
	Price       *float64 `json:"price"`
	Royalty     *float64 `json:"royalty"`
	Category    *string  `json:"category"`
	Tags        []string `json:"tags"`
}

type UpdateNFTRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	ImageURL    *string  `json:"image_url"`
	MetadataURL *string  `json:"metadata_url"`
	Price       *float64 `json:"price"`
	Royalty     *float64 `json:"royalty"`
	Category    *string  `json:"category"`
	Tags        []string `json:"tags"`
	IsActive    *bool    `json:"is_active"`
}

type TokenizePropertyRequest struct {
	PropertyID    uuid.UUID `json:"property_id" validate:"required"`
	TotalShares   int       `json:"total_shares" validate:"required"`
	PricePerShare float64   `json:"price_per_share" validate:"required"`
	MinInvestment *float64  `json:"min_investment"`
	MaxInvestment *float64  `json:"max_investment"`
	YieldRate     *float64  `json:"yield_rate"`
	LockPeriod    *int      `json:"lock_period"`
}

type CreateListingRequest struct {
	NFTID       uuid.UUID `json:"nft_id" validate:"required"`
	Price       float64   `json:"price" validate:"required"`
	Currency    string    `json:"currency" validate:"required"`
	Duration    *int      `json:"duration"`
	IsAuction   bool      `json:"is_auction"`
	ReservePrice *float64 `json:"reserve_price"`
}

type UpdateListingRequest struct {
	Price        *float64 `json:"price"`
	Currency     *string  `json:"currency"`
	Duration     *int     `json:"duration"`
	IsAuction    *bool    `json:"is_auction"`
	ReservePrice *float64 `json:"reserve_price"`
	Status       *string  `json:"status"`
}

type PurchaseNFTRequest struct {
	ListingID uuid.UUID `json:"listing_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required"`
	BidAmount *float64  `json:"bid_amount"`
}

// Challenge DTOs
type CreateChallengeRequest struct {
	Title       string     `json:"title" validate:"required"`
	Description string     `json:"description" validate:"required"`
	Rules       string     `json:"rules" validate:"required"`
	StartDate   time.Time  `json:"start_date" validate:"required"`
	EndDate     time.Time  `json:"end_date" validate:"required"`
	PrizePool   float64    `json:"prize_pool" validate:"required"`
	MaxEntries  *int       `json:"max_entries"`
	Category    *string    `json:"category"`
	Difficulty  *string    `json:"difficulty"`
	Tags        []string   `json:"tags"`
}

type UpdateChallengeRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Rules       *string    `json:"rules"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	PrizePool   *float64   `json:"prize_pool"`
	MaxEntries  *int       `json:"max_entries"`
	Category    *string    `json:"category"`
	Difficulty  *string    `json:"difficulty"`
	Status      *string    `json:"status"`
	Tags        []string   `json:"tags"`
}

type SubmitEntryRequest struct {
	ChallengeID uuid.UUID `json:"challenge_id" validate:"required"`
	Title       string    `json:"title" validate:"required"`
	Description *string   `json:"description"`
	ContentURL  string    `json:"content_url" validate:"required"`
	ContentType string    `json:"content_type" validate:"required"`
	Tags        []string  `json:"tags"`
}

// Film DTOs
type CreateFilmRequest struct {
	Title       string    `json:"title" validate:"required"`
	Description string    `json:"description" validate:"required"`
	VideoURL    string    `json:"video_url" validate:"required"`
	ThumbnailURL *string  `json:"thumbnail_url"`
	Duration    *int      `json:"duration"`
	Genre       *string   `json:"genre"`
	Tags        []string  `json:"tags"`
	IsPublic    bool      `json:"is_public"`
}

type UpdateFilmRequest struct {
	Title        *string  `json:"title"`
	Description  *string  `json:"description"`
	VideoURL     *string  `json:"video_url"`
	ThumbnailURL *string  `json:"thumbnail_url"`
	Duration     *int     `json:"duration"`
	Genre        *string  `json:"genre"`
	Tags         []string `json:"tags"`
	IsPublic     *bool    `json:"is_public"`
	Status       *string  `json:"status"`
}

// Additional missing types
type ChallengeSubmission struct {
	ID          uuid.UUID  `json:"id"`
	ChallengeID uuid.UUID  `json:"challenge_id"`
	UserID      uuid.UUID  `json:"user_id"`
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	ContentURL  string     `json:"content_url"`
	ContentType string     `json:"content_type"`
	Tags        []string   `json:"tags"`
	Score       *float64   `json:"score"`
	Rank        *int       `json:"rank"`
	Status      string     `json:"status"`
	SubmittedAt time.Time  `json:"submitted_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type FilmComment struct {
	ID        uuid.UUID  `json:"id"`
	FilmID    uuid.UUID  `json:"film_id"`
	UserID    uuid.UUID  `json:"user_id"`
	Content   string     `json:"content"`
	ParentID  *uuid.UUID `json:"parent_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
