'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Zap,
  Globe,
  Clock,
  Award,
  Film,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Crown,
  Shield,
  Sparkles
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Mock analytics data
const socialMetrics = {
  overview: {
    totalFollowers: 12500,
    followersGrowth: 8.5,
    totalEngagement: 45600,
    engagementGrowth: 12.3,
    totalReach: 234000,
    reachGrowth: -2.1,
    avgEngagementRate: 4.2,
    engagementRateGrowth: 0.8
  },
  content: {
    totalPosts: 156,
    postsGrowth: 15.2,
    totalViews: 2340000,
    viewsGrowth: 18.7,
    totalLikes: 89400,
    likesGrowth: 22.1,
    totalComments: 12800,
    commentsGrowth: 16.5,
    totalShares: 5600,
    sharesGrowth: 9.8
  },
  audience: {
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 28, count: 3500 },
        { range: '25-34', percentage: 35, count: 4375 },
        { range: '35-44', percentage: 22, count: 2750 },
        { range: '45-54', percentage: 10, count: 1250 },
        { range: '55+', percentage: 5, count: 625 }
      ],
      locations: [
        { country: 'United States', percentage: 45, count: 5625 },
        { country: 'Canada', percentage: 15, count: 1875 },
        { country: 'United Kingdom', percentage: 12, count: 1500 },
        { country: 'Australia', percentage: 8, count: 1000 },
        { country: 'Germany', percentage: 6, count: 750 },
        { country: 'Others', percentage: 14, count: 1750 }
      ],
      interests: [
        { category: 'Filmmaking', percentage: 68, count: 8500 },
        { category: 'Real Estate', percentage: 45, count: 5625 },
        { category: 'Technology', percentage: 38, count: 4750 },
        { category: 'Investment', percentage: 32, count: 4000 },
        { category: 'Art & Design', percentage: 28, count: 3500 }
      ]
    }
  },
  topContent: [
    {
      id: '1',
      title: 'Urban Stories: Chapter 1',
      type: 'video',
      views: 45600,
      likes: 2340,
      comments: 156,
      shares: 89,
      engagementRate: 5.8,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Behind the Scenes: Cinematography Tips',
      type: 'video',
      views: 32100,
      likes: 1890,
      comments: 234,
      shares: 67,
      engagementRate: 6.9,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Investment Update: Q4 Portfolio Review',
      type: 'post',
      views: 28900,
      likes: 1456,
      comments: 89,
      shares: 45,
      engagementRate: 5.5,
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ],
  engagement: {
    hourlyData: [
      { hour: '00:00', engagement: 120 },
      { hour: '03:00', engagement: 80 },
      { hour: '06:00', engagement: 150 },
      { hour: '09:00', engagement: 320 },
      { hour: '12:00', engagement: 450 },
      { hour: '15:00', engagement: 380 },
      { hour: '18:00', engagement: 520 },
      { hour: '21:00', engagement: 480 }
    ],
    weeklyData: [
      { day: 'Mon', engagement: 2340 },
      { day: 'Tue', engagement: 2890 },
      { day: 'Wed', engagement: 3120 },
      { day: 'Thu', engagement: 2760 },
      { day: 'Fri', engagement: 3450 },
      { day: 'Sat', engagement: 4200 },
      { day: 'Sun', engagement: 3890 }
    ]
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

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

const getGrowthIcon = (growth: number) => {
  if (growth > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />
  if (growth < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-gray-500" />
}

const getGrowthColor = (growth: number) => {
  if (growth > 0) return 'text-green-600'
  if (growth < 0) return 'text-red-600'
  return 'text-gray-600'
}

export default function SocialAnalyticsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('30d')

  const handleExportData = () => {
    toast.success('Analytics data exported successfully!')
  }

  const handleRefreshData = () => {
    toast.success('Analytics data refreshed!')
  }

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Social Analytics
            </h1>
            <p className="text-gray-600">Track your social engagement and content performance</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Followers</p>
                  <p className="text-2xl font-bold">{formatNumber(socialMetrics.overview.totalFollowers)}</p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(socialMetrics.overview.followersGrowth)}`}>
                    {getGrowthIcon(socialMetrics.overview.followersGrowth)}
                    {formatPercentage(socialMetrics.overview.followersGrowth)}
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                  <p className="text-2xl font-bold">{formatNumber(socialMetrics.overview.totalEngagement)}</p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(socialMetrics.overview.engagementGrowth)}`}>
                    {getGrowthIcon(socialMetrics.overview.engagementGrowth)}
                    {formatPercentage(socialMetrics.overview.engagementGrowth)}
                  </div>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reach</p>
                  <p className="text-2xl font-bold">{formatNumber(socialMetrics.overview.totalReach)}</p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(socialMetrics.overview.reachGrowth)}`}>
                    {getGrowthIcon(socialMetrics.overview.reachGrowth)}
                    {formatPercentage(socialMetrics.overview.reachGrowth)}
                  </div>
                </div>
                <Globe className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                  <p className="text-2xl font-bold">{socialMetrics.overview.avgEngagementRate}%</p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(socialMetrics.overview.engagementRateGrowth)}`}>
                    {getGrowthIcon(socialMetrics.overview.engagementRateGrowth)}
                    {formatPercentage(socialMetrics.overview.engagementRateGrowth)}
                  </div>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Content Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Performance</CardTitle>
                  <CardDescription>Your content metrics overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{socialMetrics.content.totalPosts}</div>
                      <div className="text-sm text-gray-600">Total Posts</div>
                      <div className={`text-xs ${getGrowthColor(socialMetrics.content.postsGrowth)}`}>
                        {formatPercentage(socialMetrics.content.postsGrowth)}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(socialMetrics.content.totalViews)}</div>
                      <div className="text-sm text-gray-600">Total Views</div>
                      <div className={`text-xs ${getGrowthColor(socialMetrics.content.viewsGrowth)}`}>
                        {formatPercentage(socialMetrics.content.viewsGrowth)}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{formatNumber(socialMetrics.content.totalLikes)}</div>
                      <div className="text-sm text-gray-600">Total Likes</div>
                      <div className={`text-xs ${getGrowthColor(socialMetrics.content.likesGrowth)}`}>
                        {formatPercentage(socialMetrics.content.likesGrowth)}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formatNumber(socialMetrics.content.totalComments)}</div>
                      <div className="text-sm text-gray-600">Total Comments</div>
                      <div className={`text-xs ${getGrowthColor(socialMetrics.content.commentsGrowth)}`}>
                        {formatPercentage(socialMetrics.content.commentsGrowth)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                  <CardDescription>Weekly engagement patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Engagement chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>Your best performing posts in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {socialMetrics.topContent.map((content, index) => (
                    <div key={content.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold">{content.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <Badge variant="outline">{content.type}</Badge>
                          <span>{new Date(content.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="font-semibold text-blue-600">{formatNumber(content.views)}</div>
                          <div className="text-xs text-gray-500">Views</div>
                        </div>
                        <div>
                          <div className="font-semibold text-red-600">{formatNumber(content.likes)}</div>
                          <div className="text-xs text-gray-500">Likes</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{content.comments}</div>
                          <div className="text-xs text-gray-500">Comments</div>
                        </div>
                        <div>
                          <div className="font-semibold text-purple-600">{content.engagementRate}%</div>
                          <div className="text-xs text-gray-500">Engagement</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Types Performance</CardTitle>
                  <CardDescription>Performance breakdown by content type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Film className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Videos</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">68%</div>
                        <div className="text-sm text-gray-500">of total engagement</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Posts</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">24%</div>
                        <div className="text-sm text-gray-500">of total engagement</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Stories</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">8%</div>
                        <div className="text-sm text-gray-500">of total engagement</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publishing Schedule</CardTitle>
                  <CardDescription>Optimal posting times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Best day to post</span>
                      <Badge variant="outline">Saturday</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Best time to post</span>
                      <Badge variant="outline">6:00 PM - 8:00 PM</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. posts per week</span>
                      <span className="font-semibold">4.2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Consistency score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">8.5/10</span>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Age Demographics</CardTitle>
                  <CardDescription>Follower age distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {socialMetrics.audience.demographics.ageGroups.map((group) => (
                      <div key={group.range} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{group.range}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${group.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{group.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <CardDescription>Geographic distribution of followers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {socialMetrics.audience.demographics.locations.map((location) => (
                      <div key={location.country} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{location.country}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${location.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{location.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Audience Interests</CardTitle>
                  <CardDescription>What your followers are interested in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {socialMetrics.audience.demographics.interests.map((interest) => (
                      <div key={interest.category} className="p-4 border rounded-lg text-center">
                        <div className="text-lg font-bold text-purple-600">{interest.percentage}%</div>
                        <div className="text-sm font-medium">{interest.category}</div>
                        <div className="text-xs text-gray-500">{formatNumber(interest.count)} followers</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Engagement</CardTitle>
                  <CardDescription>When your audience is most active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border rounded-lg">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Hourly engagement chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Engagement</CardTitle>
                  <CardDescription>Engagement patterns by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border rounded-lg">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Weekly engagement chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
                <CardDescription>Types of engagement on your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(socialMetrics.content.totalLikes)}</div>
                    <div className="text-sm text-gray-600">Likes</div>
                    <div className={`text-xs ${getGrowthColor(socialMetrics.content.likesGrowth)}`}>
                      {formatPercentage(socialMetrics.content.likesGrowth)}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(socialMetrics.content.totalComments)}</div>
                    <div className="text-sm text-gray-600">Comments</div>
                    <div className={`text-xs ${getGrowthColor(socialMetrics.content.commentsGrowth)}`}>
                      {formatPercentage(socialMetrics.content.commentsGrowth)}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Share2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(socialMetrics.content.totalShares)}</div>
                    <div className="text-sm text-gray-600">Shares</div>
                    <div className={`text-xs ${getGrowthColor(socialMetrics.content.sharesGrowth)}`}>
                      {formatPercentage(socialMetrics.content.sharesGrowth)}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Eye className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(socialMetrics.content.totalViews)}</div>
                    <div className="text-sm text-gray-600">Views</div>
                    <div className={`text-xs ${getGrowthColor(socialMetrics.content.viewsGrowth)}`}>
                      {formatPercentage(socialMetrics.content.viewsGrowth)}
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
