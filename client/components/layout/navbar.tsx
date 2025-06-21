'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
    Bell,
    CheckSquare,
    Clock,
    LogOut,
    Menu,
    Plus,
    Search,
    Settings,
    User,
    UserPlus
} from 'lucide-react'
import { useEffect, useState } from 'react'

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
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 shadow-2xl animate-slide-down relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-ocean opacity-5 animate-gradient" />

      <div className="relative flex h-20 items-center justify-between px-8">
        {/* Left section */}
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden glass-card hover-lift"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-black text-gradient-aurora animate-gradient">{title}</h1>
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-8 gradient-royal rounded-full animate-breathe" />
              <div className="w-1 h-6 gradient-sunset rounded-full animate-breathe floating-delayed" />
            </div>
          </div>

          {/* Time display */}
          <div className="hidden lg:flex items-center space-x-3 glass-card px-4 py-2 rounded-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-semibold">{currentTime.toLocaleTimeString()}</span>
              <span className="text-xs text-muted-foreground">{timezone}</span>
            </div>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <Input
            placeholder="Search leads, properties, clients..."
            leftIcon={<Search className="h-4 w-4" />}
            variant="glass"
            className="w-full"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Quick actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button variant="gradient" size="sm" className="hover-lift">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>

            <Button variant="glass" size="icon" className="hover-lift">
              <CheckSquare className="h-4 w-4" />
            </Button>

            <Button variant="glass" size="icon" className="hover-lift">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tasks dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="icon" className="relative hover-lift">
                <CheckSquare className="h-5 w-5" />
                {tasks.length > 0 && (
                  <Badge variant="gradient" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs animate-pulse">
                    {tasks.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card border-white/20 animate-scale-in">
              <DropdownMenuLabel className="text-gradient font-semibold">Your Tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tasks.map((task, index) => (
                <DropdownMenuItem
                  key={task.id}
                  className="flex flex-col items-start p-4 hover:bg-primary/5 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{task.title}</span>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} size="sm">
                      {task.priority}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground mt-1">{task.description}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center hover:bg-primary/5">
                <span className="text-sm text-primary font-semibold">View all tasks</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="icon" className="relative hover-lift">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge variant="gradient" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs animate-pulse">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card border-white/20 animate-scale-in">
              <DropdownMenuLabel className="text-gradient font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification, index) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-4 hover:bg-primary/5 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{notification.title}</span>
                    {notification.unread && (
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground mt-1">{notification.description}</span>
                  <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center hover:bg-primary/5">
                <span className="text-sm text-primary font-semibold">View all notifications</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="glass" size="icon" className="hover-lift">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-12 w-12 rounded-full hover-lift">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback className="gradient-primary text-white font-bold">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 glass-card border-white/20 animate-scale-in" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-semibold leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                  </p>
                  <Badge variant="secondary" size="sm" className="w-fit">Administrator</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3 hover:bg-primary/5">
                <User className="mr-3 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 hover:bg-primary/5">
                <Settings className="mr-3 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3 hover:bg-destructive/5 text-destructive">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
