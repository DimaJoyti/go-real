'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Play, Eye, Clock } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  view_count: number
  created_at: string
}

interface RelatedFilmsProps {
  currentFilmId: string
  genres: string[]
  creatorId: string
}

export function RelatedFilms({ currentFilmId, genres, creatorId }: RelatedFilmsProps) {
  const router = useRouter()
  const [relatedFilms, setRelatedFilms] = useState<Film[]>([])
  const [creatorFilms, setCreatorFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRelatedFilms = async () => {
      try {
        setLoading(true)
        
        // Load films with similar genres
        const { data: genreFilms } = await api.getFilms({ 
          genre: genres[0], // Use first genre for simplicity
          limit: 6 
        })
        
        // Filter out current film
        const filtered = (genreFilms || []).filter((film: Film) => film.id !== currentFilmId)
        setRelatedFilms(filtered.slice(0, 4))

        // Load more films from the same creator
        const { data: creatorFilmsData } = await api.getFilms({ 
          creator_id: creatorId,
          limit: 4 
        })
        
        const filteredCreatorFilms = (creatorFilmsData || []).filter((film: Film) => film.id !== currentFilmId)
        setCreatorFilms(filteredCreatorFilms.slice(0, 3))
        
      } catch (error) {
        console.error('Error loading related films:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRelatedFilms()
  }, [currentFilmId, genres, creatorId])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const FilmCard = ({ film }: { film: Film }) => (
    <div
      className="cursor-pointer group"
      onClick={() => router.push(`/films/${film.id}`)}
    >
      <div className="space-y-3">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          {film.thumbnail_url ? (
            <img
              src={film.thumbnail_url}
              alt={film.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Play className="h-8 w-8 text-white" />
            </div>
          )}
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(film.duration)}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-2">
              <Play className="h-4 w-4 text-black" />
            </div>
          </div>
        </div>

        {/* Film Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {film.title}
          </h4>
          
          {film.creator && (
            <div className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarImage src={film.creator.avatar_url} />
                <AvatarFallback className="text-xs">
                  {film.creator.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {film.creator.username}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{film.view_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(film.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Genres */}
          {film.genre.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {film.genre.slice(0, 2).map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Related Films */}
      {relatedFilms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Films</CardTitle>
            <CardDescription>
              Films with similar genres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedFilms.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* More from Creator */}
      {creatorFilms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">More from this Creator</CardTitle>
            <CardDescription>
              Other films by the same creator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creatorFilms.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Related Films */}
      {relatedFilms.length === 0 && creatorFilms.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Play className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No related films found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
