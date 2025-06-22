package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	// Server configuration
	Port        string
	Environment string
	ServiceName string

	// Database configuration
	SupabaseURL       string
	SupabaseKey       string
	SupabaseSecretKey string

	// JWT configuration
	JWT JWTConfig

	// Ethereum configuration
	EthereumNetwork    string
	EthereumRPCURL     string
	ContractAddress    string
	PrivateKey         string

	// CORS configuration
	CORS CORSConfig

	// Rate limiting
	RateLimit RateLimitConfig

	// Observability
	JaegerEndpoint string
	LogLevel       string

	// File storage
	StorageBucket string
	MaxFileSize   int64

	// External APIs
	IPFSGateway string
	PinataAPIKey string
	PinataSecret string
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	AccessSecret         string
	RefreshSecret        string
	AccessTokenExpiry    time.Duration
	RefreshTokenExpiry   time.Duration
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins []string
}

// RateLimitConfig holds rate limiting configuration
type RateLimitConfig struct {
	RequestsPerMinute int
	BurstSize         int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		ServiceName: getEnv("SERVICE_NAME", "goreal-backend"),

		// Database
		SupabaseURL:       getEnv("SUPABASE_URL", ""),
		SupabaseKey:       getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseSecretKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),

		// JWT
		JWT: JWTConfig{
			AccessSecret:       getEnv("JWT_ACCESS_SECRET", "your-access-secret-key"),
			RefreshSecret:      getEnv("JWT_REFRESH_SECRET", "your-refresh-secret-key"),
			AccessTokenExpiry:  time.Duration(getEnvAsInt("JWT_ACCESS_EXPIRY_MINUTES", 15)) * time.Minute,
			RefreshTokenExpiry: time.Duration(getEnvAsInt("JWT_REFRESH_EXPIRY_DAYS", 7)) * 24 * time.Hour,
		},

		// Ethereum
		EthereumNetwork: getEnv("ETHEREUM_NETWORK", "sepolia"),
		EthereumRPCURL:  getEnv("ETHEREUM_RPC_URL", ""),
		ContractAddress: getEnv("CONTRACT_ADDRESS", ""),
		PrivateKey:      getEnv("PRIVATE_KEY", ""),

		// CORS
		CORS: CORSConfig{
			AllowedOrigins: strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		},

		// Rate limiting
		RateLimit: RateLimitConfig{
			RequestsPerMinute: getEnvAsInt("RATE_LIMIT_RPM", 100),
			BurstSize:         getEnvAsInt("RATE_LIMIT_BURST", 10),
		},

		// Observability
		JaegerEndpoint: getEnv("JAEGER_ENDPOINT", "http://localhost:14268/api/traces"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),

		// File storage
		StorageBucket: getEnv("STORAGE_BUCKET", "goreal-storage"),
		MaxFileSize:   getEnvAsInt64("MAX_FILE_SIZE", 10*1024*1024), // 10MB default

		// External APIs
		IPFSGateway:  getEnv("IPFS_GATEWAY", "https://gateway.pinata.cloud/ipfs/"),
		PinataAPIKey: getEnv("PINATA_API_KEY", ""),
		PinataSecret: getEnv("PINATA_SECRET_API_KEY", ""),
	}

	return cfg, nil
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// getEnvAsInt gets an environment variable as integer with a fallback value
func getEnvAsInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return fallback
}

// getEnvAsInt64 gets an environment variable as int64 with a fallback value
func getEnvAsInt64(key string, fallback int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intVal
		}
	}
	return fallback
}
