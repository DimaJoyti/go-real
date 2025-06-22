package domain

import (
	"time"
	"github.com/google/uuid"
)

// AnalyticsConfig represents the analytics system configuration
type AnalyticsConfig struct {
	ID                    uuid.UUID                 `json:"id" db:"id"`
	OrganizationID        uuid.UUID                 `json:"organization_id" db:"organization_id"`
	RefreshInterval       time.Duration             `json:"refresh_interval" db:"refresh_interval"`
	DataRetentionDays     int                       `json:"data_retention_days" db:"data_retention_days"`
	EnableRealTime        bool                      `json:"enable_real_time" db:"enable_real_time"`
	EnablePredictions     bool                      `json:"enable_predictions" db:"enable_predictions"`
	EnableAlerts          bool                      `json:"enable_alerts" db:"enable_alerts"`
	DefaultDashboard      string                    `json:"default_dashboard" db:"default_dashboard"`
	AllowedExportFormats  []string                  `json:"allowed_export_formats" db:"allowed_export_formats"`
	MaxExportRows         int                       `json:"max_export_rows" db:"max_export_rows"`
	CacheSettings         AnalyticsCacheSettings    `json:"cache_settings" db:"cache_settings"`
	SecuritySettings      AnalyticsSecuritySettings `json:"security_settings" db:"security_settings"`
	IntegrationSettings   AnalyticsIntegrations     `json:"integration_settings" db:"integration_settings"`
	CustomMetrics         []CustomMetric            `json:"custom_metrics" db:"custom_metrics"`
	CreatedAt             time.Time                 `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time                 `json:"updated_at" db:"updated_at"`
}

// AnalyticsCacheSettings represents caching configuration
type AnalyticsCacheSettings struct {
	EnableCaching     bool          `json:"enable_caching"`
	CacheTTL          time.Duration `json:"cache_ttl"`
	MaxCacheSize      int64         `json:"max_cache_size"`
	CacheStrategy     string        `json:"cache_strategy"` // "lru", "lfu", "ttl"
	WarmupOnStartup   bool          `json:"warmup_on_startup"`
	CacheCompression  bool          `json:"cache_compression"`
}

// AnalyticsSecuritySettings represents security configuration
type AnalyticsSecuritySettings struct {
	RequireSSL           bool     `json:"require_ssl"`
	AllowedIPs           []string `json:"allowed_ips"`
	RateLimitPerMinute   int      `json:"rate_limit_per_minute"`
	EnableAuditLogging   bool     `json:"enable_audit_logging"`
	DataMaskingEnabled   bool     `json:"data_masking_enabled"`
	EncryptionEnabled    bool     `json:"encryption_enabled"`
	SessionTimeout       int      `json:"session_timeout"` // in minutes
}

// AnalyticsIntegrations represents external integrations
type AnalyticsIntegrations struct {
	GoogleAnalytics GoogleAnalyticsConfig `json:"google_analytics"`
	Salesforce      SalesforceConfig      `json:"salesforce"`
	HubSpot         HubSpotConfig         `json:"hubspot"`
	Slack           SlackConfig           `json:"slack"`
	Email           EmailConfig           `json:"email"`
	Webhook         WebhookConfig         `json:"webhook"`
}

// GoogleAnalyticsConfig represents Google Analytics integration
type GoogleAnalyticsConfig struct {
	Enabled       bool   `json:"enabled"`
	TrackingID    string `json:"tracking_id"`
	PropertyID    string `json:"property_id"`
	ViewID        string `json:"view_id"`
	ServiceEmail  string `json:"service_email"`
	PrivateKey    string `json:"private_key"`
	SyncInterval  int    `json:"sync_interval"` // in hours
}

// SalesforceConfig represents Salesforce integration
type SalesforceConfig struct {
	Enabled      bool   `json:"enabled"`
	InstanceURL  string `json:"instance_url"`
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	SecurityToken string `json:"security_token"`
	SyncInterval int    `json:"sync_interval"` // in hours
}

// HubSpotConfig represents HubSpot integration
type HubSpotConfig struct {
	Enabled      bool   `json:"enabled"`
	APIKey       string `json:"api_key"`
	PortalID     string `json:"portal_id"`
	SyncInterval int    `json:"sync_interval"` // in hours
}

// SlackConfig represents Slack integration for notifications
type SlackConfig struct {
	Enabled     bool   `json:"enabled"`
	WebhookURL  string `json:"webhook_url"`
	Channel     string `json:"channel"`
	Username    string `json:"username"`
	IconEmoji   string `json:"icon_emoji"`
}

// EmailConfig represents email notification configuration
type EmailConfig struct {
	Enabled    bool     `json:"enabled"`
	SMTPHost   string   `json:"smtp_host"`
	SMTPPort   int      `json:"smtp_port"`
	Username   string   `json:"username"`
	Password   string   `json:"password"`
	FromEmail  string   `json:"from_email"`
	FromName   string   `json:"from_name"`
	Recipients []string `json:"recipients"`
}

// WebhookConfig represents webhook notification configuration
type WebhookConfig struct {
	Enabled     bool              `json:"enabled"`
	URL         string            `json:"url"`
	Method      string            `json:"method"`
	Headers     map[string]string `json:"headers"`
	Secret      string            `json:"secret"`
	RetryCount  int               `json:"retry_count"`
	Timeout     int               `json:"timeout"` // in seconds
}

// CustomMetric represents a user-defined metric
type CustomMetric struct {
	ID          uuid.UUID            `json:"id"`
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Query       string               `json:"query"`
	Type        CustomMetricType     `json:"type"`
	Unit        string               `json:"unit"`
	Format      string               `json:"format"`
	Filters     []CustomMetricFilter `json:"filters"`
	Aggregation string               `json:"aggregation"` // "sum", "avg", "count", "min", "max"
	IsActive    bool                 `json:"is_active"`
	CreatedBy   uuid.UUID            `json:"created_by"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

// CustomMetricType represents the type of custom metric
type CustomMetricType string

const (
	CustomMetricTypeNumber     CustomMetricType = "number"
	CustomMetricTypePercentage CustomMetricType = "percentage"
	CustomMetricTypeCurrency   CustomMetricType = "currency"
	CustomMetricTypeRatio      CustomMetricType = "ratio"
	CustomMetricTypeCount      CustomMetricType = "count"
)

// CustomMetricFilter represents a filter for custom metrics
type CustomMetricFilter struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"` // "eq", "ne", "gt", "lt", "gte", "lte", "in", "not_in"
	Value    interface{} `json:"value"`
}

// AnalyticsAlert represents an analytics alert configuration
type AnalyticsAlert struct {
	ID          uuid.UUID           `json:"id" db:"id"`
	Name        string              `json:"name" db:"name"`
	Description string              `json:"description" db:"description"`
	MetricName  string              `json:"metric_name" db:"metric_name"`
	Condition   AlertCondition      `json:"condition" db:"condition"`
	Threshold   float64             `json:"threshold" db:"threshold"`
	Frequency   AlertFrequency      `json:"frequency" db:"frequency"`
	Recipients  []AlertRecipient    `json:"recipients" db:"recipients"`
	IsActive    bool                `json:"is_active" db:"is_active"`
	LastTriggered *time.Time        `json:"last_triggered" db:"last_triggered"`
	CreatedBy   uuid.UUID           `json:"created_by" db:"created_by"`
	CreatedAt   time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at" db:"updated_at"`
}

// AlertCondition represents the condition for triggering an alert
type AlertCondition string

const (
	AlertConditionGreaterThan    AlertCondition = "greater_than"
	AlertConditionLessThan       AlertCondition = "less_than"
	AlertConditionEquals         AlertCondition = "equals"
	AlertConditionNotEquals      AlertCondition = "not_equals"
	AlertConditionPercentChange  AlertCondition = "percent_change"
	AlertConditionAbsoluteChange AlertCondition = "absolute_change"
)

// AlertFrequency represents how often to check the alert
type AlertFrequency string

const (
	AlertFrequencyRealTime AlertFrequency = "realtime"
	AlertFrequencyHourly   AlertFrequency = "hourly"
	AlertFrequencyDaily    AlertFrequency = "daily"
	AlertFrequencyWeekly   AlertFrequency = "weekly"
	AlertFrequencyMonthly  AlertFrequency = "monthly"
)

// AlertRecipient represents who should receive the alert
type AlertRecipient struct {
	Type    AlertRecipientType `json:"type"`
	Address string             `json:"address"`
	Name    string             `json:"name"`
}

// AlertRecipientType represents the type of alert recipient
type AlertRecipientType string

const (
	AlertRecipientTypeEmail AlertRecipientType = "email"
	AlertRecipientTypeSMS   AlertRecipientType = "sms"
	AlertRecipientTypeSlack AlertRecipientType = "slack"
	AlertRecipientTypeWebhook AlertRecipientType = "webhook"
)

// AnalyticsAPIKey represents an API key for analytics access
type AnalyticsAPIKey struct {
	ID          uuid.UUID    `json:"id" db:"id"`
	Name        string       `json:"name" db:"name"`
	KeyHash     string       `json:"-" db:"key_hash"` // Never expose the actual key
	Permissions []string     `json:"permissions" db:"permissions"`
	RateLimit   int          `json:"rate_limit" db:"rate_limit"`
	ExpiresAt   *time.Time   `json:"expires_at" db:"expires_at"`
	LastUsedAt  *time.Time   `json:"last_used_at" db:"last_used_at"`
	IsActive    bool         `json:"is_active" db:"is_active"`
	CreatedBy   uuid.UUID    `json:"created_by" db:"created_by"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`
}

// AnalyticsAuditLog represents an audit log entry for analytics
type AnalyticsAuditLog struct {
	ID        uuid.UUID              `json:"id" db:"id"`
	UserID    uuid.UUID              `json:"user_id" db:"user_id"`
	Action    string                 `json:"action" db:"action"`
	Resource  string                 `json:"resource" db:"resource"`
	Details   map[string]interface{} `json:"details" db:"details"`
	IPAddress string                 `json:"ip_address" db:"ip_address"`
	UserAgent string                 `json:"user_agent" db:"user_agent"`
	Timestamp time.Time              `json:"timestamp" db:"timestamp"`
}

// DataQualityMetrics represents data quality assessment
type DataQualityMetrics struct {
	Completeness    float64                    `json:"completeness"`
	Accuracy        float64                    `json:"accuracy"`
	Consistency     float64                    `json:"consistency"`
	Timeliness      float64                    `json:"timeliness"`
	Validity        float64                    `json:"validity"`
	OverallScore    float64                    `json:"overall_score"`
	Issues          []DataQualityIssue         `json:"issues"`
	Recommendations []DataQualityRecommendation `json:"recommendations"`
	LastAssessed    time.Time                  `json:"last_assessed"`
}

// DataQualityIssue represents a data quality issue
type DataQualityIssue struct {
	Type        string    `json:"type"`
	Severity    string    `json:"severity"` // "low", "medium", "high", "critical"
	Description string    `json:"description"`
	Table       string    `json:"table"`
	Column      string    `json:"column"`
	Count       int       `json:"count"`
	Examples    []string  `json:"examples"`
	DetectedAt  time.Time `json:"detected_at"`
}

// DataQualityRecommendation represents a recommendation to improve data quality
type DataQualityRecommendation struct {
	Type        string `json:"type"`
	Priority    string `json:"priority"` // "low", "medium", "high"
	Title       string `json:"title"`
	Description string `json:"description"`
	Action      string `json:"action"`
	Impact      string `json:"impact"`
}

// AnalyticsHealth represents the health status of the analytics system
type AnalyticsHealth struct {
	Status           string                    `json:"status"` // "healthy", "degraded", "unhealthy"
	Uptime           time.Duration             `json:"uptime"`
	LastHealthCheck  time.Time                 `json:"last_health_check"`
	Components       []ComponentHealth         `json:"components"`
	Performance      AnalyticsPerformance      `json:"performance"`
	Alerts           []ActiveAlert             `json:"alerts"`
	Recommendations  []HealthRecommendation    `json:"recommendations"`
}

// ComponentHealth represents the health of a system component
type ComponentHealth struct {
	Name        string    `json:"name"`
	Status      string    `json:"status"`
	LastChecked time.Time `json:"last_checked"`
	Message     string    `json:"message"`
	Metrics     map[string]interface{} `json:"metrics"`
}

// AnalyticsPerformance represents performance metrics
type AnalyticsPerformance struct {
	QueryLatency      time.Duration `json:"query_latency"`
	ThroughputPerSec  float64       `json:"throughput_per_sec"`
	CacheHitRate      float64       `json:"cache_hit_rate"`
	ErrorRate         float64       `json:"error_rate"`
	CPUUsage          float64       `json:"cpu_usage"`
	MemoryUsage       float64       `json:"memory_usage"`
	DiskUsage         float64       `json:"disk_usage"`
	NetworkLatency    time.Duration `json:"network_latency"`
}

// ActiveAlert represents an active system alert
type ActiveAlert struct {
	ID          uuid.UUID `json:"id"`
	Type        string    `json:"type"`
	Severity    string    `json:"severity"`
	Message     string    `json:"message"`
	TriggeredAt time.Time `json:"triggered_at"`
}

// HealthRecommendation represents a system health recommendation
type HealthRecommendation struct {
	Type        string `json:"type"`
	Priority    string `json:"priority"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Action      string `json:"action"`
}
