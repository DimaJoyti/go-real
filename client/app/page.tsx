'use client'

import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Types
interface User {
  role: string;
  [key: string]: any;
}

interface RootState {
  user: {
    loggedUser: User | null;
  };
}

export default function HomePage() {
  const { loggedUser } = useSelector((state: RootState) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (!loggedUser) {
      router.push('/auth/login')
    } else if (loggedUser.role === 'client') {
      router.push('/client')
    } else {
      router.push('/dashboard')
    }
  }, [loggedUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading...</h2>
        <p className="mt-2 text-gray-500">Redirecting to your dashboard</p>
      </div>
    </div>
  )
}
