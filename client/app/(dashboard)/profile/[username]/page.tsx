'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  UserPlus,
  UserMinus,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Star,
  Award,
  Trophy,
  Target,
  Film,
  Camera,
  Play,
  Heart,
  Eye,
  TrendingUp,
  Users,
  Bookmark,
  Grid,
  List,
  Settings,
  Shield,
  Verified,
  Crown,
  Zap,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Linkedin
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

// Mock user profile data
const mockProfile = {
  id: '1',
  username: 'sarahj_films',
  name: 'Sarah Johnson',
  displayName: 'Sarah J.',
  avatar: '/api/placeholder/120/120',
  coverImage: '/api/placeholder/800/300',
  bio: 'Filmmaker & Visual Storyteller 🎬 | Exploring human connections through cinema | NFT Real Estate Investor 🏢 | Building the future of creative communities ✨',
  location: 'Los Angeles, CA',
  website: 'https://sarahjfilms.com',
  joinedDate: new Date('2023-01-15'),
  isVerified: true,
  isFollowing: false,
  isFollowedBy: false,
  isBlocked: false,
  stats: {
    followers: 12500,
    following: 890,
    posts: 156,
    likes: 45600,
    views: 2340000,
    challengesWon: 8,
    nftInvestments: 12,
    totalInvestmentValue: 125000
  },
  badges: [
    {
      id: 'verified',
      name: 'Verified Creator',
      icon: '✓',
      color: 'blue',
      description: 'Verified content creator'
    },
    {
      id: 'rising-star',
      name: 'Rising Star',
      icon: '⭐',
      color: 'yellow',
      description: 'Reached 10K followers'
    },
    {
      id: 'challenge-master',
      name: 'Challenge Master',
      icon: '🏆',
      color: 'gold',
      description: 'Won 5+ challenges'
    },
    {
      id: 'investor',
      name: 'Smart Investor',
      icon: '💎',
      color: 'green',
      description: 'Active NFT real estate investor'
    }
  ],
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com/sarahj_films', username: '@sarahj_films' },
    { platform: 'twitter', url: 'https://twitter.com/sarahj_films', username: '@sarahj_films' },
    { platform: 'youtube', url: 'https://youtube.com/sarahjfilms', username: 'Sarah J Films' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/sarahjohnson', username: 'Sarah Johnson' }
  ],
  recentActivity: [
    {
      type: 'challenge_win',
      title: 'Won Urban Storytelling Challenge',
      description: 'First place in the monthly challenge',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reward: '$500'
    },
    {
      type: 'nft_purchase',
      title: 'Invested in Downtown Apartment NFT',
      description: 'Purchased 25 shares',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      value: '$6,250'
    },
    {
      type: 'milestone',
      title: 'Reached 10K Followers',
      description: 'Unlocked Rising Star badge',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ],
  portfolio: [
    {
      id: '1',
      name: 'Downtown Luxury Apartment',
      shares: 25,
      value: 6250,
      yield: 8.5,
      image: '/api/placeholder/200/150'
    },
    {
      id: '2',
      name: 'Suburban Villa Complex',
      shares: 40,
      value: 18000,
      yield: 6.8,
      image: '/api/placeholder/200/150'
    },
    {
      id: '3',
      name: 'Commercial Office Space',
      shares: 15,
      value: 12000,
      yield: 12.3,
      image: '/api/placeholder/200/150'
    }
  ]
}

const mockPosts = [
  {
    id: '1',
    type: 'video',
    thumbnail: '/api/placeholder/300/300',
    title: 'Urban Stories: Chapter 1',
    views: 15600,
    likes: 890,
    duration: '2:34',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    type: 'image',
    thumbnail: '/api/placeholder/300/300',
    title: 'Behind the Scenes',
    views: 8900,
    likes: 456,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    type: 'video',
    thumbnail: '/api/placeholder/300/300',
    title: 'Cinematography Tips',
    views: 23400,
    likes: 1200,
    duration: '5:12',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
]

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'instagram': return <Instagram className="h-4 w-4" />
    case 'twitter': return <Twitter className="h-4 w-4" />
    case 'youtube': return <Youtube className="h-4 w-4" />
    case 'linkedin': return <Linkedin className="h-4 w-4" />
    default: return <Globe className="h-4 w-4" />
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

export default function ProfilePage() {
  const params = useParams()
  const { user } = useEnhancedAuth()
  const [profile, setProfile] = useState(mockProfile)
  const [posts, setPosts] = useState(mockPosts)
  const [selectedTab, setSelectedTab] = useState('posts')
  const [viewMode, setViewMode] = useState('grid')
  const [isOwnProfile] = useState(params.username === user?.username)

  const handleFollow = () => {
    setProfile(prev => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      stats: {
        ...prev.stats,
        followers: prev.isFollowing 
          ? prev.stats.followers - 1 
          : prev.stats.followers + 1
      }
    }))
    
    toast.success(
      profile.isFollowing 
        ? `Unfollowed ${profile.name}` 
        : `Following ${profile.name}`
    )
  }

  const handleMessage = () => {
    toast.success(`Opening chat with ${profile.name}`)
    // Would navigate to messages page
  }

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Cover Image */}
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <Image
            src={profile.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile Header */}
        <div className="relative -mt-20 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl">{profile.name[0]}</AvatarFallback>
              </Avatar>
              {profile.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                  <Verified className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    {profile.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Star className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">@{profile.username}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {profile.joinedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    {profile.website && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isOwnProfile && (
                    <>
                      <Button
                        variant={profile.isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                      >
                        {profile.isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleMessage}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                  {isOwnProfile && (
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <p className="text-gray-700 max-w-3xl">{profile.bio}</p>
          </div>

          {/* Social Links */}
          {profile.socialLinks.length > 0 && (
            <div className="flex gap-3 mt-4">
              {profile.socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {getSocialIcon(link.platform)}
                  <span className="text-sm">{link.username}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(profile.stats.followers)}</div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(profile.stats.following)}</div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.posts}</div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(profile.stats.likes)}</div>
            <div className="text-sm text-gray-500">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(profile.stats.views)}</div>
            <div className="text-sm text-gray-500">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.challengesWon}</div>
            <div className="text-sm text-gray-500">Challenges Won</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.stats.nftInvestments}</div>
            <div className="text-sm text-gray-500">NFT Properties</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(profile.stats.totalInvestmentValue)}</div>
            <div className="text-sm text-gray-500">Portfolio Value</div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-2xl">{badge.icon}</div>
                <div>
                  <div className="font-medium">{badge.name}</div>
                  <div className="text-sm text-gray-500">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            {selectedTab === 'posts' && (
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
            )}
          </div>

          <TabsContent value="posts" className="space-y-4">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    {post.type === 'video' && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          {post.duration}
                        </div>
                      </>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{post.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(post.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatNumber(post.likes)}
                        </div>
                      </div>
                      <span>{formatDistanceToNow(post.timestamp)} ago</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.portfolio.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative">
                    <Image
                      src={property.image}
                      alt={property.name}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{property.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Shares Owned:</span>
                        <span className="font-medium">{property.shares}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Value:</span>
                        <span className="font-medium">{formatCurrency(property.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yield:</span>
                        <span className="font-medium text-green-600">{property.yield}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-4">
              {profile.recentActivity.map((activity, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        {activity.type === 'challenge_win' && <Trophy className="h-5 w-5 text-blue-600" />}
                        {activity.type === 'nft_purchase' && <TrendingUp className="h-5 w-5 text-green-600" />}
                        {activity.type === 'milestone' && <Star className="h-5 w-5 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{activity.title}</h4>
                        <p className="text-gray-600 text-sm">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{formatDistanceToNow(activity.timestamp)} ago</span>
                          {activity.reward && (
                            <Badge variant="outline" className="text-green-600">
                              {activity.reward}
                            </Badge>
                          )}
                          {activity.value && (
                            <Badge variant="outline" className="text-blue-600">
                              {activity.value}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About {profile.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Bio</h4>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Filmmaking</Badge>
                    <Badge variant="outline">Cinematography</Badge>
                    <Badge variant="outline">Real Estate</Badge>
                    <Badge variant="outline">NFTs</Badge>
                    <Badge variant="outline">Storytelling</Badge>
                    <Badge variant="outline">Visual Arts</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Video Production</span>
                        <span className="text-sm">95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Storytelling</span>
                        <span className="text-sm">90%</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Investment Analysis</span>
                        <span className="text-sm">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
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
