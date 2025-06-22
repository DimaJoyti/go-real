package domain

import (
	"time"

	"github.com/google/uuid"
)

// RealEstateNFT represents a tokenized real estate property
type RealEstateNFT struct {
	ID                uuid.UUID    `json:"id" db:"id"`
	PropertyID        *uuid.UUID   `json:"property_id" db:"property_id"`
	Property          *Inventory   `json:"property,omitempty"`
	TokenID           int64        `json:"token_id" db:"token_id"`
	ContractAddress   string       `json:"contract_address" db:"contract_address"`
	Name              string       `json:"name" db:"name"`
	Description       *string      `json:"description" db:"description"`
	ImageURL          *string      `json:"image_url" db:"image_url"`
	MetadataURI       *string      `json:"metadata_uri" db:"metadata_uri"`
	PropertyAddress   *string      `json:"property_address" db:"property_address"`
	PropertyType      PropertyType `json:"property_type" db:"property_type"`
	TotalValue        *float64     `json:"total_value" db:"total_value"`
	TokenSupply       *int         `json:"token_supply" db:"token_supply"`
	PricePerToken     *float64     `json:"price_per_token" db:"price_per_token"`
	Currency          string       `json:"currency" db:"currency"`
	OwnerAddress      *string      `json:"owner_address" db:"owner_address"`
	CreatorID         *uuid.UUID   `json:"creator_id" db:"creator_id"`
	Creator           *User        `json:"creator,omitempty"`
	IsListed          bool         `json:"is_listed" db:"is_listed"`
	RoyaltyPercentage *float64     `json:"royalty_percentage" db:"royalty_percentage"`
	Attributes        CustomFields `json:"attributes" db:"attributes"`
	CreatedAt         time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at" db:"updated_at"`
}

// NFTListing represents a marketplace listing for an NFT
type NFTListing struct {
	ID            uuid.UUID     `json:"id" db:"id"`
	NFTID         uuid.UUID     `json:"nft_id" db:"nft_id"`
	NFT           *RealEstateNFT `json:"nft,omitempty"`
	SellerAddress string        `json:"seller_address" db:"seller_address"`
	Price         float64       `json:"price" db:"price"`
	Currency      string        `json:"currency" db:"currency"`
	Quantity      int           `json:"quantity" db:"quantity"`
	Status        ListingStatus `json:"status" db:"status"`
	ExpiresAt     *time.Time    `json:"expires_at" db:"expires_at"`
	CreatedAt     time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at" db:"updated_at"`
}

// ListingStatus represents the status of an NFT listing
type ListingStatus string

const (
	ListingStatusActive    ListingStatus = "active"
	ListingStatusSold      ListingStatus = "sold"
	ListingStatusCancelled ListingStatus = "cancelled"
	ListingStatusExpired   ListingStatus = "expired"
)

// BlockchainTransaction represents a blockchain transaction
type BlockchainTransaction struct {
	ID              uuid.UUID `json:"id" db:"id"`
	TransactionHash string    `json:"transaction_hash" db:"transaction_hash"`
	BlockNumber     *int64    `json:"block_number" db:"block_number"`
	FromAddress     string    `json:"from_address" db:"from_address"`
	ToAddress       string    `json:"to_address" db:"to_address"`
	Value           *float64  `json:"value" db:"value"`
	GasUsed         *int64    `json:"gas_used" db:"gas_used"`
	GasPrice        *float64  `json:"gas_price" db:"gas_price"`
	TransactionType string    `json:"transaction_type" db:"transaction_type"`
	RelatedTable    *string   `json:"related_table" db:"related_table"`
	RelatedID       *uuid.UUID `json:"related_id" db:"related_id"`
	Status          TransactionStatus `json:"status" db:"status"`
	ConfirmedAt     *time.Time `json:"confirmed_at" db:"confirmed_at"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// TransactionStatus represents the status of a blockchain transaction
type TransactionStatus string

const (
	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusConfirmed TransactionStatus = "confirmed"
	TransactionStatusFailed    TransactionStatus = "failed"
)

// NFTMetadata represents the metadata structure for NFTs
type NFTMetadata struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Image       string                 `json:"image"`
	ExternalURL string                 `json:"external_url,omitempty"`
	Attributes  []NFTAttribute         `json:"attributes"`
	Properties  map[string]interface{} `json:"properties,omitempty"`
}

// NFTAttribute represents an attribute of an NFT
type NFTAttribute struct {
	TraitType   string      `json:"trait_type"`
	Value       interface{} `json:"value"`
	DisplayType string      `json:"display_type,omitempty"`
}

// PropertyShare represents fractional ownership of a property
type PropertyShare struct {
	ID            uuid.UUID     `json:"id" db:"id"`
	PropertyID    uuid.UUID     `json:"property_id" db:"property_id"`
	Property      *RealEstateNFT `json:"property,omitempty"`
	OwnerID       uuid.UUID     `json:"owner_id" db:"owner_id"`
	Owner         *User         `json:"owner,omitempty"`
	Shares        int           `json:"shares" db:"shares"`
	TotalShares   int           `json:"total_shares" db:"total_shares"`
	PurchasePrice *float64      `json:"purchase_price" db:"purchase_price"`
	PurchaseDate  time.Time     `json:"purchase_date" db:"purchase_date"`
	CreatedAt     time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at" db:"updated_at"`
}

// Wallet represents a user's cryptocurrency wallet
type Wallet struct {
	ID            uuid.UUID `json:"id" db:"id"`
	UserID        uuid.UUID `json:"user_id" db:"user_id"`
	User          *User     `json:"user,omitempty"`
	Address       string    `json:"address" db:"address"`
	WalletType    string    `json:"wallet_type" db:"wallet_type"` // metamask, walletconnect, etc.
	IsActive      bool      `json:"is_active" db:"is_active"`
	IsVerified    bool      `json:"is_verified" db:"is_verified"`
	LastUsed      *time.Time `json:"last_used" db:"last_used"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// TokenBalance represents the balance of tokens for a user
type TokenBalance struct {
	ID            uuid.UUID `json:"id" db:"id"`
	UserID        uuid.UUID `json:"user_id" db:"user_id"`
	User          *User     `json:"user,omitempty"`
	TokenAddress  string    `json:"token_address" db:"token_address"`
	TokenSymbol   string    `json:"token_symbol" db:"token_symbol"`
	TokenName     string    `json:"token_name" db:"token_name"`
	Balance       float64   `json:"balance" db:"balance"`
	Decimals      int       `json:"decimals" db:"decimals"`
	LastUpdated   time.Time `json:"last_updated" db:"last_updated"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// SmartContract represents a deployed smart contract
type SmartContract struct {
	ID              uuid.UUID `json:"id" db:"id"`
	Name            string    `json:"name" db:"name"`
	Description     *string   `json:"description" db:"description"`
	ContractAddress string    `json:"contract_address" db:"contract_address"`
	Network         string    `json:"network" db:"network"`
	ContractType    string    `json:"contract_type" db:"contract_type"` // ERC721, ERC1155, etc.
	ABI             string    `json:"abi" db:"abi"`
	Bytecode        *string   `json:"bytecode" db:"bytecode"`
	DeployedBy      uuid.UUID `json:"deployed_by" db:"deployed_by"`
	DeployedAt      time.Time `json:"deployed_at" db:"deployed_at"`
	IsActive        bool      `json:"is_active" db:"is_active"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// ContractEvent represents an event emitted by a smart contract
type ContractEvent struct {
	ID              uuid.UUID `json:"id" db:"id"`
	ContractAddress string    `json:"contract_address" db:"contract_address"`
	EventName       string    `json:"event_name" db:"event_name"`
	EventData       CustomFields `json:"event_data" db:"event_data"`
	TransactionHash string    `json:"transaction_hash" db:"transaction_hash"`
	BlockNumber     int64     `json:"block_number" db:"block_number"`
	LogIndex        int       `json:"log_index" db:"log_index"`
	Processed       bool      `json:"processed" db:"processed"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// IPFSFile represents a file stored on IPFS
type IPFSFile struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Hash        string    `json:"hash" db:"hash"`
	FileName    string    `json:"file_name" db:"file_name"`
	FileSize    int64     `json:"file_size" db:"file_size"`
	ContentType string    `json:"content_type" db:"content_type"`
	UploadedBy  uuid.UUID `json:"uploaded_by" db:"uploaded_by"`
	RelatedTo   *string   `json:"related_to" db:"related_to"`
	RelatedID   *uuid.UUID `json:"related_id" db:"related_id"`
	IsPublic    bool      `json:"is_public" db:"is_public"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// MarketplaceStats represents marketplace statistics
type MarketplaceStats struct {
	TotalListings     int     `json:"total_listings"`
	ActiveListings    int     `json:"active_listings"`
	TotalSales        int     `json:"total_sales"`
	TotalVolume       float64 `json:"total_volume"`
	AveragePrice      float64 `json:"average_price"`
	FloorPrice        float64 `json:"floor_price"`
	TopSale           float64 `json:"top_sale"`
	UniqueOwners      int     `json:"unique_owners"`
	TotalProperties   int     `json:"total_properties"`
	TokenizedValue    float64 `json:"tokenized_value"`
}

// UserPortfolio represents a user's NFT portfolio
type UserPortfolio struct {
	UserID           uuid.UUID `json:"user_id"`
	TotalNFTs        int       `json:"total_nfts"`
	TotalValue       float64   `json:"total_value"`
	TotalShares      int       `json:"total_shares"`
	Properties       []RealEstateNFT `json:"properties"`
	RecentActivity   []BlockchainTransaction `json:"recent_activity"`
	PortfolioChange  float64   `json:"portfolio_change"`
	LastUpdated      time.Time `json:"last_updated"`
}
