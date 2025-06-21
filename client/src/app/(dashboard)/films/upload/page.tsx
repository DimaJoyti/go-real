'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FilmUploadForm } from '@/components/films/FilmUploadForm'
import { useAuth } from '@/contexts/AuthContext'

export default function FilmUploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in?redirect=/films/upload')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="space-y-6 mt-8">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to sign-in
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <FilmUploadForm />
    </div>
  )
}
