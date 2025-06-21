'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Building,
    CheckSquare,
    ChevronDown,
    DollarSign,
    FileText,
    Home,
    LogOut,
    Menu,
    Package,
    Shield,
    ShoppingCart,
    User,
    Users,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavigationItem {
  id: string
  title: string
  href?: string
  icon: React.ReactNode
  children?: NavigationItem[]
  roles?: string[]
  badge?: string | number
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
    roles: ['employee', 'manager', 'super_admin']
  },
  {
    id: 'leads',
    title: 'Leads',
    href: '/leads',
    icon: <Users className="h-5 w-5" />,
    roles: ['employee', 'manager', 'super_admin'],
    badge: '12'
  },
  {
    id: 'tasks',
    title: 'Tasks',
    href: '/tasks',
    icon: <CheckSquare className="h-5 w-5" />,
    roles: ['employee', 'manager', 'super_admin'],
    badge: '5'
  },
  {
    id: 'users',
    title: 'Users',
    icon: <User className="h-5 w-5" />,
    children: [
      {
        id: 'clients',
        title: 'Clients',
        href: '/clients',
        icon: <Users className="h-4 w-4" />,
        roles: ['employee', 'manager', 'super_admin']
      },
      {
        id: 'employees',
        title: 'Employees',
        href: '/employees',
        icon: <Users className="h-4 w-4" />,
        roles: ['manager', 'super_admin']
      }
    ]
  },
  {
    id: 'authorization',
    title: 'Authorization',
    icon: <Shield className="h-5 w-5" />,
    children: [
      {
        id: 'approvals',
        title: 'Approvals',
        href: '/authorization/request',
        icon: <CheckSquare className="h-4 w-4" />,
        roles: ['manager', 'super_admin']
      },
      {
        id: 'refunds',
        title: 'Refunds',
        href: '/authorization/refund',
        icon: <DollarSign className="h-4 w-4" />,
        roles: ['manager', 'super_admin']
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <Package className="h-5 w-5" />,
    children: [
      {
        id: 'societies',
        title: 'Societies',
        href: '/societies',
        icon: <Building className="h-4 w-4" />,
        roles: ['manager', 'super_admin']
      },
      {
        id: 'projects',
        title: 'Projects',
        href: '/projects',
        icon: <Building className="h-4 w-4" />,
        roles: ['manager', 'super_admin']
      },
      {
        id: 'inventories',
        title: 'Inventories',
        href: '/inventories',
        icon: <Package className="h-4 w-4" />,
        roles: ['manager', 'super_admin']
      }
    ]
  },
  {
    id: 'sales',
    title: 'Sales',
    href: '/sales',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['employee', 'manager', 'super_admin']
  },
  {
    id: 'transcript',
    title: 'Transcript',
    href: '/transcript',
    icon: <FileText className="h-5 w-5" />,
    roles: ['manager', 'super_admin']
  },
  {
    id: 'cashbook',
    title: 'Cash Book',
    icon: <DollarSign className="h-5 w-5" />,
    children: [
      {
        id: 'all-cashbook',
        title: 'All Cash Book',
        href: '/cashbook',
        icon: <DollarSign className="h-4 w-4" />,
        roles: ['employee', 'manager', 'super_admin']
      },
      {
        id: 'view-cashbook',
        title: 'View Cash Book',
        href: '/view/cashbook',
        icon: <FileText className="h-4 w-4" />,
        roles: ['employee', 'manager', 'super_admin']
      }
    ]
  },
  {
    id: 'vouchers',
    title: 'Vouchers',
    href: '/voucher',
    icon: <FileText className="h-5 w-5" />,
    roles: ['employee', 'manager', 'super_admin']
  }
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  userRole?: string
}

export function Sidebar({ isOpen, setIsOpen, userRole = 'employee' }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href) {
      return pathname === item.href
    }
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  const hasPermission = (item: NavigationItem): boolean => {
    return !item.roles || item.roles.includes(userRole)
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    if (!hasPermission(item)) return null

    const isActive = isItemActive(item)
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-12 px-4 rounded-xl transition-all duration-300 hover-lift group",
              level > 0 && "ml-4 w-[calc(100%-1rem)]",
              isActive && "glass-card bg-primary/10 text-primary font-semibold border border-primary/20 shadow-lg"
            )}
            onClick={() => toggleExpanded(item.id)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
                  isActive ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  {item.icon}
                </div>
                {isOpen && <span className="text-sm font-medium">{item.title}</span>}
              </div>
              {isOpen && hasChildren && (
                <div className={cn(
                  "transition-transform duration-300",
                  isExpanded && "rotate-180"
                )}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              )}
            </div>
          </Button>
          {isOpen && isExpanded && item.children && (
            <div className="space-y-1 ml-2 animate-slide-down">
              {item.children.map((child, index) => (
                <div
                  key={child.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {renderNavigationItem(child, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link key={item.id} href={item.href || '#'}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-12 px-4 rounded-xl transition-all duration-300 hover-lift group",
            level > 0 && "ml-4 w-[calc(100%-1rem)] h-10",
            isActive && "glass-card bg-primary/10 text-primary font-semibold border border-primary/20 shadow-lg"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
                level > 0 && "p-1.5",
                isActive ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                {item.icon}
              </div>
              {isOpen && <span className="text-sm font-medium">{item.title}</span>}
            </div>
            {isOpen && item.badge && (
              <div className="flex items-center space-x-2">
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold shadow-sm animate-pulse">
                  {item.badge}
                </div>
              </div>
            )}
          </div>
        </Button>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full glass-card border-r border-white/10 transition-all duration-500 ease-out lg:relative lg:translate-x-0 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isOpen ? "w-64" : "w-16"
      )}>
        <div className="flex h-full flex-col relative">
          {/* Animated background gradient */}
          <div className="absolute inset-0 gradient-royal opacity-10 pointer-events-none animate-gradient" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-secondary/8 pointer-events-none" />

          {/* Floating particles */}
          <div className="absolute top-20 left-4 w-2 h-2 bg-primary/30 rounded-full animate-float" />
          <div className="absolute top-40 right-6 w-1.5 h-1.5 bg-accent/40 rounded-full animate-float floating-delayed" />
          <div className="absolute bottom-32 left-8 w-1 h-1 bg-secondary/50 rounded-full animate-float" />

          {/* Logo */}
          <div className="relative flex h-20 items-center justify-between px-6 border-b border-white/10">
            <div className="flex items-center space-x-4 animate-slide-down">
              <div className="relative">
                <div className="w-12 h-12 gradient-aurora rounded-2xl flex items-center justify-center text-white font-bold shadow-2xl hover-glow transition-all duration-500 hover:scale-110 animate-breathe sparkle">
                  <span className="text-xl">🏠</span>
                </div>
                {/* Orbiting dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
              </div>
              {isOpen && (
                <div className="animate-fade-in space-y-1">
                  <span className="text-2xl font-black text-gradient-aurora">RealEstate</span>
                  <p className="text-xs text-muted-foreground font-medium tracking-wide">Management Platform</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 lg:flex hidden hover-lift glass-card border-white/20"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <div className="relative flex-1 overflow-y-auto py-6 px-3">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {renderNavigationItem(item)}
                </div>
              ))}
            </nav>
          </div>

          {/* User section */}
          <div className="relative border-t border-white/10 p-4">
            <div className="glass-card p-3 rounded-xl hover-lift transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-secondary rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0 animate-fade-in">
                    <p className="text-sm font-semibold text-foreground">John Doe</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                )}
                {isOpen && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100">
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
