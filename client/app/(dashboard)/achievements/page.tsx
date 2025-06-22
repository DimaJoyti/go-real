'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy,
  Star,
  Crown,
  Award,
  Target,
  Zap,
  TrendingUp,
  Users,
  Film,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Calendar,
  Eye,
  Flame,
  Shield,
  Gem,
  Medal,
  Gift,
  Lock,
  CheckCircle,
  Clock,
  BarChart3,
  Coins,
  Sparkles,
  Rocket,
  Lightning,
  Globe,
  Camera,
  Mic,
  Palette,
  Code,
  BookOpen
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

// Mock user stats
const userStats = {
  totalPoints: 15420,
  level: 12,
  nextLevelPoints: 18000,
  rank: 156,
  totalUsers: 25000,
  streakDays: 23,
  badgesEarned: 18,
  challengesCompleted: 34,
  filmsCreated: 12,
  investmentValue: 125000,
  socialScore: 8.7
}

// Mock achievements data
const achievements = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your profile and upload your first film',
    icon: '🎬',
    category: 'Getting Started',
    rarity: 'common',
    points: 100,
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    progress: 100,
    maxProgress: 100
  },
  {
    id: '2',
    name: 'Rising Star',
    description: 'Reach 10,000 followers',
    icon: '⭐',
    category: 'Social',
    rarity: 'rare',
    points: 500,
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    progress: 100,
    maxProgress: 100
  },
  {
    id: '3',
    name: 'Challenge Master',
    description: 'Win 5 challenges',
    icon: '🏆',
    category: 'Challenges',
    rarity: 'epic',
    points: 1000,
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    progress: 100,
    maxProgress: 100
  },
  {
    id: '4',
    name: 'Smart Investor',
    description: 'Invest in 10 different properties',
    icon: '💎',
    category: 'Investment',
    rarity: 'rare',
    points: 750,
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    progress: 100,
    maxProgress: 100
  },
  {
    id: '5',
    name: 'Content Creator',
    description: 'Upload 25 films',
    icon: '🎥',
    category: 'Content',
    rarity: 'uncommon',
    points: 300,
    isUnlocked: false,
    progress: 12,
    maxProgress: 25
  },
  {
    id: '6',
    name: 'Social Butterfly',
    description: 'Get 1,000 likes on your content',
    icon: '❤️',
    category: 'Social',
    rarity: 'uncommon',
    points: 250,
    isUnlocked: false,
    progress: 756,
    maxProgress: 1000
  },
  {
    id: '7',
    name: 'Millionaire',
    description: 'Reach $1M in total investment value',
    icon: '💰',
    category: 'Investment',
    rarity: 'legendary',
    points: 5000,
    isUnlocked: false,
    progress: 125000,
    maxProgress: 1000000
  },
  {
    id: '8',
    name: 'Community Leader',
    description: 'Create and manage a community with 500+ members',
    icon: '👑',
    category: 'Community',
    rarity: 'epic',
    points: 2000,
    isUnlocked: false,
    progress: 0,
    maxProgress: 500
  }
]

// Mock leaderboard data
const leaderboard = [
  {
    rank: 1,
    user: {
      name: 'Sarah Johnson',
      username: '@sarahj_films',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    points: 45600,
    level: 28,
    badges: 42,
    specialty: 'Filmmaker'
  },
  {
    rank: 2,
    user: {
      name: 'Alex Rivera',
      username: '@alexr_creator',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    points: 38900,
    level: 24,
    badges: 35,
    specialty: 'Investor'
  },
  {
    rank: 3,
    user: {
      name: 'Mike Chen',
      username: '@mikechen_investor',
      avatar: '/api/placeholder/40/40',
      isVerified: false
    },
    points: 32100,
    level: 21,
    badges: 28,
    specialty: 'Challenge Master'
  },
  {
    rank: 4,
    user: {
      name: 'Emma Davis',
      username: '@emmad_films',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    points: 28750,
    level: 19,
    badges: 31,
    specialty: 'Community Leader'
  },
  {
    rank: 5,
    user: {
      name: 'David Kim',
      username: '@davidk_tech',
      avatar: '/api/placeholder/40/40',
      isVerified: false
    },
    points: 25400,
    level: 17,
    badges: 24,
    specialty: 'Tech Innovator'
  }
]

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'uncommon': return 'bg-green-100 text-green-800 border-green-300'
    case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getRarityGlow = (rarity: string) => {
  switch (rarity) {
    case 'epic': return 'shadow-lg shadow-purple-200'
    case 'legendary': return 'shadow-lg shadow-yellow-200'
    default: return ''
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AchievementsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const unlockedAchievements = achievements.filter(a => a.isUnlocked)
  const lockedAchievements = achievements.filter(a => !a.isUnlocked)
  
  const categories = [
    { id: 'all', name: 'All', count: achievements.length },
    { id: 'Getting Started', name: 'Getting Started', count: achievements.filter(a => a.category === 'Getting Started').length },
    { id: 'Social', name: 'Social', count: achievements.filter(a => a.category === 'Social').length },
    { id: 'Challenges', name: 'Challenges', count: achievements.filter(a => a.category === 'Challenges').length },
    { id: 'Investment', name: 'Investment', count: achievements.filter(a => a.category === 'Investment').length },
    { id: 'Content', name: 'Content', count: achievements.filter(a => a.category === 'Content').length },
    { id: 'Community', name: 'Community', count: achievements.filter(a => a.category === 'Community').length }
  ]

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const levelProgress = ((userStats.totalPoints % 1000) / 1000) * 100

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Achievements & Rewards
          </h1>
          <p className="text-gray-600 text-lg">Track your progress and unlock amazing rewards</p>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{formatNumber(userStats.totalPoints)}</div>
              <div className="text-sm text-gray-600">Total Points</div>
              <div className="mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Level {userStats.level}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">#{userStats.rank}</div>
              <div className="text-sm text-gray-600">Global Rank</div>
              <div className="text-xs text-gray-500 mt-1">
                Top {((userStats.rank / userStats.totalUsers) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{userStats.badgesEarned}</div>
              <div className="text-sm text-gray-600">Badges Earned</div>
              <div className="mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {userStats.streakDays} day streak
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">{userStats.socialScore}</div>
              <div className="text-sm text-gray-600">Social Score</div>
              <div className="text-xs text-gray-500 mt-1">
                Based on engagement
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Level {userStats.level}</h3>
                <p className="text-gray-600">
                  {formatNumber(userStats.nextLevelPoints - userStats.totalPoints)} points to next level
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(userStats.totalPoints)}
                </div>
                <div className="text-sm text-gray-500">
                  / {formatNumber(userStats.nextLevelPoints)}
                </div>
              </div>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
                <CardDescription>Your latest unlocked achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements.slice(0, 6).map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 border rounded-lg ${getRarityColor(achievement.rarity)} ${getRarityGlow(achievement.rarity)}`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h4 className="font-semibold mb-1">{achievement.name}</h4>
                        <p className="text-sm opacity-80 mb-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {achievement.rarity}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="h-3 w-3" />
                            {achievement.points}
                          </div>
                        </div>
                        <div className="text-xs opacity-60 mt-2">
                          Unlocked {formatDistanceToNow(achievement.unlockedAt)} ago
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  In Progress
                </CardTitle>
                <CardDescription>Achievements you're working towards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lockedAchievements.slice(0, 4).map((achievement) => (
                    <div key={achievement.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl opacity-50">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                                {achievement.rarity}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Coins className="h-3 w-3" />
                                {achievement.points}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{formatNumber(achievement.progress)} / {formatNumber(achievement.maxProgress)}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / achievement.maxProgress) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAchievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    achievement.isUnlocked ? '' : 'opacity-75'
                  } ${getRarityGlow(achievement.rarity)}`}
                >
                  {achievement.isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  {!achievement.isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  
                  <CardContent className="p-6 text-center">
                    <div className={`text-4xl mb-3 ${achievement.isUnlocked ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          {achievement.points}
                        </div>
                      </div>
                      
                      {!achievement.isUnlocked && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{formatNumber(achievement.progress)} / {formatNumber(achievement.maxProgress)}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.maxProgress) * 100} 
                            className="h-1"
                          />
                        </div>
                      )}
                      
                      {achievement.isUnlocked && (
                        <div className="text-xs text-green-600">
                          Unlocked {formatDistanceToNow(achievement.unlockedAt)} ago
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Global Leaderboard
                </CardTitle>
                <CardDescription>Top performers on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.rank}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {entry.rank === 1 && <Crown className="h-8 w-8 text-yellow-500" />}
                        {entry.rank === 2 && <Medal className="h-8 w-8 text-gray-400" />}
                        {entry.rank === 3 && <Award className="h-8 w-8 text-orange-500" />}
                        {entry.rank > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                            {entry.rank}
                          </div>
                        )}
                      </div>
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.user.avatar} />
                        <AvatarFallback>{entry.user.name[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{entry.user.name}</h4>
                          {entry.user.isVerified && (
                            <Star className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="text-gray-500">{entry.user.username}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Level {entry.level}</span>
                          <span>{entry.badges} badges</span>
                          <Badge variant="outline" className="text-xs">
                            {entry.specialty}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          {formatNumber(entry.points)}
                        </div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                      {userStats.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/api/placeholder/40/40" />
                      <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">You</h4>
                      <div className="text-sm text-gray-600">
                        Level {userStats.level} • {userStats.badgesEarned} badges
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {formatNumber(userStats.totalPoints)}
                      </div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
