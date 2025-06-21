#!/bin/bash

# GoReal Platform - Supabase Setup Script
# This script sets up the local Supabase development environment

set -e

echo "🚀 Setting up Supabase for GoReal Platform..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to project root
cd "$(dirname "$0")/.."

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Copy our custom config
echo "⚙️  Applying custom Supabase configuration..."
cp supabase/config.toml supabase/config.toml.backup 2>/dev/null || true

# Start Supabase local development
echo "🔄 Starting Supabase local development environment..."
supabase start

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
supabase db reset

# Generate TypeScript types
echo "🔧 Generating TypeScript types..."
supabase gen types typescript --local > client/src/lib/database.types.ts

# Get the local Supabase URLs and keys
echo "📋 Getting local Supabase configuration..."
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')

# Create .env.local file for the client
echo "📝 Creating environment files..."
cat > client/.env.local << EOF
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Local Go Backend
NEXT_PUBLIC_GO_API_URL=http://localhost:8080

# Ethereum Configuration (for local development)
NEXT_PUBLIC_ETHEREUM_NETWORK=localhost
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key
NEXTAUTH_URL=http://localhost:3000
EOF

# Create .env file for the backend
cat > backend/.env << EOF
# Server Configuration
PORT=8080
ENVIRONMENT=development
SERVICE_NAME=goreal-backend

# Database Configuration (Supabase Local)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# JWT Configuration
JWT_SECRET=your-local-jwt-secret-key
JWT_EXPIRATION_HOURS=24

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_RPM=1000
RATE_LIMIT_BURST=100

# Observability
JAEGER_ENDPOINT=http://localhost:14268/api/traces
LOG_LEVEL=debug

# File Storage
STORAGE_BUCKET=goreal-storage
MAX_FILE_SIZE=52428800

# External APIs (for local development)
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
EOF

echo "✅ Environment files created successfully!"

# Display the Supabase status
echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "📊 Supabase Status:"
supabase status

echo ""
echo "🔗 Important URLs:"
echo "   Supabase Studio: http://localhost:54323"
echo "   API URL: $SUPABASE_URL"
echo "   Inbucket (Email testing): http://localhost:54324"
echo ""
echo "🔑 Keys (saved to .env files):"
echo "   Anon Key: $SUPABASE_ANON_KEY"
echo "   Service Role Key: $SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the Go backend: cd backend && make run"
echo "   2. Start the Next.js frontend: cd client && npm run dev"
echo "   3. Open Supabase Studio to manage your database"
echo ""
echo "📚 Documentation:"
echo "   - Supabase Docs: https://supabase.com/docs"
echo "   - Local Development: https://supabase.com/docs/guides/cli/local-development"
echo ""

# Optional: Seed the database with sample data
read -p "🌱 Would you like to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database with sample data..."
    if [ -f "supabase/seed.sql" ]; then
        supabase db reset --with-seed
        echo "✅ Database seeded successfully!"
    else
        echo "⚠️  No seed file found. Skipping seeding."
    fi
fi

echo "🎉 Setup complete! Happy coding!"
