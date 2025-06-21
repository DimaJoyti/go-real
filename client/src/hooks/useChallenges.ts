'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Challenge, ChallengeCategory, ChallengeDifficulty, ChallengeStatus, CreateChallengeForm } from '@/types'
import toast from 'react-hot-toast'

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          creator:users(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setChallenges(data || [])
    } catch (error: any) {
      console.error('Error fetching challenges:', error)
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  const createChallenge = async (challengeData: CreateChallengeForm, userId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          title: challengeData.title,
          description: challengeData.description,
          category: challengeData.category,
          difficulty: challengeData.difficulty,
          start_date: challengeData.start_date,
          end_date: challengeData.end_date,
          max_participants: challengeData.max_participants,
          reward_amount: challengeData.reward_amount,
          reward_currency: challengeData.reward_currency,
          rules: challengeData.rules,
          tags: challengeData.tags,
          creator_id: userId,
          status: ChallengeStatus.ACTIVE,
          current_participants: 0,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Challenge created successfully!')
      await fetchChallenges()
      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating challenge:', error)
      toast.error('Failed to create challenge')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId: string, userId: string) => {
    try {
      // First check if user is already participating
      const { data: existingParticipation } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single()

      if (existingParticipation) {
        toast.error('You are already participating in this challenge')
        return { data: null, error: 'Already participating' }
      }

      // Add user to challenge participants
      const { error: participationError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
        })

      if (participationError) throw participationError

      // Update participant count
      const { error: updateError } = await supabase.rpc('increment_challenge_participants', {
        challenge_id: challengeId
      })

      if (updateError) throw updateError

      toast.success('Successfully joined the challenge!')
      await fetchChallenges()
      return { data: true, error: null }
    } catch (error: any) {
      console.error('Error joining challenge:', error)
      toast.error('Failed to join challenge')
      return { data: null, error }
    }
  }

  const getChallengeById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          creator:users(id, username, avatar_url),
          participants:challenge_participants(
            user:users(id, username, avatar_url)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching challenge:', error)
      return { data: null, error }
    }
  }

  const filterChallenges = (
    category?: ChallengeCategory,
    difficulty?: ChallengeDifficulty,
    status?: ChallengeStatus
  ) => {
    return challenges.filter(challenge => {
      if (category && challenge.category !== category) return false
      if (difficulty && challenge.difficulty !== difficulty) return false
      if (status && challenge.status !== status) return false
      return true
    })
  }

  const searchChallenges = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return challenges.filter(challenge =>
      challenge.title.toLowerCase().includes(lowercaseQuery) ||
      challenge.description.toLowerCase().includes(lowercaseQuery) ||
      challenge.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  return {
    challenges,
    loading,
    createChallenge,
    joinChallenge,
    getChallengeById,
    filterChallenges,
    searchChallenges,
    refetch: fetchChallenges,
  }
}
