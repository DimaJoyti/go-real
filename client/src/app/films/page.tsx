'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FilmCard } from '@/components/features/films/film-card'
import { useFilms } from '@/hooks/useFilms'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilmCategory } from '@/types'
import { Search, Upload, Loader2, Film } from 'lucide-react'
import Link from 'next/link'

export default function FilmsPage() {
  const { films, loading, likeFilm } = useFilms()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FilmCategory | 'all'>('all')
  const [likingId, setLikingId] = useState<string | null>(null)

  const handleLikeFilm = async (filmId: string) => {
    if (!user) {
      window.location.href = '/auth'
      return
    }

    setLikingId(filmId)
    await likeFilm(filmId, user.id)
    setLikingId(null)
  }

  const filteredFilms = films.filter(film => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        film.title.toLowerCase().includes(query) ||
        film.description.toLowerCase().includes(query) ||
        film.tags.some(tag => tag.toLowerCase().includes(query))
      
      if (!matchesSearch) return false
    }

    // Category filter
    if (selectedCategory !== 'all' && film.category !== selectedCategory) {
      return false
    }

    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Short Films</h1>
            <p className="text-muted-foreground">
              Discover amazing short films from creators around the world
            </p>
          </div>
          
          <Button asChild className="gradient-bg">
            <Link href="/films/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Film
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search films..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FilmCategory | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={FilmCategory.DOCUMENTARY}>Documentary</SelectItem>
                <SelectItem value={FilmCategory.FICTION}>Fiction</SelectItem>
                <SelectItem value={FilmCategory.ANIMATION}>Animation</SelectItem>
                <SelectItem value={FilmCategory.EXPERIMENTAL}>Experimental</SelectItem>
                <SelectItem value={FilmCategory.MUSIC_VIDEO}>Music Video</SelectItem>
                <SelectItem value={FilmCategory.COMMERCIAL}>Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredFilms.length} of {films.length} films
          </p>
        </div>

        {/* Films Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredFilms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No films found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Be the first to upload a film to the platform'
              }
            </p>
            <Button asChild>
              <Link href="/films/upload">Upload your first film</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFilms.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                onLike={handleLikeFilm}
                isLiking={likingId === film.id}
              />
            ))}
          </div>
        )}

        {/* Featured Section */}
        {!searchQuery && selectedCategory === 'all' && films.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Featured Films</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {films
                .filter(film => film.likes > 10 || film.views > 100)
                .slice(0, 6)
                .map((film) => (
                  <FilmCard
                    key={`featured-${film.id}`}
                    film={film}
                    onLike={handleLikeFilm}
                    isLiking={likingId === film.id}
                  />
                ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
