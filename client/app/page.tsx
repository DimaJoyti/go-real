'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

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
    <div className="min-h-screen flex items-center justify-center gradient-mesh relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-20 left-20 w-40 h-40 gradient-aurora rounded-full opacity-20 animate-float blur-2xl" />
      <div className="absolute bottom-20 right-20 w-32 h-32 gradient-sunset rounded-full opacity-20 animate-float floating-delayed blur-2xl" />
      <div className="absolute top-1/2 left-1/2 w-60 h-60 gradient-cosmic rounded-full opacity-10 animate-breathe blur-3xl transform -translate-x-1/2 -translate-y-1/2" />

      <div className="relative text-center glass-card p-12 rounded-3xl shadow-2xl">
        {/* Epic loading animation */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 gradient-royal rounded-full animate-spin sparkle">
            <div className="absolute inset-3 bg-background rounded-full" />
          </div>
          <div className="absolute inset-6 gradient-aurora rounded-full animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl animate-bounce">🏠</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gradient-aurora mb-4 animate-pulse">
          Welcome to RealEstate Pro
        </h2>
        <p className="text-lg text-muted-foreground mb-6 animate-fade-in">
          Redirecting to your epic dashboard...
        </p>

        {/* Progress indicator */}
        <div className="w-64 h-1 bg-muted/30 rounded-full overflow-hidden mx-auto">
          <div className="h-full gradient-aurora rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>

        {/* Floating dots */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  )
}
