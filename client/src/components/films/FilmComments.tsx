'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, MoreHorizontal, Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface Comment {
  id: string
  content: string
  user_id: string
  user?: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  like_count: number
  reply_count: number
  created_at: string
}

interface FilmCommentsProps {
  filmId: string
}

export function FilmComments({ filmId }: FilmCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true)
        const { data, error } = await api.getFilmComments(filmId)
        
        if (!error && data) {
          setComments(data)
        }
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setLoading(false)
      }
    }

    loadComments()
  }, [filmId])

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const { data, error } = await api.createFilmComment(filmId, {
        content: newComment.trim(),
        user_id: user.id,
      })

      if (!error && data) {
        setComments(prev => [data, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    try {
      await api.likeFilmComment(commentId, user.id)
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, like_count: comment.like_count + 1 }
          : comment
      ))
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                <AvatarFallback>
                  {(user.user_metadata?.full_name || user.email || 'U').split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewComment('')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? 'Posting...' : 'Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to leave a comment
            </p>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback>
                      {comment.user?.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{comment.user?.username || 'unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Flag className="h-4 w-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={!user}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {comment.like_count}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!user}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No comments yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts about this film!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
