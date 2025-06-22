'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  Plus,
  Search,
  TrendingUp,
  MessageCircle,
  Eye,
  Star,
  Crown,
  Shield,
  Globe,
  Lock,
  Calendar,
  MapPin,
  Hash,
  Filter,
  Grid,
  List,
  Settings,
  UserPlus,
  Bell,
  BellOff,
  Pin,
  MoreHorizontal,
  Film,
  Home,
  Briefcase,
  Gamepad2,
  Music,
  Palette,
  Code,
  BookOpen,
  Coffee,
  Camera,
  Mic,
  Target,
  Zap
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

// Mock communities data
const mockCommunities = [
  {
    id: '1',
    name: 'Film Creators Hub',
    description: 'A community for filmmakers, content creators, and visual storytellers to share, learn, and collaborate.',
    image: '/api/placeholder/300/200',
    category: 'Creative',
    type: 'public',
    memberCount: 2847,
    postCount: 1256,
    isJoined: true,
    isOwner: false,
    isModerator: false,
    isVerified: true,
    tags: ['filmmaking', 'video', 'storytelling', 'creative'],
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    owner: {
      name: 'Sarah Johnson',
      avatar: '/api/placeholder/32/32'
    },
    recentPosts: [
      {
        title: 'New Challenge: Urban Storytelling',
        author: 'Mike Chen',
        replies: 23,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ]
  },
  {
    id: '2',
    name: 'Real Estate Investors',
    description: 'Connect with fellow real estate investors, share insights, and discover new NFT property opportunities.',
    image: '/api/placeholder/300/200',
    category: 'Investment',
    type: 'public',
    memberCount: 1523,
    postCount: 892,
    isJoined: true,
    isOwner: false,
    isModerator: true,
    isVerified: true,
    tags: ['real-estate', 'nft', 'investment', 'property'],
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
    owner: {
      name: 'Alex Rivera',
      avatar: '/api/placeholder/32/32'
    },
    recentPosts: [
      {
        title: 'Q4 Market Analysis Discussion',
        author: 'Lisa Wang',
        replies: 45,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ]
  },
  {
    id: '3',
    name: 'Challenge Champions',
    description: 'Elite community for top performers in platform challenges. Invitation only.',
    image: '/api/placeholder/300/200',
    category: 'Exclusive',
    type: 'private',
    memberCount: 156,
    postCount: 234,
    isJoined: false,
    isOwner: false,
    isModerator: false,
    isVerified: true,
    tags: ['challenges', 'elite', 'winners', 'exclusive'],
    lastActivity: new Date(Date.now() - 45 * 60 * 1000),
    owner: {
      name: 'Emma Davis',
      avatar: '/api/placeholder/32/32'
    },
    recentPosts: [
      {
        title: 'Monthly Winners Celebration',
        author: 'Emma Davis',
        replies: 12,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]
  },
  {
    id: '4',
    name: 'Tech Innovators',
    description: 'Discuss the latest in blockchain, NFTs, and emerging technologies shaping the future.',
    image: '/api/placeholder/300/200',
    category: 'Technology',
    type: 'public',
    memberCount: 3421,
    postCount: 2156,
    isJoined: false,
    isOwner: false,
    isModerator: false,
    isVerified: false,
    tags: ['blockchain', 'technology', 'innovation', 'future'],
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    owner: {
      name: 'David Kim',
      avatar: '/api/placeholder/32/32'
    },
    recentPosts: [
      {
        title: 'Web3 Development Best Practices',
        author: 'John Smith',
        replies: 67,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ]
  },
  {
    id: '5',
    name: 'Beginner\'s Corner',
    description: 'A welcoming space for newcomers to learn, ask questions, and get started on their journey.',
    image: '/api/placeholder/300/200',
    category: 'Education',
    type: 'public',
    memberCount: 5678,
    postCount: 3421,
    isJoined: true,
    isOwner: false,
    isModerator: false,
    isVerified: true,
    tags: ['beginners', 'learning', 'help', 'education'],
    lastActivity: new Date(Date.now() - 15 * 60 * 1000),
    owner: {
      name: 'Maria Garcia',
      avatar: '/api/placeholder/32/32'
    },
    recentPosts: [
      {
        title: 'Getting Started Guide 2024',
        author: 'Maria Garcia',
        replies: 89,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ]
  }
]

const categories = [
  { id: 'all', name: 'All Categories', icon: Grid, count: 25 },
  { id: 'creative', name: 'Creative', icon: Palette, count: 8 },
  { id: 'investment', name: 'Investment', icon: TrendingUp, count: 5 },
  { id: 'technology', name: 'Technology', icon: Code, count: 6 },
  { id: 'education', name: 'Education', icon: BookOpen, count: 4 },
  { id: 'exclusive', name: 'Exclusive', icon: Crown, count: 2 }
]

const getCommunityTypeIcon = (type: string) => {
  switch (type) {
    case 'private': return <Lock className="h-4 w-4 text-yellow-500" />
    case 'public': return <Globe className="h-4 w-4 text-green-500" />
    default: return <Users className="h-4 w-4 text-gray-500" />
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function CommunitiesPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('discover')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [communities, setCommunities] = useState(mockCommunities)

  const handleJoinCommunity = (communityId: string) => {
    setCommunities(communities.map(community => 
      community.id === communityId 
        ? {
            ...community,
            isJoined: !community.isJoined,
            memberCount: community.isJoined 
              ? community.memberCount - 1 
              : community.memberCount + 1
          }
        : community
    ))
    
    const community = communities.find(c => c.id === communityId)
    if (community) {
      toast.success(
        community.isJoined 
          ? `Left ${community.name}` 
          : `Joined ${community.name}`
      )
    }
  }

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                           community.category.toLowerCase() === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const joinedCommunities = communities.filter(c => c.isJoined)
  const ownedCommunities = communities.filter(c => c.isOwner)
  const moderatedCommunities = communities.filter(c => c.isModerator)

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Communities
            </h1>
            <p className="text-gray-600">Connect with like-minded creators and investors</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Joined Communities</p>
                  <p className="text-2xl font-bold">{joinedCommunities.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(joinedCommunities.reduce((sum, c) => sum + c.memberCount, 0))}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Moderating</p>
                  <p className="text-2xl font-bold">{moderatedCommunities.length}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Owned</p>
                  <p className="text-2xl font-bold">{ownedCommunities.length}</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="joined">My Communities</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Categories Sidebar */}
              <div className="lg:w-64">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors ${
                              selectedCategory === category.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <Badge variant="outline">{category.count}</Badge>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Communities Grid */}
              <div className="flex-1">
                {/* Search and View Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search communities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Communities List */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredCommunities.map((community) => (
                    <Card key={community.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <Image
                          src={community.image}
                          alt={community.name}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          {getCommunityTypeIcon(community.type)}
                          {community.isVerified && (
                            <div className="bg-blue-500 rounded-full p-1">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">{community.category}</Badge>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-lg">{community.name}</h3>
                              {community.isJoined && (
                                <Badge variant="outline" className="text-green-600">
                                  Joined
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {formatNumber(community.memberCount)} members
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {formatNumber(community.postCount)} posts
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {community.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={community.owner.avatar} />
                                <AvatarFallback>{community.owner.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-600">{community.owner.name}</span>
                            </div>
                            
                            <Button
                              size="sm"
                              variant={community.isJoined ? "outline" : "default"}
                              onClick={() => handleJoinCommunity(community.id)}
                              disabled={community.type === 'private' && !community.isJoined}
                            >
                              {community.isJoined ? 'Leave' : 
                               community.type === 'private' ? 'Request' : 'Join'}
                            </Button>
                          </div>

                          {community.recentPosts.length > 0 && (
                            <div className="pt-2 border-t">
                              <div className="text-xs text-gray-500 mb-1">Latest post:</div>
                              <div className="text-sm">
                                <div className="font-medium">{community.recentPosts[0].title}</div>
                                <div className="text-gray-500 text-xs">
                                  by {community.recentPosts[0].author} • {community.recentPosts[0].replies} replies
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredCommunities.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search or category filters.</p>
                    <Button onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="joined" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedCommunities.map((community) => (
                <Card key={community.id} className="overflow-hidden">
                  <div className="relative">
                    <Image
                      src={community.image}
                      alt={community.name}
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {community.isOwner && (
                        <Badge className="bg-yellow-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                      {community.isModerator && (
                        <Badge className="bg-purple-500">
                          <Shield className="h-3 w-3 mr-1" />
                          Mod
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{community.name}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{formatNumber(community.memberCount)} members</span>
                      <span>Active {formatDistanceToNow(community.lastActivity)} ago</span>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bell className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {joinedCommunities.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No communities joined yet</h3>
                <p className="text-gray-500 mb-4">Discover and join communities that match your interests.</p>
                <Button onClick={() => setSelectedTab('discover')}>
                  Discover Communities
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trending Communities</h3>
              <p className="text-gray-500">Popular and fast-growing communities will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Community</CardTitle>
                  <CardDescription>
                    Build a space for people with shared interests to connect and collaborate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Community Creation</h3>
                    <p className="text-gray-500 mb-4">Community creation form would be implemented here</p>
                    <Button>
                      Start Creating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
