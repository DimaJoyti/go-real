'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Search, Filter, Plus, Play, Eye, Heart, Clock, Star, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

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
  status: 'draft' | 'processing' | 'published' | 'archived'
  is_public: boolean
  created_at: string
}

interface FilmFilters {
  search: string
  genre: string
  sortBy: string
  duration: string
}

function FilmCard({ film }: { film: Film }) {
  const router = useRouter()
  const { user } = useAuth()

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isCreator = user?.id === film.creator_id

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <div onClick={() => router.push(`/films/${film.id}`)}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
          {film.thumbnail_url ? (
            <img
              src={film.thumbnail_url}
              alt={film.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Play className="h-12 w-12 text-white" />
            </div>
          )}
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(film.duration)}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-3">
              <Play className="h-6 w-6 text-black" />
            </div>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {film.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {film.description}
              </CardDescription>
            </div>
            {isCreator && (
              <Badge variant="outline" className="text-xs">
                Your Film
              </Badge>
            )}
          </div>

          {/* Creator Info */}
          {film.creator && (
            <div className="flex items-center gap-2 pt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={film.creator.avatar_url} />
                <AvatarFallback className="text-xs">
                  {film.creator.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {film.creator.username}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>{film.view_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span>{film.like_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>{film.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Genres */}
          {film.genre.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {film.genre.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
              {film.genre.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{film.genre.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Upload Time */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(film.created_at), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export function FilmList() {
  const { user } = useAuth()
  const router = useRouter()
  const [films, setFilms] = useState<Film[]>([])
  const [trendingFilms, setTrendingFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilmFilters>({
    search: '',
    genre: 'all',
    sortBy: 'newest',
    duration: 'all',
  })

  const loadFilms = async () => {
    try {
      setLoading(true)
      
      const queryFilters: any = {}
      
      if (filters.genre !== 'all') {
        queryFilters.genre = filters.genre
      }
      
      const { data, error } = await api.getFilms(queryFilters)
      
      if (error) {
        console.error('Error loading films:', error)
        return
      }

      let filteredFilms = data || []

      // Apply client-side filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredFilms = filteredFilms.filter((film: Film) =>
          film.title.toLowerCase().includes(searchLower) ||
          film.description.toLowerCase().includes(searchLower) ||
          film.genre.some(g => g.toLowerCase().includes(searchLower))
        )
      }

      if (filters.duration !== 'all') {
        filteredFilms = filteredFilms.filter((film: Film) => {
          switch (filters.duration) {
            case 'short': return film.duration <= 300 // 5 minutes
            case 'medium': return film.duration > 300 && film.duration <= 900 // 5-15 minutes
            case 'long': return film.duration > 900 // 15+ minutes
            default: return true
          }
        })
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          filteredFilms.sort((a: Film, b: Film) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          break
        case 'popular':
          filteredFilms.sort((a: Film, b: Film) => b.view_count - a.view_count)
          break
        case 'liked':
          filteredFilms.sort((a: Film, b: Film) => b.like_count - a.like_count)
          break
        case 'rated':
          filteredFilms.sort((a: Film, b: Film) => b.rating - a.rating)
          break
      }

      setFilms(filteredFilms)
    } catch (error) {
      console.error('Error loading films:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrendingFilms = async () => {
    try {
      const { data, error } = await api.getTrendingFilms(6)
      if (!error && data) {
        setTrendingFilms(data)
      }
    } catch (error) {
      console.error('Error loading trending films:', error)
    }
  }

  useEffect(() => {
    loadFilms()
  }, [filters])

  useEffect(() => {
    loadTrendingFilms()
  }, [])

  const updateFilter = (key: keyof FilmFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const allGenres = Array.from(
    new Set(films.flatMap(film => film.genre))
  ).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Short Films</h1>
          <p className="text-muted-foreground">
            Discover amazing short films from creators around the world
          </p>
        </div>
        {user && (
          <Button onClick={() => router.push('/films/upload')}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Film
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Films</TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="my-films" disabled={!user}>
            My Films
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search films..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {allGenres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.duration} onValueChange={(value) => updateFilter('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Durations</SelectItem>
                    <SelectItem value="short">Short (≤5 min)</SelectItem>
                    <SelectItem value="medium">Medium (5-15 min)</SelectItem>
                    <SelectItem value="long">Long (15+ min)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Viewed</SelectItem>
                    <SelectItem value="liked">Most Liked</SelectItem>
                    <SelectItem value="rated">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Film Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
          ) : films.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {films.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No films found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or be the first to upload a film!
                </p>
                {user && (
                  <Button onClick={() => router.push('/films/upload')}>
                    Upload Film
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          {trendingFilms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingFilms.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No trending films yet</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for popular films!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-films" className="space-y-6">
          {user ? (
            <div>
              {/* User's films will be loaded here */}
              <p className="text-muted-foreground">Your films will appear here.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Sign in to view your films</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create an account to start uploading and managing your films.
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
