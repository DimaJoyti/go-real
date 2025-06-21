-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'creator', 'admin', 'super_admin');
CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE reward_type AS ENUM ('nft', 'token', 'points', 'badge');
CREATE TYPE film_status AS ENUM ('draft', 'processing', 'published', 'archived');
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'industrial', 'land', 'mixed_use');
CREATE TYPE property_status AS ENUM ('draft', 'listed', 'sold', 'archived');
CREATE TYPE participation_status AS ENUM ('joined', 'submitted', 'completed', 'withdrawn');
CREATE TYPE notification_type AS ENUM ('challenge', 'film', 'property', 'system');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    wallet_address TEXT,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    reward_amount DECIMAL(10,2),
    reward_type reward_type DEFAULT 'points',
    status challenge_status DEFAULT 'draft',
    rules TEXT[],
    tags TEXT[],
    image_url TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participation table
CREATE TABLE challenge_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status participation_status DEFAULT 'joined',
    score INTEGER,
    submission_url TEXT,
    submission_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- Films table
CREATE TABLE films (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER NOT NULL, -- in seconds
    genre TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    status film_status DEFAULT 'draft',
    is_public BOOLEAN DEFAULT true,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Film likes table
CREATE TABLE film_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(film_id, user_id)
);

-- Film comments table
CREATE TABLE film_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES film_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    property_type property_type NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    token_id INTEGER,
    contract_address TEXT,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status property_status DEFAULT 'draft',
    images TEXT[],
    documents TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property shares table (for fractional ownership)
CREATE TABLE property_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shares INTEGER NOT NULL,
    total_shares INTEGER NOT NULL,
    purchase_price DECIMAL(15,2),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User follows table (for social features)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX idx_challenges_creator_id ON challenges(creator_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_tags ON challenges USING GIN(tags);
CREATE INDEX idx_challenge_participations_challenge_id ON challenge_participations(challenge_id);
CREATE INDEX idx_challenge_participations_user_id ON challenge_participations(user_id);
CREATE INDEX idx_films_creator_id ON films(creator_id);
CREATE INDEX idx_films_status ON films(status);
CREATE INDEX idx_films_genre ON films USING GIN(genre);
CREATE INDEX idx_films_challenge_id ON films(challenge_id);
CREATE INDEX idx_film_likes_film_id ON film_likes(film_id);
CREATE INDEX idx_film_likes_user_id ON film_likes(user_id);
CREATE INDEX idx_film_comments_film_id ON film_comments(film_id);
CREATE INDEX idx_properties_creator_id ON properties(creator_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_property_shares_property_id ON property_shares(property_id);
CREATE INDEX idx_property_shares_owner_id ON property_shares(owner_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
