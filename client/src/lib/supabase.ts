import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please set it in your .env.local file.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please set it in your .env.local file.')
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component Supabase client
export const createSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey)

// Database schema types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          wallet_address: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          wallet_address?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          wallet_address?: string | null
          role?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          creator_id: string
          start_date: string | null
          end_date: string | null
          reward_amount: number | null
          reward_type: string
          status: string
          rules: string[]
          tags: string[]
          image_url: string | null
          max_participants: number | null
          current_participants: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          creator_id: string
          start_date?: string | null
          end_date?: string | null
          reward_amount?: number | null
          reward_type?: string
          status?: string
          rules?: string[]
          tags?: string[]
          image_url?: string | null
          max_participants?: number | null
          current_participants?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          start_date?: string | null
          end_date?: string | null
          reward_amount?: number | null
          reward_type?: string
          status?: string
          rules?: string[]
          tags?: string[]
          image_url?: string | null
          max_participants?: number | null
          current_participants?: number
          updated_at?: string
        }
      }
      challenge_participations: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          status: string
          score: number | null
          submission_url: string | null
          submission_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          status?: string
          score?: number | null
          submission_url?: string | null
          submission_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          score?: number | null
          submission_url?: string | null
          submission_description?: string | null
          updated_at?: string
        }
      }
      films: {
        Row: {
          id: string
          title: string
          description: string
          creator_id: string
          video_url: string
          thumbnail_url: string | null
          duration: number
          genre: string[]
          rating: number
          view_count: number
          like_count: number
          status: string
          is_public: boolean
          challenge_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          creator_id: string
          video_url: string
          thumbnail_url?: string | null
          duration: number
          genre?: string[]
          rating?: number
          view_count?: number
          like_count?: number
          status?: string
          is_public?: boolean
          challenge_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          video_url?: string
          thumbnail_url?: string | null
          duration?: number
          genre?: string[]
          rating?: number
          view_count?: number
          like_count?: number
          status?: string
          is_public?: boolean
          challenge_id?: string | null
          updated_at?: string
        }
      }
      film_likes: {
        Row: {
          id: string
          film_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          film_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          film_id?: string
          user_id?: string
        }
      }
      film_comments: {
        Row: {
          id: string
          film_id: string
          user_id: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          film_id: string
          user_id: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          parent_id?: string | null
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string
          property_type: string
          total_value: number
          token_id: number | null
          contract_address: string | null
          creator_id: string
          status: string
          images: string[]
          documents: string[]
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          property_type: string
          total_value: number
          token_id?: number | null
          contract_address?: string | null
          creator_id: string
          status?: string
          images?: string[]
          documents?: string[]
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          address?: string
          property_type?: string
          total_value?: number
          token_id?: number | null
          contract_address?: string | null
          status?: string
          images?: string[]
          documents?: string[]
          metadata?: any
          updated_at?: string
        }
      }
      property_shares: {
        Row: {
          id: string
          property_id: string
          owner_id: string
          shares: number
          total_shares: number
          purchase_price: number | null
          purchase_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          owner_id: string
          shares: number
          total_shares: number
          purchase_price?: number | null
          purchase_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          shares?: number
          total_shares?: number
          purchase_price?: number | null
          purchase_date?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: any | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: any | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          type?: string
          title?: string
          message?: string
          data?: any | null
          is_read?: boolean
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
        }
      }
      film_bookmarks: {
        Row: {
          id: string
          film_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          film_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          film_id?: string
          user_id?: string
        }
      }
      film_comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          comment_id?: string
          user_id?: string
        }
      }
    }
  }
}
