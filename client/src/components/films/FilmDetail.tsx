'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { 
  Heart, MessageCircle, Share2, Flag, Edit, Eye, Star, 
  Clock, Calendar, Trophy, Download, Bookmark 
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { FilmPlayer } from './FilmPlayer'
import { FilmComments } from './FilmComments'
import { RelatedFilms } from './RelatedFilms'

interface FilmDetailProps {
  filmId: string
}

interface Film {
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
  video_url: string
  thumbnail_url?: string
  duration: number
  genre: string[]
  rating: number
  view_count: number
  like_count: number
  comment_count: number
  status: 'draft' | 'processing' | 'published' | 'archived'
  is_public: boolean
  challenge_id?: string
  challenge?: {
    id: string
    title: string
  }
  created_at: string
}

export function FilmDetail({ filmId }: FilmDetailProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [film, setFilm] = useState<Film | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [hasViewed, setHasViewed] = useState(false)

  useEffect(() => {
    const loadFilm = async () => {
      try {
        setLoading(true)
        const { data, error } = await api.getFilm(filmId)
        
        if (error) {
          console.error('Error loading film:', error)
          return
        }

        setFilm(data)

        // Check if user has liked/bookmarked the film
        if (user) {
          // TODO: Check user's like/bookmark status
          // const { data: userInteraction } = await api.getUserFilmInteraction(filmId, user.id)
          // setIsLiked(userInteraction?.is_liked || false)
          // setIsBookmarked(userInteraction?.is_bookmarked || false)
        }
      } catch (error) {
        console.error('Error loading film:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilm()
  }, [filmId, user])

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setWatchTime(currentTime)
    
    // Mark as viewed when 30% watched
    if (!hasViewed && currentTime / duration > 0.3) {
      setHasViewed(true)
      // TODO: Track view
      // api.trackFilmView(filmId, user?.id)
    }
  }

  const handleLike = async () => {
    if (!user || !film) return

    setLikeLoading(true)
    try {
      if (isLiked) {
        // Unlike
        await api.unlikeFilm(film.id, user.id)
        setIsLiked(false)
        setFilm(prev => prev ? { ...prev, like_count: prev.like_count - 1 } : null)
      } else {
        // Like
        await api.likeFilm(film.id, user.id)
        setIsLiked(true)
        setFilm(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleBookmark = async () => {
    if (!user || !film) return

    try {
      if (isBookmarked) {
        await api.removeBookmark(film.id, user.id)
        setIsBookmarked(false)
      } else {
        await api.addBookmark(film.id, user.id)
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: film?.title,
          text: film?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isCreator = user?.id === film?.creator_id

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="aspect-video bg-muted rounded-lg"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!film) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Film not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The film you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/films')}>
              Browse Films
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Video Player */}
      <div className="aspect-video">
        <FilmPlayer
          videoUrl={film.video_url}
          title={film.title}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Film Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl font-bold">{film.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{film.view_count.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(film.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(film.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4" />
                </Button>
                {isCreator && (
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                variant={isLiked ? "default" : "outline"}
                onClick={handleLike}
                disabled={likeLoading || !user}
                className="flex items-center gap-2"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{film.like_count.toLocaleString()}</span>
              </Button>

              <Button variant="outline" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>{film.comment_count || 0}</span>
              </Button>

              {user && (
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  onClick={handleBookmark}
                  size="sm"
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              )}

              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>{film.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Creator Info */}
            {film.creator && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={film.creator.avatar_url} />
                      <AvatarFallback>
                        {film.creator.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{film.creator.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        @{film.creator.username}
                      </p>
                    </div>
                    {!isCreator && (
                      <Button variant="outline" size="sm">
                        Follow
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this film</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{film.description}</p>
                
                {/* Genres */}
                {film.genre.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {film.genre.map((genre) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenge Link */}
                {film.challenge && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Challenge Entry</h4>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={() => router.push(`/challenges/${film.challenge?.id}`)}
                      >
                        {film.challenge.title}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList>
              <TabsTrigger value="comments">
                Comments ({film.comment_count || 0})
              </TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="comments">
              <FilmComments filmId={film.id} />
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{formatDuration(film.duration)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Views:</span>
                      <span className="ml-2">{film.view_count.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Likes:</span>
                      <span className="ml-2">{film.like_count.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Rating:</span>
                      <span className="ml-2">{film.rating.toFixed(1)}/5.0</span>
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span>
                      <span className="ml-2">{formatDistanceToNow(new Date(film.created_at), { addSuffix: true })}</span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2 capitalize">{film.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RelatedFilms 
            currentFilmId={film.id} 
            genres={film.genre}
            creatorId={film.creator_id}
          />
        </div>
      </div>
    </div>
  )
}
