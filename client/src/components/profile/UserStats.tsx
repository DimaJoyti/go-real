'use client'

import { useEffect, useState } from 'react'
import { Trophy, Film, Home, Users, Heart, Star, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface UserStatsProps {
  userId: string
  stats?: any
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: string
  color: string
  progress?: number
  maxValue?: number
}

function StatCard({ title, value, icon, description, color, progress, maxValue }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{value.toLocaleString()}</span>
              {maxValue && (
                <span className="text-sm text-muted-foreground">/ {maxValue}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {progress !== undefined && (
              <Progress value={progress} className="h-2" />
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function UserStats({ userId, stats }: UserStatsProps) {
  const [userStats, setUserStats] = useState(stats)
  const [loading, setLoading] = useState(!stats)

  useEffect(() => {
    if (!stats) {
      const loadStats = async () => {
        try {
          const { data, error } = await api.getUserStats(userId)
          if (!error && data) {
            setUserStats(data[0])
          }
        } catch (error) {
          console.error('Error loading user stats:', error)
        } finally {
          setLoading(false)
        }
      }

      loadStats()
    }
  }, [userId, stats])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!userStats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load user statistics</p>
        </CardContent>
      </Card>
    )
  }

  const achievements = [
    {
      name: 'First Challenge',
      description: 'Created your first challenge',
      earned: userStats.challenges_created > 0,
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      name: 'Film Creator',
      description: 'Uploaded your first film',
      earned: userStats.films_created > 0,
      icon: <Film className="h-4 w-4" />,
    },
    {
      name: 'Property Owner',
      description: 'Listed your first property',
      earned: userStats.properties_created > 0,
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: 'Popular Creator',
      description: 'Received 100+ likes',
      earned: userStats.total_likes_received >= 100,
      icon: <Heart className="h-4 w-4" />,
    },
    {
      name: 'Community Builder',
      description: 'Have 50+ followers',
      earned: userStats.followers_count >= 50,
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: 'Rising Star',
      description: 'Created 10+ pieces of content',
      earned: (userStats.challenges_created + userStats.films_created) >= 10,
      icon: <Star className="h-4 w-4" />,
    },
  ]

  const earnedAchievements = achievements.filter(a => a.earned)
  const totalAchievements = achievements.length

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Challenges Created"
          value={userStats.challenges_created}
          icon={<Trophy className="h-5 w-5 text-white" />}
          description="Total challenges you've created"
          color="bg-yellow-500"
        />
        
        <StatCard
          title="Challenges Joined"
          value={userStats.challenges_participated}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          description="Challenges you've participated in"
          color="bg-blue-500"
        />
        
        <StatCard
          title="Films Created"
          value={userStats.films_created}
          icon={<Film className="h-5 w-5 text-white" />}
          description="Total films you've uploaded"
          color="bg-purple-500"
        />
        
        <StatCard
          title="Properties Listed"
          value={userStats.properties_created}
          icon={<Home className="h-5 w-5 text-white" />}
          description="Real estate properties listed"
          color="bg-green-500"
        />
        
        <StatCard
          title="Total Likes"
          value={userStats.total_likes_received}
          icon={<Heart className="h-5 w-5 text-white" />}
          description="Likes received on your content"
          color="bg-red-500"
        />
        
        <StatCard
          title="Followers"
          value={userStats.followers_count}
          icon={<Users className="h-5 w-5 text-white" />}
          description="People following your content"
          color="bg-indigo-500"
        />
        
        <StatCard
          title="Following"
          value={userStats.following_count}
          icon={<Users className="h-5 w-5 text-white" />}
          description="Creators you're following"
          color="bg-pink-500"
        />
        
        <StatCard
          title="Achievements"
          value={earnedAchievements.length}
          icon={<Star className="h-5 w-5 text-white" />}
          description="Achievements unlocked"
          color="bg-orange-500"
          progress={(earnedAchievements.length / totalAchievements) * 100}
          maxValue={totalAchievements}
        />
      </div>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Your progress and milestones on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-colors ${
                  achievement.earned
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      achievement.earned
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      {achievement.earned && (
                        <Badge variant="secondary" className="text-xs">
                          Earned
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
