# GoReal Platform

A comprehensive platform combining social challenges, short films, and real estate NFT tokenization built with Next.js 14+, Go backend, and Supabase.

## 🎯 Overview

GoReal Platform is a modern, full-stack application that brings together three powerful features:
- **Social Challenges** - Community-driven challenges with NFT rewards
- **Short Films** - Professional video platform for creators
- **Real Estate NFTs** - Tokenized property investment platform

Built with cutting-edge technologies and designed for scalability, security, and exceptional user experience.

## 🚀 Features

### ✅ User Management System
- **Complete Authentication** - Email/password and OAuth (GitHub, Google)
- **Rich User Profiles** - Avatar upload, bio, social stats, achievements
- **Wallet Integration** - Multi-wallet support (MetaMask, WalletConnect)
- **Social Features** - Follow/unfollow, activity feeds, user statistics
- **Achievement System** - Progress tracking and milestone rewards

### ✅ Social Challenges Platform
- **Challenge Creation** - Rich form with media upload, rules, and rewards
- **Advanced Discovery** - Search, filtering by status/type/tags, trending
- **Participation System** - Join challenges, track progress, leaderboards
- **Reward Integration** - NFT, token, points, and badge rewards
- **Social Engagement** - Comments, likes, sharing, creator profiles

### ✅ Short Films Platform
- **Professional Upload** - Drag-and-drop with video preview and validation
- **Advanced Video Player** - Custom controls, fullscreen, speed control
- **Content Discovery** - Genre filtering, search, trending algorithms
- **Social Features** - Likes, comments, bookmarks, creator following
- **Challenge Integration** - Submit films to challenges, contest entries

### 🚧 Real Estate NFTs (Coming Soon)
- **Property Tokenization** - Convert real estate into tradeable NFTs
- **Fractional Ownership** - Buy and sell property shares
- **Analytics Dashboard** - Property performance and market insights
- **Marketplace** - Trade property tokens with built-in escrow

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** with App Router and TypeScript
- **Tailwind CSS** + **Shadcn/ui** for modern UI components
- **React Hook Form** + **Zod** for form validation
- **Wagmi** for Ethereum wallet integration
- **Supabase Client** for real-time data

### Backend
- **Go** with standard library net/http and ServeMux
- **Clean Architecture** with dependency injection
- **OpenTelemetry** for distributed tracing
- **JWT** authentication with Supabase integration

### Database & Storage
- **Supabase** (PostgreSQL) with Row Level Security
- **Real-time subscriptions** for live updates
- **Supabase Storage** for media files (videos, images)
- **Database functions** for complex queries

### Blockchain & Web3
- **Ethereum** smart contracts with OpenZeppelin
- **Multi-wallet support** (MetaMask, WalletConnect, Injected)
- **NFT rewards** and tokenization system
- **Secure wallet connection** with signature verification


## 📁 Project Structure

```
goreal-platform/
├── client/                 # Next.js 14+ Frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static assets
│   └── package.json
├── backend/               # Go Backend
│   ├── cmd/              # Application entrypoints
│   ├── internal/         # Private application code
│   │   ├── api/          # HTTP handlers
│   │   ├── domain/       # Business logic and models
│   │   ├── services/     # Business services
│   │   └── config/       # Configuration
│   ├── pkg/              # Public packages
│   └── go.mod
├── contracts/            # Ethereum Smart Contracts
│   ├── src/              # Solidity contracts
│   ├── test/             # Contract tests
│   └── package.json
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Go** 1.21+
- **Supabase** account
- **Ethereum wallet** (for Web3 features)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/goreal-platform.git
cd goreal-platform
```

### 2. Frontend Setup (Next.js)
```bash
cd client
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

### 3. Backend Setup (Go)
```bash
cd backend
go mod download
cp .env.example .env
# Configure your environment variables
go run cmd/server/main.go
```

### 4. Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
PORT=8080
```

### 5. Database Setup (Supabase)
1. Create a new Supabase project
2. Run the SQL migrations in `docs/database/`
3. Enable Row Level Security policies
4. Configure storage buckets for file uploads

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Challenge Endpoints
- `GET /api/challenges` - List challenges with filters
- `POST /api/challenges` - Create new challenge
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges/:id/join` - Join challenge
- `POST /api/challenges/:id/submit` - Submit to challenge

### Film Endpoints
- `GET /api/films` - List films with filters
- `POST /api/films` - Upload new film
- `GET /api/films/:id` - Get film details
- `POST /api/films/:id/like` - Like/unlike film
- `POST /api/films/:id/comments` - Add comment

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics
- `POST /api/users/:id/follow` - Follow/unfollow user

## 🎯 Key Features Implemented

### User Management
- ✅ OAuth authentication (GitHub, Google)
- ✅ Profile management with avatar upload
- ✅ Wallet integration (MetaMask, WalletConnect)
- ✅ Social features (follow, activity feeds)
- ✅ Achievement system with progress tracking

### Social Challenges
- ✅ Rich challenge creation with media upload
- ✅ Advanced filtering and search
- ✅ Real-time participation tracking
- ✅ Multiple reward types (NFT, tokens, points)
- ✅ Social engagement (comments, likes)

### Short Films Platform
- ✅ Professional video upload with preview
- ✅ Custom video player with full controls
- ✅ Genre-based discovery and filtering
- ✅ Social interactions (likes, comments, bookmarks)
- ✅ Creator profiles and following system

## 🔧 Development

### Running Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests
cd backend && go test ./...

# E2E tests
npm run test:e2e
```

### Building for Production
```bash
# Frontend build
cd client && npm run build

# Backend build
cd backend && go build -o bin/server cmd/server/main.go
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend-as-a-service platform
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries

---

**GoReal Platform** - Bringing together social challenges, creative content, and real estate innovation. 🚀



