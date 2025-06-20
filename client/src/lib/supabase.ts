import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component Supabase client
export const createSupabaseClient = () => createClientComponentClient()

// Server component Supabase client
export const createSupabaseServerClient = () => createServerComponentClient({ cookies })

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          bio: string | null
          wallet_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          wallet_address?: string | null
          updated_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string | null
          creator_id: string
          category: string
          difficulty: string
          reward_amount: number | null
          reward_currency: string | null
          start_date: string
          end_date: string
          max_participants: number | null
          current_participants: number
          status: string
          rules: string[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url?: string | null
          creator_id: string
          category: string
          difficulty: string
          reward_amount?: number | null
          reward_currency?: string | null
          start_date: string
          end_date: string
          max_participants?: number | null
          current_participants?: number
          status?: string
          rules?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          image_url?: string | null
          category?: string
          difficulty?: string
          reward_amount?: number | null
          reward_currency?: string | null
          start_date?: string
          end_date?: string
          max_participants?: number | null
          current_participants?: number
          status?: string
          rules?: string[]
          tags?: string[]
          updated_at?: string
        }
      }
      films: {
        Row: {
          id: string
          title: string
          description: string
          video_url: string
          thumbnail_url: string | null
          duration: number
          creator_id: string
          category: string
          tags: string[]
          views: number
          likes: number
          is_public: boolean
          challenge_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          video_url: string
          thumbnail_url?: string | null
          duration: number
          creator_id: string
          category: string
          tags?: string[]
          views?: number
          likes?: number
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
          category?: string
          tags?: string[]
          views?: number
          likes?: number
          is_public?: boolean
          challenge_id?: string | null
          updated_at?: string
        }
      }
      real_estate_nfts: {
        Row: {
          id: string
          token_id: number
          contract_address: string
          name: string
          description: string
          image_url: string
          metadata_uri: string
          property_address: string
          property_type: string
          total_value: number
          token_supply: number
          price_per_token: number
          currency: string
          owner_address: string
          creator_id: string
          is_listed: boolean
          royalty_percentage: number
          attributes: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token_id: number
          contract_address: string
          name: string
          description: string
          image_url: string
          metadata_uri: string
          property_address: string
          property_type: string
          total_value: number
          token_supply: number
          price_per_token: number
          currency: string
          owner_address: string
          creator_id: string
          is_listed?: boolean
          royalty_percentage: number
          attributes?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          image_url?: string
          metadata_uri?: string
          property_address?: string
          property_type?: string
          total_value?: number
          token_supply?: number
          price_per_token?: number
          currency?: string
          owner_address?: string
          is_listed?: boolean
          royalty_percentage?: number
          attributes?: any
          updated_at?: string
        }
      }
    }
  }
}
