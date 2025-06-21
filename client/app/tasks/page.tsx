'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Clock, User, Calendar } from 'lucide-react'

export default function TasksPage() {
  const tasks = [
    {
      id: 1,
      title: 'Call John Smith',
      description: 'Follow up on property inquiry for downtown apartment',
      priority: 'High',
      status: 'Pending',
      assignee: 'You',
      dueDate: 'Today, 2:00 PM',
      category: 'Follow-up'
    },
    {
      id: 2,
      title: 'Prepare contract documents',
      description: 'Draft purchase agreement for suburban house sale',
      priority: 'Medium',
      status: 'In Progress',
      assignee: 'Sarah Wilson',
      dueDate: 'Tomorrow, 10:00 AM',
      category: 'Documentation'
    },
    {
      id: 3,
      title: 'Property inspection',
      description: 'Conduct final inspection for commercial space',
      priority: 'High',
      status: 'Pending',
      assignee: 'Mike Johnson',
      dueDate: 'Dec 25, 3:00 PM',
      category: 'Inspection'
    },
    {
      id: 4,
      title: 'Update CRM records',
      description: 'Update client information and interaction history',
      priority: 'Low',
      status: 'Completed',
      assignee: 'You',
      dueDate: 'Yesterday',
      category: 'Admin'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive'
      case 'Medium': return 'default'
      case 'Low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'default'
      case 'In Progress': return 'default'
      case 'Pending': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your daily tasks and assignments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              2 due today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              3 assigned to you
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">
              +4 this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            Your tasks and assignments organized by priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <CheckSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignee}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(task.status) as any}>
                    {task.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
