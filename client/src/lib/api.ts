import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from './supabase'

type Tables = Database['public']['Tables']
type Challenge = Tables['challenges']['Row']
type Film = Tables['films']['Row']
type Property = Tables['properties']['Row']
type Profile = Tables['profiles']['Row']

export class ApiService {
  private supabase = createSupabaseClient()

  // Challenge API methods
  async getChallenges(filters?: {
    status?: string
    creator_id?: string
    tag?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('challenges')
      .select(`
        *,
        creator:profiles(id, username, full_name, avatar_url)
      `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.creator_id) {
      query = query.eq('creator_id', filters.creator_id)
    }
    if (filters?.tag) {
      query = query.contains('tags', [filters.tag])
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 20)

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return query
  }

  async getChallenge(id: string) {
    return this.supabase
      .from('challenges')
      .select(`
        *,
        creator:profiles(id, username, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()
  }

  async createChallenge(challenge: Tables['challenges']['Insert']) {
    return this.supabase
      .from('challenges')
      .insert(challenge)
      .select()
      .single()
  }

  async updateChallenge(id: string, updates: Tables['challenges']['Update']) {
    return this.supabase
      .from('challenges')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async joinChallenge(challengeId: string, userId: string) {
    return this.supabase
      .from('challenge_participations')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        status: 'joined'
      })
      .select()
      .single()
  }

  async submitToChallenge(
    challengeId: string,
    userId: string,
    submission: {
      submission_url: string
      submission_description?: string
    }
  ) {
    return this.supabase
      .from('challenge_participations')
      .update({
        ...submission,
        status: 'submitted'
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .select()
      .single()
  }

  // Film API methods
  async getFilms(filters?: {
    creator_id?: string
    status?: string
    genre?: string
    challenge_id?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('films')
      .select(`
        *,
        creator:profiles(id, username, full_name, avatar_url),
        film_likes(count),
        film_comments(count)
      `)

    if (filters?.creator_id) {
      query = query.eq('creator_id', filters.creator_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.genre) {
      query = query.contains('genre', [filters.genre])
    }
    if (filters?.challenge_id) {
      query = query.eq('challenge_id', filters.challenge_id)
    }

    query = query
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 20)

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return query
  }

  async getFilm(id: string) {
    return this.supabase
      .from('films')
      .select(`
        *,
        creator:profiles(id, username, full_name, avatar_url),
        film_likes(user_id),
        film_comments(
          id,
          content,
          created_at,
          user:profiles(id, username, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()
  }

  async createFilm(film: Tables['films']['Insert']) {
    return this.supabase
      .from('films')
      .insert(film)
      .select()
      .single()
  }

  async updateFilm(id: string, updates: Tables['films']['Update']) {
    return this.supabase
      .from('films')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async likeFilm(filmId: string, userId: string) {
    return this.supabase
      .from('film_likes')
      .insert({
        film_id: filmId,
        user_id: userId
      })
      .select()
      .single()
  }

  async unlikeFilm(filmId: string, userId: string) {
    return this.supabase
      .from('film_likes')
      .delete()
      .eq('film_id', filmId)
      .eq('user_id', userId)
  }

  async addFilmComment(comment: Tables['film_comments']['Insert']) {
    return this.supabase
      .from('film_comments')
      .insert(comment)
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url)
      `)
      .single()
  }

  async incrementFilmViews(filmId: string) {
    return this.supabase.rpc('increment_film_views', { film_id: filmId })
  }

  async getTrendingFilms(limit = 10) {
    return this.supabase.rpc('get_trending_films', { p_limit: limit })
  }

  async createFilmComment(filmId: string, data: any) {
    return this.supabase
      .from('film_comments')
      .insert({ ...data, film_id: filmId })
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url)
      `)
      .single()
  }

  async addBookmark(filmId: string, userId: string) {
    return this.supabase
      .from('film_bookmarks')
      .insert({
        film_id: filmId,
        user_id: userId
      })
      .select()
      .single()
  }

  async removeBookmark(filmId: string, userId: string) {
    return this.supabase
      .from('film_bookmarks')
      .delete()
      .eq('film_id', filmId)
      .eq('user_id', userId)
  }

  async likeFilmComment(commentId: string, userId: string) {
    return this.supabase
      .from('film_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId
      })
      .select()
      .single()
  }

  async getFilmComments(filmId: string) {
    return this.supabase
      .from('film_comments')
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url)
      `)
      .eq('film_id', filmId)
      .order('created_at', { ascending: false })
  }

  // Property API methods
  async getProperties(filters?: {
    creator_id?: string
    status?: string
    property_type?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('properties')
      .select(`
        *,
        creator:profiles(id, username, full_name, avatar_url),
        property_shares(
          id,
          shares,
          total_shares,
          owner:profiles(id, username, full_name, avatar_url)
        )
      `)

    if (filters?.creator_id) {
      query = query.eq('creator_id', filters.creator_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.property_type) {
      query = query.eq('property_type', filters.property_type)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 20)

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    return query
  }

  async getProperty(id: string) {
    return this.supabase
      .from('properties')
      .select(`
        *,
        creator:profiles(id, username, full_name, avatar_url),
        property_shares(
          id,
          shares,
          total_shares,
          purchase_price,
          purchase_date,
          owner:profiles(id, username, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()
  }

  async createProperty(property: Tables['properties']['Insert']) {
    return this.supabase
      .from('properties')
      .insert(property)
      .select()
      .single()
  }

  async updateProperty(id: string, updates: Tables['properties']['Update']) {
    return this.supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  // User API methods
  async getProfile(id: string) {
    return this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
  }

  async updateProfile(id: string, updates: Tables['profiles']['Update']) {
    return this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async followUser(followerId: string, followingId: string) {
    return this.supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      })
      .select()
      .single()
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
  }

  async getUserStats(userId: string) {
    return this.supabase.rpc('get_user_stats', { p_user_id: userId })
  }

  async getUserFeed(userId: string, limit = 20, offset = 0) {
    return this.supabase.rpc('get_user_feed', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    })
  }

  async getTrendingChallenges(limit = 10) {
    return this.supabase.rpc('get_trending_challenges', { p_limit: limit })
  }

  // Notification API methods
  async getNotifications(userId: string, limit = 20) {
    return this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
  }

  async markNotificationAsRead(id: string) {
    return this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  }
}

export const api = new ApiService()
