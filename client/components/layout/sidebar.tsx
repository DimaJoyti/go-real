'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  ChevronDown, 
  ChevronRight,
  Home,
  Users,
  ShoppingCart,
  Building,
  CheckSquare,
  DollarSign,
  FileText,
  Settings,
  User,
  Shield,
  Package,
  TrendingUp,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react'

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
              "w-full justify-start h-10 px-3",
              level > 0 && "ml-4 w-[calc(100%-1rem)]",
              isActive && "bg-primary/10 text-primary font-medium"
            )}
            onClick={() => toggleExpanded(item.id)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                {item.icon}
                {isOpen && <span className="text-sm">{item.title}</span>}
              </div>
              {isOpen && hasChildren && (
                isExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
          {isOpen && isExpanded && item.children && (
            <div className="space-y-1 ml-2">
              {item.children.map(child => renderNavigationItem(child, level + 1))}
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
            "w-full justify-start h-10 px-3",
            level > 0 && "ml-4 w-[calc(100%-1rem)]",
            isActive && "bg-primary/10 text-primary font-medium"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              {item.icon}
              {isOpen && <span className="text-sm">{item.title}</span>}
            </div>
            {isOpen && item.badge && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full bg-background border-r transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isOpen ? "w-64" : "w-16"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                R
              </div>
              {isOpen && (
                <span className="text-xl font-bold">RealEstate</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 lg:flex hidden"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {navigationItems.map(item => renderNavigationItem(item))}
            </nav>
          </div>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">Administrator</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
