'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Search, Filter, Plus, Trophy, Users, Calendar, Tag, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface Challenge {
  id: string
  title: string
  description: string
  creator_id: string
  creator?: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  start_date?: string
  end_date?: string
  reward_amount?: number
  reward_type: 'nft' | 'token' | 'points' | 'badge'
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  current_participants: number
  max_participants?: number
  tags: string[]
  image_url?: string
  created_at: string
}

interface ChallengeFilters {
  search: string
  status: string
  rewardType: string
  tag: string
  sortBy: string
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const router = useRouter()
  const { user } = useAuth()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'nft': return '🏆'
      case 'token': return '💰'
      case 'points': return '⭐'
      case 'badge': return '🏅'
      default: return '🎁'
    }
  }

  const isCreator = user?.id === challenge.creator_id
  const participationRate = challenge.max_participants 
    ? (challenge.current_participants / challenge.max_participants) * 100 
    : 0

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={() => router.push(`/challenges/${challenge.id}`)}>
        {challenge.image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {challenge.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {challenge.description}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(challenge.status)}>
              {challenge.status}
            </Badge>
          </div>

          {/* Creator Info */}
          {challenge.creator && (
            <div className="flex items-center gap-2 pt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={challenge.creator.avatar_url} />
                <AvatarFallback className="text-xs">
                  {challenge.creator.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                by {challenge.creator.username}
              </span>
              {isCreator && (
                <Badge variant="outline" className="text-xs">
                  Your Challenge
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {challenge.current_participants}
                {challenge.max_participants && ` / ${challenge.max_participants}`} participants
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getRewardIcon(challenge.reward_type)}</span>
              <span className="capitalize">{challenge.reward_type} reward</span>
            </div>
          </div>

          {/* Progress Bar */}
          {challenge.max_participants && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Participation</span>
                <span>{Math.round(participationRate)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(participationRate, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Timeline */}
          {(challenge.start_date || challenge.end_date) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {challenge.end_date ? (
                <span>
                  Ends {formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}
                </span>
              ) : challenge.start_date ? (
                <span>
                  Starts {formatDistanceToNow(new Date(challenge.start_date), { addSuffix: true })}
                </span>
              ) : (
                <span>No deadline</span>
              )}
            </div>
          )}

          {/* Tags */}
          {challenge.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {challenge.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {challenge.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{challenge.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

export function ChallengeList() {
  const { user } = useAuth()
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [trendingChallenges, setTrendingChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ChallengeFilters>({
    search: '',
    status: 'all',
    rewardType: 'all',
    tag: 'all',
    sortBy: 'newest',
  })

  const loadChallenges = async () => {
    try {
      setLoading(true)
      
      const queryFilters: any = {}
      
      if (filters.status !== 'all') {
        queryFilters.status = filters.status
      }
      
      const { data, error } = await api.getChallenges(queryFilters)
      
      if (error) {
        console.error('Error loading challenges:', error)
        return
      }

      let filteredChallenges = data || []

      // Apply client-side filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredChallenges = filteredChallenges.filter((challenge: Challenge) =>
          challenge.title.toLowerCase().includes(searchLower) ||
          challenge.description.toLowerCase().includes(searchLower) ||
          challenge.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      if (filters.rewardType !== 'all') {
        filteredChallenges = filteredChallenges.filter((challenge: Challenge) =>
          challenge.reward_type === filters.rewardType
        )
      }

      if (filters.tag !== 'all') {
        filteredChallenges = filteredChallenges.filter((challenge: Challenge) =>
          challenge.tags.includes(filters.tag)
        )
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          filteredChallenges.sort((a: Challenge, b: Challenge) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          break
        case 'popular':
          filteredChallenges.sort((a: Challenge, b: Challenge) => 
            b.current_participants - a.current_participants
          )
          break
        case 'ending_soon':
          filteredChallenges = filteredChallenges
            .filter((c: Challenge) => c.end_date)
            .sort((a: Challenge, b: Challenge) => 
              new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime()
            )
          break
      }

      setChallenges(filteredChallenges)
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrendingChallenges = async () => {
    try {
      const { data, error } = await api.getTrendingChallenges(6)
      if (!error && data) {
        setTrendingChallenges(data)
      }
    } catch (error) {
      console.error('Error loading trending challenges:', error)
    }
  }

  useEffect(() => {
    loadChallenges()
  }, [filters])

  useEffect(() => {
    loadTrendingChallenges()
  }, [])

  const updateFilter = (key: keyof ChallengeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const allTags = Array.from(
    new Set(challenges.flatMap(challenge => challenge.tags))
  ).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">
            Discover and participate in exciting challenges
          </p>
        </div>
        {user && (
          <Button onClick={() => router.push('/challenges/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Challenges</TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="my-challenges" disabled={!user}>
            My Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search challenges..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.rewardType} onValueChange={(value) => updateFilter('rewardType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Reward Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rewards</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                    <SelectItem value="token">Token</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="ending_soon">Ending Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {allTags.length > 0 && (
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Filter by tags:</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={filters.tag === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateFilter('tag', 'all')}
                    >
                      All
                    </Badge>
                    {allTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag}
                        variant={filters.tag === tag ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => updateFilter('tag', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Challenge Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : challenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No challenges found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or create the first challenge!
                </p>
                {user && (
                  <Button onClick={() => router.push('/challenges/create')}>
                    Create Challenge
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          {trendingChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No trending challenges yet</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for popular challenges!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-challenges" className="space-y-6">
          {user ? (
            <div>
              {/* User's challenges will be loaded here */}
              <p className="text-muted-foreground">Your challenges will appear here.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Sign in to view your challenges</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create an account to start creating and participating in challenges.
                </p>
                <Button onClick={() => router.push('/sign-in')}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
