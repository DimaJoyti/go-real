package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Repository interfaces following the Repository pattern
// These interfaces define the contract for data access operations

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters UserFilters) ([]*User, error)
	Count(ctx context.Context, filters UserFilters) (int, error)
}

// LeadRepository defines the interface for lead data operations
type LeadRepository interface {
	Create(ctx context.Context, lead *Lead) error
	GetByID(ctx context.Context, id uuid.UUID) (*Lead, error)
	Update(ctx context.Context, lead *Lead) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters LeadFilters) ([]*Lead, error)
	Count(ctx context.Context, filters LeadFilters) (int, error)
	GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*Lead, error)
	GetOverdueFollowUps(ctx context.Context) ([]*Lead, error)
}

// ClientRepository defines the interface for client data operations
type ClientRepository interface {
	Create(ctx context.Context, client *Client) error
	GetByID(ctx context.Context, id uuid.UUID) (*Client, error)
	GetByEmail(ctx context.Context, email string) (*Client, error)
	Update(ctx context.Context, client *Client) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters ClientFilters) ([]*Client, error)
	Count(ctx context.Context, filters ClientFilters) (int, error)
	GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*Client, error)
}

// CompanyRepository defines the interface for company data operations
type CompanyRepository interface {
	Create(ctx context.Context, company *Company) error
	GetByID(ctx context.Context, id uuid.UUID) (*Company, error)
	GetByName(ctx context.Context, name string) (*Company, error)
	Update(ctx context.Context, company *Company) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters CompanyFilters) ([]*Company, error)
	Count(ctx context.Context, filters CompanyFilters) (int, error)
}

// SocietyRepository defines the interface for society data operations
type SocietyRepository interface {
	Create(ctx context.Context, society *Society) error
	GetByID(ctx context.Context, id uuid.UUID) (*Society, error)
	Update(ctx context.Context, society *Society) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters SocietyFilters) ([]*Society, error)
	Count(ctx context.Context, filters SocietyFilters) (int, error)
}

// ProjectRepository defines the interface for project data operations
type ProjectRepository interface {
	Create(ctx context.Context, project *Project) error
	GetByID(ctx context.Context, id uuid.UUID) (*Project, error)
	GetBySociety(ctx context.Context, societyID uuid.UUID) ([]*Project, error)
	Update(ctx context.Context, project *Project) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters ProjectFilters) ([]*Project, error)
	Count(ctx context.Context, filters ProjectFilters) (int, error)
}

// InventoryRepository defines the interface for inventory data operations
type InventoryRepository interface {
	Create(ctx context.Context, inventory *Inventory) error
	GetByID(ctx context.Context, id uuid.UUID) (*Inventory, error)
	GetByProject(ctx context.Context, projectID uuid.UUID) ([]*Inventory, error)
	Update(ctx context.Context, inventory *Inventory) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters InventoryFilters) ([]*Inventory, error)
	Count(ctx context.Context, filters InventoryFilters) (int, error)
	GetAvailable(ctx context.Context, projectID uuid.UUID) ([]*Inventory, error)
	Reserve(ctx context.Context, id uuid.UUID, clientID uuid.UUID, until time.Time) error
	Release(ctx context.Context, id uuid.UUID) error
}

// SaleRepository defines the interface for sale data operations
type SaleRepository interface {
	Create(ctx context.Context, sale *Sale) error
	GetByID(ctx context.Context, id uuid.UUID) (*Sale, error)
	GetByClient(ctx context.Context, clientID uuid.UUID) ([]*Sale, error)
	GetBySalesperson(ctx context.Context, salespersonID uuid.UUID) ([]*Sale, error)
	Update(ctx context.Context, sale *Sale) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters SaleFilters) ([]*Sale, error)
	Count(ctx context.Context, filters SaleFilters) (int, error)
	GetSalesStats(ctx context.Context, filters SaleFilters) (*SalesStats, error)
}

// TaskRepository defines the interface for task data operations
type TaskRepository interface {
	Create(ctx context.Context, task *Task) error
	GetByID(ctx context.Context, id uuid.UUID) (*Task, error)
	GetByAssignedUser(ctx context.Context, userID uuid.UUID) ([]*Task, error)
	Update(ctx context.Context, task *Task) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters TaskFilters) ([]*Task, error)
	Count(ctx context.Context, filters TaskFilters) (int, error)
	GetOverdueTasks(ctx context.Context) ([]*Task, error)
	GetTasksByRelatedEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Task, error)
}

// FollowUpRepository defines the interface for follow-up data operations
type FollowUpRepository interface {
	Create(ctx context.Context, followUp *FollowUp) error
	GetByID(ctx context.Context, id uuid.UUID) (*FollowUp, error)
	GetByLead(ctx context.Context, leadID uuid.UUID) ([]*FollowUp, error)
	GetByClient(ctx context.Context, clientID uuid.UUID) ([]*FollowUp, error)
	Update(ctx context.Context, followUp *FollowUp) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters FollowUpFilters) ([]*FollowUp, error)
	GetUpcoming(ctx context.Context, userID uuid.UUID) ([]*FollowUp, error)
}

// CashbookRepository defines the interface for financial transaction operations
type CashbookRepository interface {
	Create(ctx context.Context, transaction *Cashbook) error
	GetByID(ctx context.Context, id uuid.UUID) (*Cashbook, error)
	Update(ctx context.Context, transaction *Cashbook) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters CashbookFilters) ([]*Cashbook, error)
	GetFinancialSummary(ctx context.Context, filters CashbookFilters) (*FinancialSummary, error)
}

// VoucherRepository defines the interface for voucher operations
type VoucherRepository interface {
	Create(ctx context.Context, voucher *Voucher) error
	GetByID(ctx context.Context, id uuid.UUID) (*Voucher, error)
	Update(ctx context.Context, voucher *Voucher) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters VoucherFilters) ([]*Voucher, error)
	GetPendingApprovals(ctx context.Context, approverID uuid.UUID) ([]*Voucher, error)
}

// RefundRepository defines the interface for refund operations
type RefundRepository interface {
	Create(ctx context.Context, refund *Refund) error
	GetByID(ctx context.Context, id uuid.UUID) (*Refund, error)
	GetBySale(ctx context.Context, saleID uuid.UUID) ([]*Refund, error)
	Update(ctx context.Context, refund *Refund) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters RefundFilters) ([]*Refund, error)
}

// PaymentScheduleRepository defines the interface for payment schedule operations
type PaymentScheduleRepository interface {
	Create(ctx context.Context, schedule *PaymentSchedule) error
	GetByID(ctx context.Context, id uuid.UUID) (*PaymentSchedule, error)
	GetBySale(ctx context.Context, saleID uuid.UUID) ([]*PaymentSchedule, error)
	Update(ctx context.Context, schedule *PaymentSchedule) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters PaymentScheduleFilters) ([]*PaymentSchedule, error)
	GetOverduePayments(ctx context.Context) ([]*PaymentSchedule, error)
}

// CommissionRepository defines the interface for commission operations
type CommissionRepository interface {
	Create(ctx context.Context, commission *Commission) error
	GetByID(ctx context.Context, id uuid.UUID) (*Commission, error)
	GetByEmployee(ctx context.Context, employeeID uuid.UUID) ([]*Commission, error)
	GetBySale(ctx context.Context, saleID uuid.UUID) ([]*Commission, error)
	Update(ctx context.Context, commission *Commission) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters CommissionFilters) ([]*Commission, error)
}

// RealEstateNFTRepository defines the interface for NFT operations
type RealEstateNFTRepository interface {
	Create(ctx context.Context, nft *RealEstateNFT) error
	GetByID(ctx context.Context, id uuid.UUID) (*RealEstateNFT, error)
	GetByTokenID(ctx context.Context, tokenID int64) (*RealEstateNFT, error)
	GetByProperty(ctx context.Context, propertyID uuid.UUID) (*RealEstateNFT, error)
	Update(ctx context.Context, nft *RealEstateNFT) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters NFTFilters) ([]*RealEstateNFT, error)
	GetMarketplaceStats(ctx context.Context) (*MarketplaceStats, error)
}

// NFTListingRepository defines the interface for NFT listing operations
type NFTListingRepository interface {
	Create(ctx context.Context, listing *NFTListing) error
	GetByID(ctx context.Context, id uuid.UUID) (*NFTListing, error)
	GetByNFT(ctx context.Context, nftID uuid.UUID) ([]*NFTListing, error)
	GetBySeller(ctx context.Context, sellerAddress string) ([]*NFTListing, error)
	Update(ctx context.Context, listing *NFTListing) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters ListingFilters) ([]*NFTListing, error)
	GetActiveListings(ctx context.Context) ([]*NFTListing, error)
}

// BlockchainTransactionRepository defines the interface for blockchain transaction operations
type BlockchainTransactionRepository interface {
	Create(ctx context.Context, tx *BlockchainTransaction) error
	GetByID(ctx context.Context, id uuid.UUID) (*BlockchainTransaction, error)
	GetByHash(ctx context.Context, hash string) (*BlockchainTransaction, error)
	Update(ctx context.Context, tx *BlockchainTransaction) error
	List(ctx context.Context, filters BlockchainTransactionFilters) ([]*BlockchainTransaction, error)
	GetPendingTransactions(ctx context.Context) ([]*BlockchainTransaction, error)
}

// ChallengeRepository defines the interface for challenge operations
type ChallengeRepository interface {
	Create(ctx context.Context, challenge *Challenge) error
	GetByID(ctx context.Context, id uuid.UUID) (*Challenge, error)
	GetByCreator(ctx context.Context, creatorID uuid.UUID) ([]*Challenge, error)
	Update(ctx context.Context, challenge *Challenge) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters ChallengeFilters) ([]*Challenge, error)
	Count(ctx context.Context, filters ChallengeFilters) (int, error)
}

// FilmRepository defines the interface for film operations
type FilmRepository interface {
	Create(ctx context.Context, film *Film) error
	GetByID(ctx context.Context, id uuid.UUID) (*Film, error)
	GetByCreator(ctx context.Context, creatorID uuid.UUID) ([]*Film, error)
	Update(ctx context.Context, film *Film) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filters FilmFilters) ([]*Film, error)
	IncrementViews(ctx context.Context, id uuid.UUID) error
}

// NotificationRepository defines the interface for notification operations
type NotificationRepository interface {
	Create(ctx context.Context, notification *Notification) error
	GetByID(ctx context.Context, id uuid.UUID) (*Notification, error)
	GetByUser(ctx context.Context, userID uuid.UUID) ([]*Notification, error)
	Update(ctx context.Context, notification *Notification) error
	Delete(ctx context.Context, id uuid.UUID) error
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error)
}

// Additional repositories can be added here as needed
