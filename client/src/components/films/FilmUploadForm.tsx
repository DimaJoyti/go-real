'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Film, Image, X, Play, Pause, Volume2, VolumeX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const filmUploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  genre: z.array(z.string()).min(1, 'At least one genre is required').max(5, 'Maximum 5 genres allowed'),
  isPublic: z.boolean().default(true),
  challengeId: z.string().optional(),
})

type FilmUploadFormData = z.infer<typeof filmUploadSchema>

const genreOptions = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 
  'Thriller', 'Western', 'Experimental', 'Music Video', 'Educational'
]

interface VideoPreviewProps {
  file: File
  onRemove: () => void
}

function VideoPreview({ file, onRemove }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={URL.createObjectURL(file)}
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        muted={isMuted}
      />
      
      {/* Video Controls Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            {duration > 0 && (
              <span>{formatDuration(duration)}</span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-white hover:bg-red-500/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Info */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
          {file.name} • {(file.size / (1024 * 1024)).toFixed(1)} MB
        </div>
      </div>
    </div>
  )
}

export function FilmUploadForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [challenges, setChallenges] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<FilmUploadFormData>({
    resolver: zodResolver(filmUploadSchema),
    defaultValues: {
      genre: [],
      isPublic: true,
    },
  })

  const watchedGenres = watch('genre') || []
  const watchedChallengeId = watch('challengeId')

  // Load available challenges
  useState(() => {
    const loadChallenges = async () => {
      try {
        const { data } = await api.getChallenges({ status: 'active' })
        setChallenges(data || [])
      } catch (error) {
        console.error('Error loading challenges:', error)
      }
    }
    loadChallenges()
  })

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file')
        return
      }
      
      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        alert('Video file must be less than 500MB')
        return
      }
      
      setVideoFile(file)
    }
  }

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addGenre = (genre: string) => {
    const currentGenres = getValues('genre') || []
    if (!currentGenres.includes(genre) && currentGenres.length < 5) {
      setValue('genre', [...currentGenres, genre])
    }
  }

  const removeGenre = (genre: string) => {
    const currentGenres = getValues('genre') || []
    setValue('genre', currentGenres.filter(g => g !== genre))
  }

  const onSubmit = async (data: FilmUploadFormData) => {
    if (!user || !videoFile) return

    setIsLoading(true)
    setUploadProgress(0)

    try {
      // Upload video file
      const videoExt = videoFile.name.split('.').pop()
      const videoFileName = `${user.id}/film-${Date.now()}.${videoExt}`
      
      // TODO: Implement file upload
      console.log('Video upload not implemented:', videoFileName)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      // Simulate upload completion
      await new Promise(resolve => setTimeout(resolve, 2000))
      clearInterval(progressInterval)
      setUploadProgress(95)

      const videoUrl = '' // Placeholder for video URL

      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnailFile) {
        const thumbnailExt = thumbnailFile.name.split('.').pop()
        const thumbnailFileName = `${user.id}/thumbnail-${Date.now()}.${thumbnailExt}`
        
        // TODO: Implement thumbnail upload
        console.log('Thumbnail upload not implemented:', thumbnailFileName)
        thumbnailUrl = '' // Placeholder
      }

      // Get video duration (approximate from file metadata)
      const video = document.createElement('video')
      video.src = URL.createObjectURL(videoFile)
      await new Promise(resolve => {
        video.onloadedmetadata = resolve
      })
      const duration = Math.floor(video.duration)

      // Create film record
      const filmData = {
        title: data.title,
        description: data.description,
        creator_id: user.id,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration: duration,
        category: data.genre[0] || 'general', // Use first genre as category
        tags: data.genre,
        views: 0,
        likes: 0,
        is_public: data.isPublic,
        challenge_id: data.challengeId || null,
      }

      const { data: film, error } = await api.createFilm(filmData)

      if (error) {
        throw error
      }

      setUploadProgress(100)
      
      // Redirect to film page
      setTimeout(() => {
        router.push(`/films/${film.id}`)
      }, 1000)

    } catch (error) {
      console.error('Error uploading film:', error)
      setUploadProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Upload Your Film</h1>
        <p className="text-muted-foreground">
          Share your creativity with the GoReal community
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Video Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Video File
            </CardTitle>
            <CardDescription>
              Upload your short film (MP4, WebM, or MOV format, max 500MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!videoFile ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium">Upload your video</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to browse
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="max-w-xs mx-auto cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <VideoPreview
                file={videoFile}
                onRemove={() => setVideoFile(null)}
              />
            )}
          </CardContent>
        </Card>

        {/* Film Details */}
        <Card>
          <CardHeader>
            <CardTitle>Film Details</CardTitle>
            <CardDescription>
              Provide information about your film
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter your film title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe your film, its story, and what inspired you to create it..."
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Thumbnail (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a custom thumbnail for your film
                  </p>
                </div>
                {thumbnailPreview && (
                  <div className="relative w-20 h-12 rounded overflow-hidden border">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Genres */}
        <Card>
          <CardHeader>
            <CardTitle>Genres</CardTitle>
            <CardDescription>
              Select up to 5 genres that best describe your film
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {genreOptions.map((genre) => (
                <Badge
                  key={genre}
                  variant={watchedGenres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer justify-center py-2"
                  onClick={() => {
                    if (watchedGenres.includes(genre)) {
                      removeGenre(genre)
                    } else {
                      addGenre(genre)
                    }
                  }}
                >
                  {genre}
                </Badge>
              ))}
            </div>

            {watchedGenres.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Genres ({watchedGenres.length}/5)</Label>
                <div className="flex flex-wrap gap-2">
                  {watchedGenres.map((genre) => (
                    <Badge key={genre} variant="default" className="gap-1">
                      {genre}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeGenre(genre)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {errors.genre && (
              <p className="text-sm text-red-500">{errors.genre.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure visibility and challenge participation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={watch('isPublic')}
                onCheckedChange={(checked) => setValue('isPublic', !!checked)}
              />
              <Label htmlFor="isPublic">Make this film public</Label>
            </div>

            {challenges.length > 0 && (
              <div className="space-y-2">
                <Label>Submit to Challenge (Optional)</Label>
                <Select
                  value={watchedChallengeId || ''}
                  onValueChange={(value) => setValue('challengeId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No challenge</SelectItem>
                    {challenges.map((challenge) => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading film...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !videoFile} 
            className="flex-1"
          >
            {isLoading ? 'Uploading...' : 'Upload Film'}
          </Button>
        </div>
      </form>
    </div>
  )
}
