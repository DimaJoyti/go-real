package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Service interfaces define the business logic operations
// These follow the Clean Architecture application layer pattern

// AuthService handles authentication and authorization
type AuthService interface {
	Login(ctx context.Context, email, password string) (*AuthResponse, error)
	Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error)
	Logout(ctx context.Context, userID uuid.UUID) error
	ValidateToken(ctx context.Context, token string) (*User, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error
	ResetPassword(ctx context.Context, email string) error
	ConfirmPasswordReset(ctx context.Context, token, newPassword string) error
}

// UserService handles user management operations
type UserService interface {
	Create(ctx context.Context, req *CreateUserRequest) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateUserRequest) (*User, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters UserFilters) ([]*User, error)
	Count(ctx context.Context, filters UserFilters) (int, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, req *UpdateProfileRequest) (*User, error)
	UploadAvatar(ctx context.Context, id uuid.UUID, fileData []byte, fileName string) (*User, error)
}

// LeadService handles lead management operations
type LeadService interface {
	Create(ctx context.Context, req *CreateLeadRequest) (*Lead, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Lead, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateLeadRequest) (*Lead, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters LeadFilters) ([]*Lead, error)
	Count(ctx context.Context, filters LeadFilters) (int, error)
	AssignToUser(ctx context.Context, leadID, userID uuid.UUID) error
	ConvertToClient(ctx context.Context, leadID uuid.UUID, req *ConvertLeadRequest) (*Client, error)
	UpdateScore(ctx context.Context, leadID uuid.UUID, score int) error
	ScheduleFollowUp(ctx context.Context, leadID uuid.UUID, req *ScheduleFollowUpRequest) (*FollowUp, error)
	GetOverdueFollowUps(ctx context.Context) ([]*Lead, error)
	BulkAssign(ctx context.Context, leadIDs []uuid.UUID, userID uuid.UUID) error
	ImportLeads(ctx context.Context, req *ImportLeadsRequest) (*ImportResult, error)
}

// ClientService handles client management operations
type ClientService interface {
	Create(ctx context.Context, req *CreateClientRequest) (*Client, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Client, error)
	GetByEmail(ctx context.Context, email string) (*Client, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateClientRequest) (*Client, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters ClientFilters) ([]*Client, error)
	Count(ctx context.Context, filters ClientFilters) (int, error)
	VerifyClient(ctx context.Context, id uuid.UUID) error
	VerifyKYC(ctx context.Context, clientID uuid.UUID, documents []string) error
	UpdateCreditLimit(ctx context.Context, clientID uuid.UUID, limit float64) error
	GetClientHistory(ctx context.Context, clientID uuid.UUID) (*ClientHistory, error)
}

// PropertyService handles property and inventory management
type PropertyService interface {
	// Society operations
	CreateSociety(ctx context.Context, req *CreateSocietyRequest) (*Society, error)
	GetSociety(ctx context.Context, id uuid.UUID) (*Society, error)
	UpdateSociety(ctx context.Context, id uuid.UUID, req *UpdateSocietyRequest) (*Society, error)
	ListSocieties(ctx context.Context, filters SocietyFilters) ([]*Society, error)
	
	// Project operations
	CreateProject(ctx context.Context, req *CreateProjectRequest) (*Project, error)
	GetProject(ctx context.Context, id uuid.UUID) (*Project, error)
	UpdateProject(ctx context.Context, id uuid.UUID, req *UpdateProjectRequest) (*Project, error)
	ListProjects(ctx context.Context, filters ProjectFilters) ([]*Project, error)
	GetProjectsBySociety(ctx context.Context, societyID uuid.UUID) ([]*Project, error)
	
	// Inventory operations
	CreateInventory(ctx context.Context, req *CreateInventoryRequest) (*Inventory, error)
	GetInventory(ctx context.Context, id uuid.UUID) (*Inventory, error)
	UpdateInventory(ctx context.Context, id uuid.UUID, req *UpdateInventoryRequest) (*Inventory, error)
	ListInventory(ctx context.Context, filters InventoryFilters) ([]*Inventory, error)
	GetAvailableUnits(ctx context.Context, projectID uuid.UUID) ([]*Inventory, error)
	ReserveUnit(ctx context.Context, unitID, clientID uuid.UUID, duration time.Duration) error
	ReleaseUnit(ctx context.Context, unitID uuid.UUID) error
	
	// Property search and filtering
	SearchProperties(ctx context.Context, req *PropertySearchRequest) ([]*Inventory, error)
	GetPropertyRecommendations(ctx context.Context, clientID uuid.UUID) ([]*Inventory, error)
}

// SalesService handles sales operations
type SalesService interface {
	Create(ctx context.Context, req *CreateSaleRequest) (*Sale, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Sale, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateSaleRequest) (*Sale, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters SaleFilters) ([]*Sale, error)
	ApproveSale(ctx context.Context, saleID uuid.UUID, approverID uuid.UUID) error
	CompleteSale(ctx context.Context, saleID uuid.UUID) error
	CancelSale(ctx context.Context, saleID uuid.UUID, reason string) error
	GetSalesStats(ctx context.Context, filters SaleFilters) (*SalesStats, error)
	GenerateAgreement(ctx context.Context, saleID uuid.UUID) ([]byte, error)
	CreatePaymentSchedule(ctx context.Context, saleID uuid.UUID, req *CreatePaymentScheduleRequest) ([]*PaymentSchedule, error)
	CalculateCommission(ctx context.Context, saleID uuid.UUID) ([]*Commission, error)
}

// TaskService handles task management operations
type TaskService interface {
	Create(ctx context.Context, req *CreateTaskRequest) (*Task, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Task, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateTaskRequest) (*Task, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters TaskFilters) ([]*Task, error)
	GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*Task, error)
	CompleteTask(ctx context.Context, taskID uuid.UUID, notes string) error
	GetOverdueTasks(ctx context.Context) ([]*Task, error)
	GetTasksByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Task, error)
	BulkAssign(ctx context.Context, taskIDs []uuid.UUID, userID uuid.UUID) error
}

// FinancialService handles financial operations
type FinancialService interface {
	// Cashbook operations
	CreateTransaction(ctx context.Context, req *CreateTransactionRequest) (*Cashbook, error)
	GetTransaction(ctx context.Context, id uuid.UUID) (*Cashbook, error)
	UpdateTransaction(ctx context.Context, id uuid.UUID, req *UpdateTransactionRequest) (*Cashbook, error)
	ListTransactions(ctx context.Context, filters CashbookFilters) ([]*Cashbook, error)
	GetFinancialSummary(ctx context.Context, filters CashbookFilters) (*FinancialSummary, error)
	
	// Voucher operations
	CreateVoucher(ctx context.Context, req *CreateVoucherRequest) (*Voucher, error)
	GetVoucher(ctx context.Context, id uuid.UUID) (*Voucher, error)
	ApproveVoucher(ctx context.Context, voucherID, approverID uuid.UUID, notes string) error
	RejectVoucher(ctx context.Context, voucherID, approverID uuid.UUID, reason string) error
	ListVouchers(ctx context.Context, filters VoucherFilters) ([]*Voucher, error)
	GetPendingApprovals(ctx context.Context, approverID uuid.UUID) ([]*Voucher, error)
	
	// Refund operations
	CreateRefund(ctx context.Context, req *CreateRefundRequest) (*Refund, error)
	GetRefund(ctx context.Context, id uuid.UUID) (*Refund, error)
	ApproveRefund(ctx context.Context, refundID, approverID uuid.UUID) error
	RejectRefund(ctx context.Context, refundID, approverID uuid.UUID, reason string) error
	ListRefunds(ctx context.Context, filters RefundFilters) ([]*Refund, error)
	
	// Payment operations
	RecordPayment(ctx context.Context, scheduleID uuid.UUID, req *RecordPaymentRequest) error
	GetOverduePayments(ctx context.Context) ([]*PaymentSchedule, error)
	SendPaymentReminders(ctx context.Context) error
	
	// Commission operations
	CalculateCommissions(ctx context.Context, saleID uuid.UUID) ([]*Commission, error)
	PayCommission(ctx context.Context, commissionID uuid.UUID, req *PayCommissionRequest) error
	GetCommissionReport(ctx context.Context, filters CommissionFilters) (*CommissionReport, error)
}

// NFTService handles NFT and blockchain operations
type NFTService interface {
	// NFT operations
	CreateNFT(ctx context.Context, req *CreateNFTRequest) (*RealEstateNFT, error)
	GetNFT(ctx context.Context, id uuid.UUID) (*RealEstateNFT, error)
	GetNFTByTokenID(ctx context.Context, tokenID int64) (*RealEstateNFT, error)
	UpdateNFT(ctx context.Context, id uuid.UUID, req *UpdateNFTRequest) (*RealEstateNFT, error)
	ListNFTs(ctx context.Context, filters NFTFilters) ([]*RealEstateNFT, error)
	TokenizeProperty(ctx context.Context, propertyID uuid.UUID, req *TokenizePropertyRequest) (*RealEstateNFT, error)
	
	// Marketplace operations
	CreateListing(ctx context.Context, req *CreateListingRequest) (*NFTListing, error)
	GetListing(ctx context.Context, id uuid.UUID) (*NFTListing, error)
	UpdateListing(ctx context.Context, id uuid.UUID, req *UpdateListingRequest) (*NFTListing, error)
	CancelListing(ctx context.Context, id uuid.UUID) error
	ListActiveListings(ctx context.Context, filters ListingFilters) ([]*NFTListing, error)
	PurchaseNFT(ctx context.Context, listingID uuid.UUID, req *PurchaseNFTRequest) (*BlockchainTransaction, error)
	
	// Blockchain operations
	GetTransaction(ctx context.Context, hash string) (*BlockchainTransaction, error)
	ListTransactions(ctx context.Context, filters BlockchainTransactionFilters) ([]*BlockchainTransaction, error)
	ProcessPendingTransactions(ctx context.Context) error
	GetMarketplaceStats(ctx context.Context) (*MarketplaceStats, error)
	GetUserPortfolio(ctx context.Context, userID uuid.UUID) (*UserPortfolio, error)
}

// ChallengeService handles challenge operations
type ChallengeService interface {
	Create(ctx context.Context, req *CreateChallengeRequest) (*Challenge, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Challenge, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateChallengeRequest) (*Challenge, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters ChallengeFilters) ([]*Challenge, error)
	Join(ctx context.Context, challengeID, userID uuid.UUID) error
	Leave(ctx context.Context, challengeID, userID uuid.UUID) error
	SubmitEntry(ctx context.Context, challengeID, userID uuid.UUID, req *SubmitEntryRequest) error
	GetParticipants(ctx context.Context, challengeID uuid.UUID) ([]*User, error)
	GetSubmissions(ctx context.Context, challengeID uuid.UUID) ([]*ChallengeSubmission, error)
	EvaluateSubmissions(ctx context.Context, challengeID uuid.UUID) error
	DistributeRewards(ctx context.Context, challengeID uuid.UUID) error
}

// FilmService handles film operations
type FilmService interface {
	Create(ctx context.Context, req *CreateFilmRequest) (*Film, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Film, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateFilmRequest) (*Film, error)
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters FilmFilters) ([]*Film, error)
	IncrementViews(ctx context.Context, id uuid.UUID) error
	LikeFilm(ctx context.Context, filmID, userID uuid.UUID) error
	UnlikeFilm(ctx context.Context, filmID, userID uuid.UUID) error
	AddComment(ctx context.Context, filmID, userID uuid.UUID, content string) (*FilmComment, error)
	GetComments(ctx context.Context, filmID uuid.UUID) ([]*FilmComment, error)
	UploadVideo(ctx context.Context, filmID uuid.UUID, videoData []byte, fileName string) (*Film, error)
}

// NotificationService handles notification operations
type NotificationService interface {
	Create(ctx context.Context, req *CreateNotificationRequest) (*Notification, error)
	GetByUser(ctx context.Context, userID uuid.UUID) ([]*Notification, error)
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error)
	SendBulkNotification(ctx context.Context, req *BulkNotificationRequest) error
	SendEmailNotification(ctx context.Context, req *EmailNotificationRequest) error
	SendPushNotification(ctx context.Context, req *PushNotificationRequest) error
}

// AnalyticsService handles analytics and reporting
type AnalyticsService interface {
	GetDashboardStats(ctx context.Context, userID uuid.UUID) (*DashboardStats, error)
	GetSalesAnalytics(ctx context.Context, filters SaleFilters) (*SalesAnalytics, error)
	GetLeadAnalytics(ctx context.Context, filters LeadFilters) (*LeadAnalytics, error)
	GetPropertyAnalytics(ctx context.Context, filters InventoryFilters) (*PropertyAnalytics, error)
	GetFinancialAnalytics(ctx context.Context, filters CashbookFilters) (*FinancialAnalytics, error)
	GetUserPerformance(ctx context.Context, userID uuid.UUID, period string) (*UserPerformance, error)
	GenerateReport(ctx context.Context, req *GenerateReportRequest) ([]byte, error)
	ExportData(ctx context.Context, req *ExportDataRequest) ([]byte, error)
}
