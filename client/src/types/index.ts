// Authentication Types
export interface User {
  id: string
  email: string
  username: string
  full_name: string
  role: UserRole
  avatar_url?: string
  bio?: string
  wallet_address?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export enum UserRole {
  CLIENT = 'client',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
  full_name: string
  role?: UserRole
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ConfirmPasswordResetRequest {
  token: string
  new_password: string
}

export interface AuthError {
  message: string
  code?: string
  details?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  tokens: {
    access_token: string | null
    refresh_token: string | null
    expires_at: number | null
  }
}

// Challenge Types
export interface Challenge {
  id: string
  title: string
  description: string
  image_url?: string
  creator_id: string
  creator: User
  category: ChallengeCategory
  difficulty: ChallengeDifficulty
  reward_amount?: number
  reward_currency?: string
  start_date: string
  end_date: string
  max_participants?: number
  current_participants: number
  status: ChallengeStatus
  rules: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export enum ChallengeCategory {
  FITNESS = 'fitness',
  CREATIVE = 'creative',
  EDUCATIONAL = 'educational',
  SOCIAL = 'social',
  ENVIRONMENTAL = 'environmental',
  TECH = 'tech',
}

export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export enum ChallengeStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Film Types
export interface Film {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url?: string
  duration: number
  creator_id: string
  creator: User
  category: FilmCategory
  tags: string[]
  views: number
  likes: number
  is_public: boolean
  challenge_id?: string
  challenge?: Challenge
  created_at: string
  updated_at: string
}

export enum FilmCategory {
  DOCUMENTARY = 'documentary',
  FICTION = 'fiction',
  ANIMATION = 'animation',
  EXPERIMENTAL = 'experimental',
  MUSIC_VIDEO = 'music_video',
  COMMERCIAL = 'commercial',
}

// NFT Types
export interface RealEstateNFT {
  id: string
  token_id: number
  contract_address: string
  name: string
  description: string
  image_url: string
  metadata_uri: string
  property_address: string
  property_type: PropertyType
  total_value: number
  token_supply: number
  price_per_token: number
  currency: string
  owner_address: string
  creator_id: string
  creator: User
  is_listed: boolean
  royalty_percentage: number
  attributes: NFTAttribute[]
  created_at: string
  updated_at: string
}

export interface NFTAttribute {
  trait_type: string
  value: string | number
  display_type?: string
}

export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  LAND = 'land',
  MIXED_USE = 'mixed_use',
}

// Marketplace Types
export interface Listing {
  id: string
  nft_id: string
  nft: RealEstateNFT
  seller_address: string
  price: number
  currency: string
  quantity: number
  status: ListingStatus
  expires_at?: string
  created_at: string
  updated_at: string
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// Transaction Types
export interface Transaction {
  id: string
  type: TransactionType
  from_address: string
  to_address: string
  nft_id?: string
  amount: number
  currency: string
  tx_hash: string
  block_number: number
  status: TransactionStatus
  created_at: string
}

export enum TransactionType {
  MINT = 'mint',
  TRANSFER = 'transfer',
  SALE = 'sale',
  LISTING = 'listing',
  DELISTING = 'delisting',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface CreateChallengeForm {
  title: string
  description: string
  category: ChallengeCategory
  difficulty: ChallengeDifficulty
  start_date: string
  end_date: string
  max_participants?: number
  reward_amount?: number
  reward_currency?: string
  rules: string[]
  tags: string[]
  image?: File
}

export interface CreateFilmForm {
  title: string
  description: string
  category: FilmCategory
  tags: string[]
  is_public: boolean
  challenge_id?: string
  video: File
  thumbnail?: File
}

export interface CreateNFTForm {
  name: string
  description: string
  property_address: string
  property_type: PropertyType
  total_value: number
  token_supply: number
  price_per_token: number
  currency: string
  royalty_percentage: number
  attributes: NFTAttribute[]
  image: File
}
