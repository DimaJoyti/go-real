'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Award,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Star,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Send,
  Image as ImageIcon,
  Video,
  Mic,
  Smile,
  Hash,
  AtSign,
  Globe,
  Lock,
  UserPlus,
  Camera,
  Film,
  Trophy,
  Zap,
  Target
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

// Mock feed data
const mockPosts = [
  {
    id: '1',
    type: 'challenge_submission',
    author: {
      id: '1',
      name: 'Sarah Johnson',
      username: '@sarahj_films',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isFollowing: false
    },
    content: {
      text: 'Just submitted my entry for the #UrbanStorytelling challenge! This piece explores the hidden stories in everyday city life. Shot entirely on mobile with natural lighting. What do you think? 🎬✨',
      media: [
        {
          type: 'video',
          url: '/api/placeholder/600/400',
          thumbnail: '/api/placeholder/600/400',
          duration: '2:34'
        }
      ],
      challenge: {
        id: 'urban-storytelling',
        name: 'Urban Storytelling',
        hashtag: '#UrbanStorytelling'
      }
    },
    engagement: {
      likes: 234,
      comments: 45,
      shares: 12,
      views: 1250,
      isLiked: false,
      isBookmarked: false
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: 'New York, NY'
  },
  {
    id: '2',
    type: 'property_investment',
    author: {
      id: '2',
      name: 'Mike Chen',
      username: '@mikechen_investor',
      avatar: '/api/placeholder/40/40',
      isVerified: false,
      isFollowing: true
    },
    content: {
      text: 'Excited to announce my latest investment! Just purchased 50 shares in the Downtown Luxury Apartment NFT. The yield looks promising at 8.5% APY. Who else is investing in tokenized real estate? 🏢💰',
      media: [
        {
          type: 'image',
          url: '/api/placeholder/600/400'
        }
      ],
      property: {
        id: '1',
        name: 'Downtown Luxury Apartment',
        value: '$250,000',
        yield: '8.5%'
      }
    },
    engagement: {
      likes: 89,
      comments: 23,
      shares: 8,
      views: 456,
      isLiked: true,
      isBookmarked: false
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    location: 'San Francisco, CA'
  },
  {
    id: '3',
    type: 'achievement',
    author: {
      id: '3',
      name: 'Alex Rivera',
      username: '@alexr_creator',
      avatar: '/api/placeholder/40/40',
      isVerified: true,
      isFollowing: false
    },
    content: {
      text: 'Milestone achieved! 🎉 Just reached 10,000 followers and earned the "Rising Star" badge. Thank you all for the incredible support on my filmmaking journey. Next goal: 25K! 🚀',
      achievement: {
        id: 'rising-star',
        name: 'Rising Star',
        description: 'Reached 10,000 followers',
        icon: '⭐',
        rarity: 'rare'
      }
    },
    engagement: {
      likes: 567,
      comments: 89,
      shares: 34,
      views: 2340,
      isLiked: false,
      isBookmarked: true
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: '4',
    type: 'collaboration',
    author: {
      id: '4',
      name: 'Emma Davis',
      username: '@emmad_films',
      avatar: '/api/placeholder/40/40',
      isVerified: false,
      isFollowing: true
    },
    content: {
      text: 'Looking for a cinematographer for an upcoming short film project! The theme is "Future Cities" and we\'re aiming for a cyberpunk aesthetic. DM me if interested! 🎥🌆',
      media: [
        {
          type: 'image',
          url: '/api/placeholder/600/300'
        }
      ],
      collaboration: {
        type: 'seeking',
        role: 'Cinematographer',
        project: 'Future Cities Short Film'
      }
    },
    engagement: {
      likes: 156,
      comments: 67,
      shares: 23,
      views: 890,
      isLiked: false,
      isBookmarked: false
    },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    location: 'Los Angeles, CA'
  }
]

const getPostTypeIcon = (type: string) => {
  switch (type) {
    case 'challenge_submission': return <Target className="h-4 w-4 text-blue-500" />
    case 'property_investment': return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />
    case 'collaboration': return <Users className="h-4 w-4 text-purple-500" />
    default: return <Zap className="h-4 w-4 text-gray-500" />
  }
}

const getPostTypeLabel = (type: string) => {
  switch (type) {
    case 'challenge_submission': return 'Challenge Submission'
    case 'property_investment': return 'Investment Update'
    case 'achievement': return 'Achievement Unlocked'
    case 'collaboration': return 'Collaboration'
    default: return 'Post'
  }
}

export default function FeedPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('for-you')
  const [posts, setPosts] = useState(mockPosts)
  const [newPost, setNewPost] = useState('')
  const [isCreatingPost, setIsCreatingPost] = useState(false)

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              isLiked: !post.engagement.isLiked,
              likes: post.engagement.isLiked 
                ? post.engagement.likes - 1 
                : post.engagement.likes + 1
            }
          }
        : post
    ))
  }

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            engagement: {
              ...post.engagement,
              isBookmarked: !post.engagement.isBookmarked
            }
          }
        : post
    ))
    
    const post = posts.find(p => p.id === postId)
    if (post) {
      toast.success(
        post.engagement.isBookmarked 
          ? 'Removed from bookmarks' 
          : 'Added to bookmarks'
      )
    }
  }

  const handleFollow = (authorId: string) => {
    setPosts(posts.map(post => 
      post.author.id === authorId 
        ? {
            ...post,
            author: {
              ...post.author,
              isFollowing: !post.author.isFollowing
            }
          }
        : post
    ))
    
    const post = posts.find(p => p.author.id === authorId)
    if (post) {
      toast.success(
        post.author.isFollowing 
          ? `Unfollowed ${post.author.name}` 
          : `Following ${post.author.name}`
      )
    }
  }

  const handleCreatePost = () => {
    if (!newPost.trim()) return

    const post = {
      id: Date.now().toString(),
      type: 'general' as const,
      author: {
        id: 'current',
        name: user?.name || 'You',
        username: '@you',
        avatar: '/api/placeholder/40/40',
        isVerified: false,
        isFollowing: false
      },
      content: {
        text: newPost,
        media: []
      },
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        isLiked: false,
        isBookmarked: false
      },
      timestamp: new Date()
    }

    setPosts([post, ...posts])
    setNewPost('')
    setIsCreatingPost(false)
    toast.success('Post created successfully!')
  }

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Feed</h1>
          <p className="text-gray-600">Stay connected with the community</p>
        </div>

        {/* Create Post */}
        <Card className="mb-6">
          <CardContent className="p-4">
            {!isCreatingPost ? (
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setIsCreatingPost(true)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/api/placeholder/40/40" />
                  <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-gray-500">
                  What's on your mind?
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/api/placeholder/40/40" />
                    <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[100px] border-none resize-none focus:ring-0"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Photo
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Audio
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreatingPost(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPost.trim()}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feed Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="for-you" className="space-y-6 mt-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{post.author.name}</h4>
                            {post.author.isVerified && (
                              <Badge variant="secondary" className="h-5 px-1">
                                <Star className="h-3 w-3" />
                              </Badge>
                            )}
                            <span className="text-gray-500">{post.author.username}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 text-sm">
                              {formatDistanceToNow(post.timestamp)} ago
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getPostTypeIcon(post.type)}
                            <span className="text-sm text-gray-600">
                              {getPostTypeLabel(post.type)}
                            </span>
                            {post.location && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  {post.location}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!post.author.isFollowing && post.author.id !== 'current' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleFollow(post.author.id)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Follow
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{post.content.text}</p>
                    
                    {/* Challenge Badge */}
                    {post.content.challenge && (
                      <div className="mt-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Hash className="h-3 w-3 mr-1" />
                          {post.content.challenge.name}
                        </Badge>
                      </div>
                    )}

                    {/* Achievement Badge */}
                    {post.content.achievement && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{post.content.achievement.icon}</div>
                          <div>
                            <h5 className="font-semibold text-yellow-800">
                              {post.content.achievement.name}
                            </h5>
                            <p className="text-sm text-yellow-700">
                              {post.content.achievement.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {post.content.achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Property Investment */}
                    {post.content.property && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-green-800">
                              {post.content.property.name}
                            </h5>
                            <p className="text-sm text-green-700">
                              Value: {post.content.property.value} • Yield: {post.content.property.yield}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Property
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {post.content.media && post.content.media.length > 0 && (
                    <div className="relative">
                      {post.content.media[0].type === 'video' ? (
                        <div className="relative">
                          <Image
                            src={post.content.media[0].thumbnail || post.content.media[0].url}
                            alt="Video thumbnail"
                            width={600}
                            height={400}
                            className="w-full h-auto"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button size="lg" className="rounded-full w-16 h-16">
                              <Play className="h-6 w-6" />
                            </Button>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                            {post.content.media[0].duration}
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={post.content.media[0].url}
                          alt="Post image"
                          width={600}
                          height={400}
                          className="w-full h-auto"
                        />
                      )}
                    </div>
                  )}

                  {/* Engagement */}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-4">
                        <span>{post.engagement.likes} likes</span>
                        <span>{post.engagement.comments} comments</span>
                        <span>{post.engagement.shares} shares</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.engagement.views} views</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={post.engagement.isLiked ? 'text-red-500' : ''}
                        >
                          <Heart className={`h-4 w-4 mr-2 ${post.engagement.isLiked ? 'fill-current' : ''}`} />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(post.id)}
                        className={post.engagement.isBookmarked ? 'text-blue-500' : ''}
                      >
                        <Bookmark className={`h-4 w-4 ${post.engagement.isBookmarked ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="following" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Following Feed</h3>
              <p className="text-gray-500">Posts from people you follow will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trending Content</h3>
              <p className="text-gray-500">Popular posts and trending topics will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6 mt-6">
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Challenge Feed</h3>
              <p className="text-gray-500">Challenge submissions and updates will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
