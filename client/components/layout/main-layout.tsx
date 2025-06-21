'use client'

import { CommandPalette } from '@/components/ui/command-palette'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

interface User {
  role: string
  username: string
  [key: string]: any
}

interface RootState {
  user: {
    loggedUser: User | null
  }
}

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { loggedUser } = useSelector((state: RootState) => state.user)
  const pathname = usePathname()

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Don't show layout for auth pages or client pages
  const isAuthPage = pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register')
  const isClientPage = pathname.startsWith('/client')
  const isDownloadPage = pathname.includes('/download')

  if (isAuthPage || isClientPage || isDownloadPage) {
    return <>{children}</>
  }

  // Don't show layout if user is not logged in
  if (!loggedUser) {
    return <>{children}</>
  }

  // Get page title from pathname
  const getPageTitle = (path: string) => {
    const segments = path.split('/').filter(Boolean)
    if (segments.length === 0) return 'Dashboard'
    
    const titleMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'leads': 'Leads Management',
      'sales': 'Sales',
      'tasks': 'Tasks',
      'clients': 'Clients',
      'employees': 'Employees',
      'societies': 'Societies',
      'projects': 'Projects',
      'inventories': 'Inventories',
      'cashbook': 'Cash Book',
      'voucher': 'Vouchers',
      'transcript': 'Transcript',
      'authorization': 'Authorization',
      'notifications': 'Notifications'
    }

    return titleMap[segments[0]] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
  }

  return (
    <div className="flex h-screen bg-background gradient-mesh relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-20 left-20 w-32 h-32 gradient-aurora rounded-full opacity-10 animate-float blur-xl" />
      <div className="absolute top-40 right-32 w-24 h-24 gradient-sunset rounded-full opacity-10 animate-float floating-delayed blur-xl" />
      <div className="absolute bottom-32 left-40 w-28 h-28 gradient-cosmic rounded-full opacity-10 animate-float blur-xl" />
      <div className="absolute bottom-20 right-20 w-20 h-20 gradient-royal rounded-full opacity-10 animate-float floating-delayed blur-xl" />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        userRole={loggedUser?.role}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title={getPageTitle(pathname)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background/30 backdrop-blur-md relative">
          <div className="container mx-auto p-8 max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  )
}
