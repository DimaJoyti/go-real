'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Target,
  Clock
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Lead status options
const leadStatuses = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
]

// Lead sources
const leadSources = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' }
]

// Mock data - would be replaced with API calls
const mockLeads = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 234 567 8900',
    company: 'Tech Corp',
    designation: 'CTO',
    source: 'website',
    status: 'new',
    score: 85,
    budgetMin: 500000,
    budgetMax: 750000,
    requirements: 'Looking for a modern office space in downtown area',
    assignedTo: 'Sarah Johnson',
    createdAt: '2024-01-15T10:30:00Z',
    lastContactDate: null,
    nextFollowUp: '2024-01-20T14:00:00Z',
    tags: ['high-priority', 'corporate']
  },
  {
    id: '2',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 234 567 8901',
    company: 'Design Studio',
    designation: 'Founder',
    source: 'referral',
    status: 'qualified',
    score: 92,
    budgetMin: 300000,
    budgetMax: 500000,
    requirements: 'Creative workspace with natural light',
    assignedTo: 'Mike Wilson',
    createdAt: '2024-01-14T09:15:00Z',
    lastContactDate: '2024-01-16T11:00:00Z',
    nextFollowUp: '2024-01-22T10:00:00Z',
    tags: ['qualified', 'design']
  },
  {
    id: '3',
    name: 'Robert Chen',
    email: 'robert.chen@email.com',
    phone: '+1 234 567 8902',
    company: 'Investment Group',
    designation: 'Managing Partner',
    source: 'social_media',
    status: 'proposal',
    score: 78,
    budgetMin: 1000000,
    budgetMax: null,
    requirements: 'Premium commercial space for investment',
    assignedTo: 'Sarah Johnson',
    createdAt: '2024-01-13T16:45:00Z',
    lastContactDate: '2024-01-17T15:30:00Z',
    nextFollowUp: '2024-01-25T09:00:00Z',
    tags: ['investor', 'premium']
  }
]

const getStatusColor = (status: string) => {
  const statusObj = leadStatuses.find(s => s.value === status)
  return statusObj?.color || 'bg-gray-100 text-gray-800'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function LeadsPage() {
  const router = useRouter()
  const { user, canManageLeads } = useEnhancedAuth()
  const [leads, setLeads] = useState(mockLeads)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesSource
  })

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
  }

  const handleCreateLead = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead)
    // Open edit dialog or navigate to edit page
    router.push(`/crm/leads/${lead.id}/edit`)
  }

  const handleViewLead = (lead: any) => {
    router.push(`/crm/leads/${lead.id}`)
  }

  const handleDeleteLead = async (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      setIsLoading(true)
      try {
        // API call would go here
        setLeads(leads.filter(l => l.id !== leadId))
        toast.success('Lead deleted successfully')
      } catch (error) {
        toast.error('Failed to delete lead')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      // API call would go here
      setLeads(leads.map(l => 
        l.id === leadId ? { ...l, status: newStatus } : l
      ))
      toast.success('Lead status updated')
    } catch (error) {
      toast.error('Failed to update lead status')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
            <p className="text-gray-600">Track and manage your sales leads</p>
          </div>
          <Button onClick={handleCreateLead}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualified}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.converted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {leadStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {leadSources.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>
              Manage your sales pipeline and track lead progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Lead Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{lead.name}</h4>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">{lead.score}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{lead.company}</p>
                      <p className="text-xs text-gray-500">{lead.designation}</p>
                      <div className="flex gap-1 mt-2">
                        {lead.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Contact</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{lead.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Status */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Budget</p>
                      <p className="text-sm">
                        {formatCurrency(lead.budgetMin)}
                        {lead.budgetMax && ` - ${formatCurrency(lead.budgetMax)}`}
                      </p>
                      <div className="mt-2">
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => handleStatusChange(lead.id, value)}
                        >
                          <SelectTrigger className="w-full h-8">
                            <Badge className={getStatusColor(lead.status)}>
                              {leadStatuses.find(s => s.value === lead.status)?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {leadStatuses.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Timeline</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">Created: {formatDate(lead.createdAt)}</span>
                        </div>
                        {lead.nextFollowUp && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-400" />
                            <span className="text-xs">Follow-up: {formatDate(lead.nextFollowUp)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned to: {lead.assignedTo}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewLead(lead)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditLead(lead)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteLead(lead.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredLeads.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No leads found matching your criteria.</p>
                  <Button className="mt-4" onClick={handleCreateLead}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first lead
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Lead Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your sales pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-gray-500">
                Lead creation form will be implemented here...
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
