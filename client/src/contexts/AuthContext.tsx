'use client'

import type { Database } from '@/lib/supabase'
import { createSupabaseClient } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (data: SignUpData) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'github' | 'google') => Promise<{ error?: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>
  refreshProfile: () => Promise<void>
  connectWallet: (address: string) => Promise<{ error?: any }>
  disconnectWallet: () => Promise<{ error?: any }>
}

interface SignUpData {
  email: string
  password: string
  username: string
  fullName: string
  bio?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }

        setLoading(false)
        router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Successfully signed in!')
      router.push('/dashboard')
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An unexpected error occurred')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email/password
  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true)
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
            bio: data.bio || '',
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      if (authData.user && !authData.session) {
        toast.success('Please check your email to confirm your account!')
      } else {
        toast.success('Account created successfully!')
        router.push('/dashboard')
      }

      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error('An unexpected error occurred')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error(error.message)
        return
      }

      setUser(null)
      setProfile(null)
      setSession(null)
      toast.success('Successfully signed out!')
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Sign in with OAuth provider
  const signInWithProvider = async (provider: 'github' | 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      toast.error('An unexpected error occurred')
      return { error }
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update profile')
        return { error }
      }

      setProfile(data)
      toast.success('Profile updated successfully!')
      return { error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('An unexpected error occurred')
      return { error }
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }

  // Connect wallet
  const connectWallet = async (address: string) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ wallet_address: address })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to connect wallet')
        return { error }
      }

      setProfile(data)
      toast.success('Wallet connected successfully!')
      return { error: null }
    } catch (error) {
      console.error('Connect wallet error:', error)
      toast.error('An unexpected error occurred')
      return { error }
    }
  }

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ wallet_address: null })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to disconnect wallet')
        return { error }
      }

      setProfile(data)
      toast.success('Wallet disconnected successfully!')
      return { error: null }
    } catch (error) {
      console.error('Disconnect wallet error:', error)
      toast.error('An unexpected error occurred')
      return { error }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    updateProfile,
    refreshProfile,
    connectWallet,
    disconnectWallet,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
