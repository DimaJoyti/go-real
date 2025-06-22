package domain

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Value objects and business rules for the GoReal domain

// Email represents a valid email address
type Email struct {
	value string
}

// NewEmail creates a new Email value object
func NewEmail(email string) (*Email, error) {
	if email == "" {
		return nil, errors.New("email cannot be empty")
	}
	
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return nil, errors.New("invalid email format")
	}
	
	return &Email{value: strings.ToLower(email)}, nil
}

// String returns the email as a string
func (e Email) String() string {
	return e.value
}

// Value returns the email value
func (e Email) Value() string {
	return e.value
}

// PhoneNumber represents a valid phone number
type PhoneNumber struct {
	value string
}

// NewPhoneNumber creates a new PhoneNumber value object
func NewPhoneNumber(phone string) (*PhoneNumber, error) {
	if phone == "" {
		return nil, errors.New("phone number cannot be empty")
	}
	
	// Remove all non-digit characters except + at the beginning
	cleaned := regexp.MustCompile(`[^\d+]`).ReplaceAllString(phone, "")
	
	// Basic validation - should start with + and have 10-15 digits
	phoneRegex := regexp.MustCompile(`^\+?[1-9]\d{9,14}$`)
	if !phoneRegex.MatchString(cleaned) {
		return nil, errors.New("invalid phone number format")
	}
	
	return &PhoneNumber{value: cleaned}, nil
}

// String returns the phone number as a string
func (p PhoneNumber) String() string {
	return p.value
}

// Value returns the phone number value
func (p PhoneNumber) Value() string {
	return p.value
}

// Money represents a monetary value with currency
type Money struct {
	amount   float64
	currency string
}

// NewMoney creates a new Money value object
func NewMoney(amount float64, currency string) (*Money, error) {
	if amount < 0 {
		return nil, errors.New("amount cannot be negative")
	}
	
	if currency == "" {
		currency = "INR" // Default currency
	}
	
	// Validate currency code (basic validation)
	validCurrencies := map[string]bool{
		"INR": true, "USD": true, "EUR": true, "GBP": true, "ETH": true, "BTC": true,
	}
	
	if !validCurrencies[strings.ToUpper(currency)] {
		return nil, fmt.Errorf("unsupported currency: %s", currency)
	}
	
	return &Money{
		amount:   amount,
		currency: strings.ToUpper(currency),
	}, nil
}

// Amount returns the monetary amount
func (m Money) Amount() float64 {
	return m.amount
}

// Currency returns the currency code
func (m Money) Currency() string {
	return m.currency
}

// String returns a formatted string representation
func (m Money) String() string {
	return fmt.Sprintf("%.2f %s", m.amount, m.currency)
}

// Add adds another Money value (must be same currency)
func (m Money) Add(other Money) (*Money, error) {
	if m.currency != other.currency {
		return nil, errors.New("cannot add different currencies")
	}
	return NewMoney(m.amount+other.amount, m.currency)
}

// Subtract subtracts another Money value (must be same currency)
func (m Money) Subtract(other Money) (*Money, error) {
	if m.currency != other.currency {
		return nil, errors.New("cannot subtract different currencies")
	}
	if m.amount < other.amount {
		return nil, errors.New("insufficient funds")
	}
	return NewMoney(m.amount-other.amount, m.currency)
}

// Percentage represents a percentage value
type Percentage struct {
	value float64
}

// NewPercentage creates a new Percentage value object
func NewPercentage(value float64) (*Percentage, error) {
	if value < 0 || value > 100 {
		return nil, errors.New("percentage must be between 0 and 100")
	}
	return &Percentage{value: value}, nil
}

// Value returns the percentage value
func (p Percentage) Value() float64 {
	return p.value
}

// AsDecimal returns the percentage as a decimal (e.g., 25% = 0.25)
func (p Percentage) AsDecimal() float64 {
	return p.value / 100
}

// String returns a formatted string representation
func (p Percentage) String() string {
	return fmt.Sprintf("%.2f%%", p.value)
}

// Area represents an area measurement
type Area struct {
	value float64
	unit  string
}

// NewArea creates a new Area value object
func NewArea(value float64, unit string) (*Area, error) {
	if value <= 0 {
		return nil, errors.New("area must be positive")
	}
	
	validUnits := map[string]bool{
		"sqft": true, "sqm": true, "acres": true, "hectares": true,
	}
	
	unit = strings.ToLower(unit)
	if !validUnits[unit] {
		return nil, fmt.Errorf("unsupported area unit: %s", unit)
	}
	
	return &Area{value: value, unit: unit}, nil
}

// Value returns the area value
func (a Area) Value() float64 {
	return a.value
}

// Unit returns the area unit
func (a Area) Unit() string {
	return a.unit
}

// String returns a formatted string representation
func (a Area) String() string {
	return fmt.Sprintf("%.2f %s", a.value, a.unit)
}

// DateRange represents a date range with validation
type DateRange struct {
	startDate time.Time
	endDate   time.Time
}

// NewDateRange creates a new DateRange value object
func NewDateRange(start, end time.Time) (*DateRange, error) {
	if start.After(end) {
		return nil, errors.New("start date cannot be after end date")
	}
	
	return &DateRange{
		startDate: start,
		endDate:   end,
	}, nil
}

// StartDate returns the start date
func (dr DateRange) StartDate() time.Time {
	return dr.startDate
}

// EndDate returns the end date
func (dr DateRange) EndDate() time.Time {
	return dr.endDate
}

// Duration returns the duration of the date range
func (dr DateRange) Duration() time.Duration {
	return dr.endDate.Sub(dr.startDate)
}

// Contains checks if a date is within the range
func (dr DateRange) Contains(date time.Time) bool {
	return !date.Before(dr.startDate) && !date.After(dr.endDate)
}

// Overlaps checks if this range overlaps with another
func (dr DateRange) Overlaps(other DateRange) bool {
	return dr.startDate.Before(other.endDate) && dr.endDate.After(other.startDate)
}

// BusinessRules contains domain business rules
type BusinessRules struct{}

// ValidateLeadScore validates lead scoring rules
func (br BusinessRules) ValidateLeadScore(score int) error {
	if score < 0 || score > 100 {
		return errors.New("lead score must be between 0 and 100")
	}
	return nil
}

// ValidateCommissionRate validates commission rate rules
func (br BusinessRules) ValidateCommissionRate(rate float64) error {
	if rate < 0 || rate > 50 {
		return errors.New("commission rate must be between 0% and 50%")
	}
	return nil
}

// ValidateBookingAmount validates booking amount rules
func (br BusinessRules) ValidateBookingAmount(bookingAmount, totalAmount float64) error {
	if bookingAmount <= 0 {
		return errors.New("booking amount must be positive")
	}
	
	if bookingAmount > totalAmount {
		return errors.New("booking amount cannot exceed total amount")
	}
	
	// Booking amount should be at least 10% of total amount
	minBooking := totalAmount * 0.1
	if bookingAmount < minBooking {
		return fmt.Errorf("booking amount must be at least %.2f (10%% of total)", minBooking)
	}
	
	return nil
}

// ValidatePropertyPrice validates property pricing rules
func (br BusinessRules) ValidatePropertyPrice(price, pricePerSqft, area float64) error {
	if price <= 0 {
		return errors.New("property price must be positive")
	}
	
	if pricePerSqft <= 0 {
		return errors.New("price per sqft must be positive")
	}
	
	if area <= 0 {
		return errors.New("property area must be positive")
	}
	
	// Check if price matches area * price per sqft (with 5% tolerance)
	expectedPrice := area * pricePerSqft
	tolerance := expectedPrice * 0.05
	
	if price < expectedPrice-tolerance || price > expectedPrice+tolerance {
		return fmt.Errorf("price %.2f does not match area %.2f * price per sqft %.2f", price, area, pricePerSqft)
	}
	
	return nil
}

// ValidateTaskDueDate validates task due date rules
func (br BusinessRules) ValidateTaskDueDate(dueDate time.Time) error {
	now := time.Now()
	
	// Due date cannot be in the past
	if dueDate.Before(now) {
		return errors.New("due date cannot be in the past")
	}
	
	// Due date cannot be more than 1 year in the future
	maxFutureDate := now.AddDate(1, 0, 0)
	if dueDate.After(maxFutureDate) {
		return errors.New("due date cannot be more than 1 year in the future")
	}
	
	return nil
}

// ValidateNFTTokenSupply validates NFT token supply rules
func (br BusinessRules) ValidateNFTTokenSupply(supply int, propertyValue float64) error {
	if supply <= 0 {
		return errors.New("token supply must be positive")
	}
	
	if supply > 10000 {
		return errors.New("token supply cannot exceed 10,000")
	}
	
	// Minimum token value should be at least 1000 (to avoid micro-transactions)
	minTokenValue := propertyValue / float64(supply)
	if minTokenValue < 1000 {
		return errors.New("token value too small, reduce token supply or increase property value")
	}
	
	return nil
}

// ValidateRoyaltyPercentage validates NFT royalty percentage rules
func (br BusinessRules) ValidateRoyaltyPercentage(royalty float64) error {
	if royalty < 0 {
		return errors.New("royalty percentage cannot be negative")
	}
	
	if royalty > 10 {
		return errors.New("royalty percentage cannot exceed 10%")
	}
	
	return nil
}

// CanLeadBeConverted checks if a lead can be converted to client
func (br BusinessRules) CanLeadBeConverted(lead *Lead) error {
	if lead.Status != LeadStatusQualified && lead.Status != LeadStatusNegotiation {
		return errors.New("lead must be qualified or in negotiation to be converted")
	}
	
	if lead.AssignedTo == nil {
		return errors.New("lead must be assigned to someone before conversion")
	}
	
	return nil
}

// CanSaleBeApproved checks if a sale can be approved
func (br BusinessRules) CanSaleBeApproved(sale *Sale) error {
	if sale.Status != SaleStatusPending {
		return errors.New("only pending sales can be approved")
	}
	
	if sale.FinalAmount <= 0 {
		return errors.New("sale amount must be positive")
	}
	
	if sale.ClientID == uuid.Nil {
		return errors.New("sale must have a valid client")
	}
	
	if sale.InventoryID == uuid.Nil {
		return errors.New("sale must have a valid inventory item")
	}
	
	return nil
}
