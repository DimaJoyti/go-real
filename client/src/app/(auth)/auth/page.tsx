'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/features/auth/auth-form'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleToggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-challenz-50/20 to-nft-50/20 p-4">
      <div className="w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-8 shadow-lg">
          <AuthForm mode={mode} onToggleMode={handleToggleMode} />
        </div>
      </div>
    </div>
  )
}
