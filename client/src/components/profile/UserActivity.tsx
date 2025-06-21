'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trophy, Film, Home, Heart, MessageCircle, Users, Calendar } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'

interface UserActivityProps {
  userId: string
}

interface ActivityItem {
  id: string
  type: 'challenge' | 'film' | 'property' | 'like' | 'comment' | 'follow'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

function ActivityIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4"
  
  switch (type) {
    case 'challenge':
      return <Trophy className={`${iconClass} text-yellow-500`} />
    case 'film':
      return <Film className={`${iconClass} text-purple-500`} />
    case 'property':
      return <Home className={`${iconClass} text-green-500`} />
    case 'like':
      return <Heart className={`${iconClass} text-red-500`} />
    case 'comment':
      return <MessageCircle className={`${iconClass} text-blue-500`} />
    case 'follow':
      return <Users className={`${iconClass} text-indigo-500`} />
    default:
      return <Calendar className={`${iconClass} text-gray-500`} />
  }
}

function ActivityItem({ activity }: { activity: ActivityItem }) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-2 bg-background border rounded-full">
        <ActivityIcon type={activity.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm">{activity.title}</h4>
          <Badge variant="outline" className="text-xs">
            {activity.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}

export function UserActivity({ userId }: UserActivityProps) {
  const [challenges, setChallenges] = useState<any[]>([])
  const [films, setFilms] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserContent = async () => {
      try {
        setLoading(true)
        
        // Load user's challenges
        const { data: challengesData } = await api.getChallenges({ creator_id: userId })
        setChallenges(challengesData || [])
        
        // Load user's films
        const { data: filmsData } = await api.getFilms({ creator_id: userId })
        setFilms(filmsData || [])
        
        // Load user's properties
        const { data: propertiesData } = await api.getProperties({ creator_id: userId })
        setProperties(propertiesData || [])
        
      } catch (error) {
        console.error('Error loading user content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserContent()
  }, [userId])

  // Generate activity timeline from user content
  const generateActivity = (): ActivityItem[] => {
    const activities: ActivityItem[] = []

    // Add challenges
    challenges.forEach((challenge: any) => {
      activities.push({
        id: `challenge-${challenge.id}`,
        type: 'challenge',
        title: 'Created Challenge',
        description: challenge.title,
        timestamp: challenge.created_at,
        metadata: challenge,
      })
    })

    // Add films
    films.forEach((film: any) => {
      activities.push({
        id: `film-${film.id}`,
        type: 'film',
        title: 'Uploaded Film',
        description: film.title,
        timestamp: film.created_at,
        metadata: film,
      })
    })

    // Add properties
    properties.forEach((property: any) => {
      activities.push({
        id: `property-${property.id}`,
        type: 'property',
        title: 'Listed Property',
        description: property.name,
        timestamp: property.created_at,
        metadata: property,
      })
    })

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  const allActivity = generateActivity()
  const recentActivity = allActivity.slice(0, 10)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Your recent activity on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="films">Films</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest actions on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No recent activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Start creating challenges, uploading films, or listing properties to see your activity here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Challenges</CardTitle>
              <CardDescription>
                Challenges you've created ({challenges.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {challenges.length > 0 ? (
                <div className="space-y-4">
                  {challenges.map((challenge: any) => (
                    <div key={challenge.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 border rounded-full">
                        <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{challenge.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{challenge.current_participants} participants</span>
                          <span>Status: {challenge.status}</span>
                          <span>{formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No challenges created</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first challenge to engage with the community.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="films" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Films</CardTitle>
              <CardDescription>
                Films you've uploaded ({films.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {films.length > 0 ? (
                <div className="space-y-4">
                  {films.map((film: any) => (
                    <div key={film.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 border rounded-full">
                        <Film className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{film.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {film.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{film.view_count} views</span>
                          <span>{film.like_count} likes</span>
                          <span>Status: {film.status}</span>
                          <span>{formatDistanceToNow(new Date(film.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No films uploaded</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your first film to start sharing your creativity.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>
                Properties you've listed ({properties.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {properties.length > 0 ? (
                <div className="space-y-4">
                  {properties.map((property: any) => (
                    <div key={property.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 bg-green-100 dark:bg-green-900 border rounded-full">
                        <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{property.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {property.address}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>${property.total_value.toLocaleString()}</span>
                          <span>Type: {property.property_type}</span>
                          <span>Status: {property.status}</span>
                          <span>{formatDistanceToNow(new Date(property.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No properties listed</h3>
                  <p className="text-sm text-muted-foreground">
                    List your first property to start tokenizing real estate.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
