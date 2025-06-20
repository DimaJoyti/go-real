'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Film, FilmCategory, CreateFilmForm } from '@/types'
import toast from 'react-hot-toast'

export function useFilms() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchFilms()
  }, [])

  const fetchFilms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('films')
        .select(`
          *,
          creator:users(id, username, avatar_url),
          challenge:challenges(id, title)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFilms(data || [])
    } catch (error: any) {
      console.error('Error fetching films:', error)
      toast.error('Failed to load films')
    } finally {
      setLoading(false)
    }
  }

  const uploadFilm = async (filmData: CreateFilmForm, userId: string) => {
    try {
      setLoading(true)

      // Upload video file to Supabase Storage
      const videoFile = filmData.video
      const videoFileName = `${Date.now()}-${videoFile.name}`
      
      const { data: videoUpload, error: videoError } = await supabase.storage
        .from('films')
        .upload(`videos/${videoFileName}`, videoFile)

      if (videoError) throw videoError

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('films')
        .getPublicUrl(`videos/${videoFileName}`)

      // Upload thumbnail if provided
      let thumbnailUrl = ''
      if (filmData.thumbnail) {
        const thumbnailFileName = `${Date.now()}-thumb-${filmData.thumbnail.name}`
        
        const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
          .from('films')
          .upload(`thumbnails/${thumbnailFileName}`, filmData.thumbnail)

        if (thumbnailError) throw thumbnailError

        const { data: { publicUrl } } = supabase.storage
          .from('films')
          .getPublicUrl(`thumbnails/${thumbnailFileName}`)
        
        thumbnailUrl = publicUrl
      }

      // Create film record
      const { data, error } = await supabase
        .from('films')
        .insert({
          title: filmData.title,
          description: filmData.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: 0, // Will be updated after video processing
          creator_id: userId,
          category: filmData.category,
          tags: filmData.tags,
          is_public: filmData.is_public,
          challenge_id: filmData.challenge_id,
          views: 0,
          likes: 0,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Film uploaded successfully!')
      await fetchFilms()
      return { data, error: null }
    } catch (error: any) {
      console.error('Error uploading film:', error)
      toast.error('Failed to upload film')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const likeFilm = async (filmId: string, userId: string) => {
    try {
      // Check if user already liked this film
      const { data: existingLike } = await supabase
        .from('film_likes')
        .select('id')
        .eq('film_id', filmId)
        .eq('user_id', userId)
        .single()

      if (existingLike) {
        // Unlike the film
        await supabase
          .from('film_likes')
          .delete()
          .eq('film_id', filmId)
          .eq('user_id', userId)

        // Decrement likes count
        await supabase.rpc('decrement_film_likes', { film_id: filmId })
        
        toast.success('Film unliked')
      } else {
        // Like the film
        await supabase
          .from('film_likes')
          .insert({
            film_id: filmId,
            user_id: userId,
          })

        // Increment likes count
        await supabase.rpc('increment_film_likes', { film_id: filmId })
        
        toast.success('Film liked!')
      }

      await fetchFilms()
      return { error: null }
    } catch (error: any) {
      console.error('Error liking film:', error)
      toast.error('Failed to like film')
      return { error }
    }
  }

  const incrementViews = async (filmId: string) => {
    try {
      await supabase.rpc('increment_film_views', { film_id: filmId })
    } catch (error: any) {
      console.error('Error incrementing views:', error)
    }
  }

  const getFilmById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('films')
        .select(`
          *,
          creator:users(id, username, avatar_url),
          challenge:challenges(id, title)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching film:', error)
      return { data: null, error }
    }
  }

  const filterFilms = (category?: FilmCategory) => {
    return films.filter(film => {
      if (category && film.category !== category) return false
      return true
    })
  }

  const searchFilms = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return films.filter(film =>
      film.title.toLowerCase().includes(lowercaseQuery) ||
      film.description.toLowerCase().includes(lowercaseQuery) ||
      film.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  const getUserFilms = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('films')
        .select(`
          *,
          creator:users(id, username, avatar_url),
          challenge:challenges(id, title)
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Error fetching user films:', error)
      return { data: [], error }
    }
  }

  return {
    films,
    loading,
    uploadFilm,
    likeFilm,
    incrementViews,
    getFilmById,
    filterFilms,
    searchFilms,
    getUserFilms,
    refetch: fetchFilms,
  }
}
