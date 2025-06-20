'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export interface AuthUser extends User {
  profile?: {
    username: string
    avatar_url?: string
    bio?: string
    wallet_address?: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('username, avatar_url, bio, wallet_address')
        .eq('id', authUser.id)
        .single()

      setUser({
        ...authUser,
        profile: profile || undefined
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(authUser as AuthUser)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            username,
          })

        toast.success('Account created! Please check your email to verify.')
      }

      return { data, error: null }
    } catch (error: any) {
      toast.error(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Welcome back!')
      return { data, error: null }
    } catch (error: any) {
      toast.error(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: {
    username?: string
    bio?: string
    avatar_url?: string
    wallet_address?: string
  }) => {
    try {
      if (!user) throw new Error('No user logged in')

      setLoading(true)
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Refresh user profile
      await fetchUserProfile(user)
      toast.success('Profile updated successfully')
      return { error: null }
    } catch (error: any) {
      toast.error(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async (walletAddress: string) => {
    return updateProfile({ wallet_address: walletAddress })
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    connectWallet,
  }
}
