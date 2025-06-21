'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Home, 
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  Settings
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  badge?: string | number
  href?: string
  onClick?: () => void
}

const quickActions: QuickAction[] = [
  {
    id: 'add-lead',
    title: 'Add New Lead',
    description: 'Create a new lead entry',
    icon: <UserPlus className="h-5 w-5" />,
    color: 'bg-blue-500 hover:bg-blue-600',
    href: '/leads/new'
  },
  {
    id: 'schedule-meeting',
    title: 'Schedule Meeting',
    description: 'Book a client appointment',
    icon: <Calendar className="h-5 w-5" />,
    color: 'bg-purple-500 hover:bg-purple-600',
    badge: '3 pending',
    href: '/calendar'
  },
  {
    id: 'follow-up-calls',
    title: 'Follow-up Calls',
    description: 'Make pending follow-up calls',
    icon: <Phone className="h-5 w-5" />,
    color: 'bg-green-500 hover:bg-green-600',
    badge: 12,
    href: '/tasks?type=calls'
  },
  {
    id: 'send-email',
    title: 'Send Email',
    description: 'Create email campaign',
    icon: <Mail className="h-5 w-5" />,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    href: '/email/compose'
  },
  {
    id: 'add-property',
    title: 'Add Property',
    description: 'List new property',
    icon: <Home className="h-5 w-5" />,
    color: 'bg-pink-500 hover:bg-pink-600',
    href: '/properties/new'
  },
  {
    id: 'create-sale',
    title: 'Create Sale',
    description: 'Record new sale',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    href: '/sales/new'
  },
  {
    id: 'generate-report',
    title: 'Generate Report',
    description: 'Create performance report',
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-orange-500 hover:bg-orange-600',
    href: '/reports'
  },
  {
    id: 'view-analytics',
    title: 'View Analytics',
    description: 'Check performance metrics',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'bg-cyan-500 hover:bg-cyan-600',
    href: '/analytics'
  }
]

const upcomingTasks = [
  {
    id: '1',
    title: 'Call John Smith',
    time: '2:00 PM',
    priority: 'high',
    type: 'call'
  },
  {
    id: '2',
    title: 'Property viewing',
    time: '3:30 PM',
    priority: 'medium',
    type: 'meeting'
  },
  {
    id: '3',
    title: 'Contract review',
    time: '4:15 PM',
    priority: 'high',
    type: 'document'
  },
  {
    id: '4',
    title: 'Team standup',
    time: '5:00 PM',
    priority: 'low',
    type: 'meeting'
  }
]

const getTaskIcon = (type: string) => {
  switch (type) {
    case 'call': return <Phone className="h-3 w-3" />
    case 'meeting': return <Calendar className="h-3 w-3" />
    case 'document': return <FileText className="h-3 w-3" />
    default: return <Clock className="h-3 w-3" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50'
    case 'medium': return 'text-yellow-600 bg-yellow-50'
    case 'low': return 'text-green-600 bg-green-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

export function QuickActions() {
  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used actions and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all"
                onClick={action.onClick}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    {action.icon}
                  </div>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>
            Your upcoming tasks and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded ${getPriorityColor(task.priority)}`}>
                    {getTaskIcon(task.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    <p className="text-xs text-muted-foreground">{task.time}</p>
                  </div>
                </div>
                <Badge 
                  variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <Button variant="outline" className="w-full" size="sm">
              View Full Calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Performance
          </CardTitle>
          <CardDescription>
            Your progress for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Calls Made</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">8/12</span>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-2/3 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Meetings</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">3/5</span>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-3/5 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tasks</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">15/20</span>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-3/4 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Emails</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">25/30</span>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-5/6 h-2 bg-orange-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
