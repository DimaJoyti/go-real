'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Home, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'lead' | 'sale' | 'meeting' | 'call' | 'email' | 'task' | 'property'
  title: string
  description: string
  user: {
    name: string
    avatar?: string
    initials: string
  }
  timestamp: string
  status?: 'completed' | 'pending' | 'overdue'
  priority?: 'high' | 'medium' | 'low'
  value?: string
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New lead added',
    description: 'John Smith expressed interest in downtown apartment',
    user: { name: 'Sarah Wilson', initials: 'SW' },
    timestamp: '2 minutes ago',
    status: 'pending',
    priority: 'high'
  },
  {
    id: '2',
    type: 'sale',
    title: 'Sale completed',
    description: 'Property #1234 sold successfully',
    user: { name: 'Mike Johnson', initials: 'MJ' },
    timestamp: '15 minutes ago',
    status: 'completed',
    value: '$450,000'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Client meeting scheduled',
    description: 'Property viewing with the Anderson family',
    user: { name: 'Emily Davis', initials: 'ED' },
    timestamp: '1 hour ago',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: '4',
    type: 'call',
    title: 'Follow-up call completed',
    description: 'Discussed financing options with potential buyer',
    user: { name: 'David Brown', initials: 'DB' },
    timestamp: '2 hours ago',
    status: 'completed',
    priority: 'high'
  },
  {
    id: '5',
    type: 'email',
    title: 'Email campaign sent',
    description: 'Monthly newsletter sent to 1,234 subscribers',
    user: { name: 'Lisa Chen', initials: 'LC' },
    timestamp: '3 hours ago',
    status: 'completed'
  },
  {
    id: '6',
    type: 'task',
    title: 'Contract review overdue',
    description: 'Legal review for commercial property purchase',
    user: { name: 'Robert Taylor', initials: 'RT' },
    timestamp: '4 hours ago',
    status: 'overdue',
    priority: 'high'
  },
  {
    id: '7',
    type: 'property',
    title: 'New property listed',
    description: 'Luxury condo in downtown area added to inventory',
    user: { name: 'Jennifer White', initials: 'JW' },
    timestamp: '5 hours ago',
    status: 'completed',
    value: '$750,000'
  },
  {
    id: '8',
    type: 'meeting',
    title: 'Team meeting completed',
    description: 'Weekly sales review and strategy planning',
    user: { name: 'Alex Rodriguez', initials: 'AR' },
    timestamp: '6 hours ago',
    status: 'completed'
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'lead': return <User className="h-4 w-4" />
    case 'sale': return <DollarSign className="h-4 w-4" />
    case 'meeting': return <Calendar className="h-4 w-4" />
    case 'call': return <Phone className="h-4 w-4" />
    case 'email': return <Mail className="h-4 w-4" />
    case 'task': return <CheckCircle className="h-4 w-4" />
    case 'property': return <Home className="h-4 w-4" />
    default: return <Activity className="h-4 w-4" />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'lead': return 'text-blue-600 bg-blue-50'
    case 'sale': return 'text-green-600 bg-green-50'
    case 'meeting': return 'text-purple-600 bg-purple-50'
    case 'call': return 'text-orange-600 bg-orange-50'
    case 'email': return 'text-indigo-600 bg-indigo-50'
    case 'task': return 'text-yellow-600 bg-yellow-50'
    case 'property': return 'text-pink-600 bg-pink-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-3 w-3 text-green-600" />
    case 'pending': return <Clock className="h-3 w-3 text-yellow-600" />
    case 'overdue': return <AlertCircle className="h-3 w-3 text-red-600" />
    default: return null
  }
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high': return 'border-l-red-500'
    case 'medium': return 'border-l-yellow-500'
    case 'low': return 'border-l-green-500'
    default: return 'border-l-gray-300'
  }
}

export function RecentActivity() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and actions from your team
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className={cn(
                "flex items-start space-x-4 p-4 rounded-lg border-l-4 bg-muted/20 hover:bg-muted/40 transition-colors",
                getPriorityColor(activity.priority)
              )}
            >
              <div className={cn("p-2 rounded-lg", getActivityColor(activity.type))}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <div className="flex items-center space-x-2">
                    {activity.value && (
                      <Badge variant="secondary" className="text-green-600">
                        {activity.value}
                      </Badge>
                    )}
                    {activity.priority && (
                      <Badge 
                        variant={activity.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.priority}
                      </Badge>
                    )}
                    {getStatusIcon(activity.status)}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {activity.user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {activity.user.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="outline" className="w-full">
            Load More Activities
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
