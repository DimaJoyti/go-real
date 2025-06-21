'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              GoReal
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/challenges" className="text-sm font-medium transition-colors hover:text-primary">
              Challenges
            </Link>
            <Link href="/films" className="text-sm font-medium transition-colors hover:text-primary">
              Films
            </Link>
            <Link href="/marketplace" className="text-sm font-medium transition-colors hover:text-primary">
              Marketplace
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}