'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  Settings,
  Filter,
  MoreHorizontal,
  Heart,
  MessageCircle,
  UserPlus,
  Trophy,
  DollarSign,
  Target,
  Users,
  Film,
  Star,
  Gift,
  Zap,
  TrendingUp,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Award,
  Crown,
  Shield
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'like',
    title: 'Sarah Johnson liked your film',
    message: 'Sarah Johnson liked your film "Urban Stories: Chapter 1"',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
    priority: 'normal',
    category: 'social',
    actor: {
      name: 'Sarah Johnson',
      avatar: '/api/placeholder/32/32',
      username: '@sarahj_films'
    },
    actionUrl: '/films/urban-stories-1',
    metadata: {
      filmTitle: 'Urban Stories: Chapter 1',
      likeCount: 234
    }
  },
  {
    id: '2',
    type: 'follow',
    title: 'New follower',
    message: 'Alex Rivera started following you',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    priority: 'normal',
    category: 'social',
    actor: {
      name: 'Alex Rivera',
      avatar: '/api/placeholder/32/32',
      username: '@alexr_creator'
    },
    actionUrl: '/profile/alexr_creator'
  },
  {
    id: '3',
    type: 'challenge_win',
    title: 'Challenge victory!',
    message: 'Congratulations! You won first place in the Urban Storytelling Challenge',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
    priority: 'high',
    category: 'achievement',
    actionUrl: '/challenges/urban-storytelling',
    metadata: {
      challengeName: 'Urban Storytelling Challenge',
      prize: '$500',
      position: 1
    }
  },
  {
    id: '4',
    type: 'investment_update',
    title: 'Investment dividend received',
    message: 'You received $125.50 dividend from Downtown Luxury Apartment',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: true,
    priority: 'normal',
    category: 'financial',
    actionUrl: '/portfolio',
    metadata: {
      propertyName: 'Downtown Luxury Apartment',
      amount: 125.50,
      currency: 'USD'
    }
  },
  {
    id: '5',
    type: 'comment',
    title: 'New comment on your film',
    message: 'Mike Chen commented on "Urban Stories: Chapter 1"',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    priority: 'normal',
    category: 'social',
    actor: {
      name: 'Mike Chen',
      avatar: '/api/placeholder/32/32',
      username: '@mikechen_investor'
    },
    actionUrl: '/films/urban-stories-1#comments',
    metadata: {
      filmTitle: 'Urban Stories: Chapter 1',
      commentPreview: 'Amazing cinematography! The lighting in the sunset scene...'
    }
  },
  {
    id: '6',
    type: 'community_invite',
    title: 'Community invitation',
    message: 'You\'ve been invited to join "Challenge Champions" community',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: false,
    priority: 'normal',
    category: 'community',
    actor: {
      name: 'Emma Davis',
      avatar: '/api/placeholder/32/32',
      username: '@emmad_films'
    },
    actionUrl: '/communities/challenge-champions',
    metadata: {
      communityName: 'Challenge Champions',
      inviterRole: 'Owner'
    }
  },
  {
    id: '7',
    type: 'system',
    title: 'Platform update',
    message: 'New features available: Live streaming and enhanced analytics',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isRead: true,
    priority: 'low',
    category: 'system',
    actionUrl: '/updates',
    metadata: {
      version: '2.1.0',
      features: ['Live streaming', 'Enhanced analytics', 'Mobile improvements']
    }
  },
  {
    id: '8',
    type: 'achievement',
    title: 'Achievement unlocked!',
    message: 'You earned the "Rising Star" badge for reaching 10K followers',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    priority: 'high',
    category: 'achievement',
    actionUrl: '/profile/achievements',
    metadata: {
      badgeName: 'Rising Star',
      badgeIcon: '⭐',
      milestone: '10K followers'
    }
  }
]

const notificationSettings = {
  social: {
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    shares: true
  },
  challenges: {
    newChallenges: true,
    submissions: true,
    results: true,
    deadlines: true
  },
  investments: {
    dividends: true,
    priceChanges: true,
    newProperties: true,
    governance: true
  },
  community: {
    invitations: true,
    newPosts: false,
    mentions: true,
    moderation: true
  },
  system: {
    updates: true,
    maintenance: true,
    security: true,
    newsletters: false
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return <Heart className="h-5 w-5 text-red-500" />
    case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />
    case 'follow': return <UserPlus className="h-5 w-5 text-green-500" />
    case 'challenge_win': return <Trophy className="h-5 w-5 text-yellow-500" />
    case 'investment_update': return <DollarSign className="h-5 w-5 text-green-600" />
    case 'community_invite': return <Users className="h-5 w-5 text-purple-500" />
    case 'achievement': return <Award className="h-5 w-5 text-orange-500" />
    case 'system': return <Info className="h-5 w-5 text-gray-500" />
    default: return <Bell className="h-5 w-5 text-gray-500" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-l-red-500'
    case 'normal': return 'border-l-blue-500'
    case 'low': return 'border-l-gray-300'
    default: return 'border-l-gray-300'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function NotificationsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('all')
  const [notifications, setNotifications] = useState(mockNotifications)
  const [settings, setSettings] = useState(notificationSettings)
  const [filter, setFilter] = useState('all')

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, isRead: true })
    ))
    toast.success('All notifications marked as read')
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId))
    toast.success('Notification deleted')
  }

  const handleSettingChange = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
    toast.success('Notification preferences updated')
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'read') return notification.isRead
    if (filter !== 'all') return notification.category === filter
    return true
  })

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = notification.timestamp.toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
    return groups
  }, {} as Record<string, typeof notifications>)

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-600" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-gray-600">Stay updated with your latest activities</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="settings">Preferences</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'social' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('social')}
              >
                Social
              </Button>
              <Button
                variant={filter === 'achievement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('achievement')}
              >
                Achievements
              </Button>
              <Button
                variant={filter === 'financial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('financial')}
              >
                Financial
              </Button>
              <Button
                variant={filter === 'community' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('community')}
              >
                Community
              </Button>
            </div>

            {/* Notifications List */}
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <div className="space-y-3">
                    {dayNotifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`transition-all hover:shadow-md border-l-4 ${getPriorityColor(notification.priority)} ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  
                                  <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                                  
                                  {notification.actor && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={notification.actor.avatar} />
                                        <AvatarFallback>{notification.actor.name[0]}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm text-gray-500">{notification.actor.name}</span>
                                    </div>
                                  )}
                                  
                                  {notification.metadata && (
                                    <div className="text-sm text-gray-500">
                                      {notification.type === 'investment_update' && notification.metadata.amount && (
                                        <span className="font-medium text-green-600">
                                          {formatCurrency(notification.metadata.amount)}
                                        </span>
                                      )}
                                      {notification.type === 'challenge_win' && notification.metadata.prize && (
                                        <span className="font-medium text-yellow-600">
                                          Prize: {notification.metadata.prize}
                                        </span>
                                      )}
                                      {notification.type === 'comment' && notification.metadata.commentPreview && (
                                        <span className="italic">
                                          "{notification.metadata.commentPreview}"
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>{formatDistanceToNow(notification.timestamp)} ago</span>
                                    <Badge variant="outline" className="text-xs">
                                      {notification.category}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up! New notifications will appear here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Social Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Social Activity
                  </h4>
                  <div className="space-y-3 ml-6">
                    {Object.entries(settings.social).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`social-${key}`} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`social-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => handleSettingChange('social', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenge Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Challenges
                  </h4>
                  <div className="space-y-3 ml-6">
                    {Object.entries(settings.challenges).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`challenges-${key}`} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`challenges-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => handleSettingChange('challenges', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Investments
                  </h4>
                  <div className="space-y-3 ml-6">
                    {Object.entries(settings.investments).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`investments-${key}`} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`investments-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => handleSettingChange('investments', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    Community
                  </h4>
                  <div className="space-y-3 ml-6">
                    {Object.entries(settings.community).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`community-${key}`} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`community-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => handleSettingChange('community', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Notifications */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    System
                  </h4>
                  <div className="space-y-3 ml-6">
                    {Object.entries(settings.system).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={`system-${key}`} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Switch
                          id={`system-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => handleSettingChange('system', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notification History</h3>
              <p className="text-gray-500">Archived and deleted notifications will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
