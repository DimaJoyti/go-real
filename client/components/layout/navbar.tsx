'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Search, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  Clock,
  Plus,
  CheckSquare,
  UserPlus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NavbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  title?: string
}

export function Navbar({ sidebarOpen, setSidebarOpen, title = 'Dashboard' }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timezone, setTimezone] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(userTimezone)

    return () => clearInterval(timer)
  }, [])

  const notifications = [
    { id: 1, title: 'New lead added', description: 'John Doe is interested in downtown property', time: '2 min ago', unread: true },
    { id: 2, title: 'Sale completed', description: 'Property #1234 sold for $450,000', time: '1 hour ago', unread: true },
    { id: 3, title: 'Follow-up scheduled', description: 'Meeting with client tomorrow at 2 PM', time: '3 hours ago', unread: false },
  ]

  const tasks = [
    { id: 1, title: 'Call John Smith', description: 'Follow up on property inquiry', priority: 'high' },
    { id: 2, title: 'Prepare contract', description: 'Draft contract for downtown property', priority: 'medium' },
    { id: 3, title: 'Site visit', description: 'Property inspection at 3 PM', priority: 'high' },
  ]

  const unreadNotifications = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          {/* Time display */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
              <span className="text-xs">{timezone}</span>
            </div>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads, properties, clients..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Quick actions */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
            
            <Button variant="ghost" size="icon">
              <CheckSquare className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tasks dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <CheckSquare className="h-5 w-5" />
                {tasks.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {tasks.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Your Tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tasks.map((task) => (
                <DropdownMenuItem key={task.id} className="flex flex-col items-start p-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{task.description}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                <span className="text-sm text-primary">View all tasks</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{notification.title}</span>
                    {notification.unread && (
                      <div className="h-2 w-2 bg-primary rounded-full" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{notification.description}</span>
                  <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                <span className="text-sm text-primary">View all notifications</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
