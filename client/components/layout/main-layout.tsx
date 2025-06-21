'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'

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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        userRole={loggedUser?.role}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title={getPageTitle(pathname)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
