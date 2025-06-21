'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  Calendar, Users, Trophy, Share2, Flag, Edit, Play, 
  Clock, Target, Award, ExternalLink, Heart, MessageCircle 
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
// import { ChallengeParticipants } from './ChallengeParticipants'
// import { ChallengeSubmission } from './ChallengeSubmission'
// import { ChallengeLeaderboard } from './ChallengeLeaderboard'

interface ChallengeDetailProps {
  challengeId: string
}

interface Challenge {
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
  start_date?: string
  end_date?: string
  reward_amount?: number
  reward_type: 'nft' | 'token' | 'points' | 'badge'
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  current_participants: number
  max_participants?: number
  rules: string[]
  tags: string[]
  image_url?: string
  created_at: string
  challenge_participations?: any[]
}

export function ChallengeDetail({ challengeId }: ChallengeDetailProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [isParticipating, setIsParticipating] = useState(false)
  const [userParticipation, setUserParticipation] = useState<any>(null)
  const [joinLoading, setJoinLoading] = useState(false)

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        setLoading(true)
        const { data, error } = await api.getChallenge(challengeId)
        
        if (error) {
          console.error('Error loading challenge:', error)
          return
        }

        setChallenge(data)

        // Check if user is participating
        if (user && data.challenge_participations) {
          const participation = data.challenge_participations.find(
            (p: any) => p.user_id === user.id
          )
          setIsParticipating(!!participation)
          setUserParticipation(participation)
        }
      } catch (error) {
        console.error('Error loading challenge:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChallenge()
  }, [challengeId, user])

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return

    setJoinLoading(true)
    try {
      const { error } = await api.joinChallenge(challenge.id, user.id)
      
      if (error) {
        console.error('Error joining challenge:', error)
        return
      }

      setIsParticipating(true)
      setChallenge(prev => prev ? {
        ...prev,
        current_participants: prev.current_participants + 1
      } : null)
    } catch (error) {
      console.error('Error joining challenge:', error)
    } finally {
      setJoinLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'nft': return <Trophy className="h-5 w-5" />
      case 'token': return <Award className="h-5 w-5" />
      case 'points': return <Target className="h-5 w-5" />
      case 'badge': return <Award className="h-5 w-5" />
      default: return <Trophy className="h-5 w-5" />
    }
  }

  const isCreator = user?.id === challenge?.creator_id
  const canJoin = user && !isParticipating && challenge?.status === 'active' && !isCreator
  const canEdit = isCreator && challenge?.status === 'draft'
  const participationRate = challenge?.max_participants 
    ? (challenge.current_participants / challenge.max_participants) * 100 
    : 0

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Challenge not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The challenge you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/challenges')}>
              Browse Challenges
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {challenge.image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{challenge.title}</h1>
                  <Badge className={getStatusColor(challenge.status)}>
                    {challenge.status}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  {challenge.description}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Creator Info */}
            {challenge.creator && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={challenge.creator.avatar_url} />
                  <AvatarFallback>
                    {challenge.creator.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{challenge.creator.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{challenge.creator.username}
                  </p>
                </div>
                {isCreator && (
                  <Badge variant="outline">
                    Your Challenge
                  </Badge>
                )}
              </div>
            )}

            {/* Tags */}
            {challenge.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {challenge.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Panel */}
          <Card className="lg:w-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getRewardIcon(challenge.reward_type)}
                {challenge.reward_type.charAt(0).toUpperCase() + challenge.reward_type.slice(1)} Reward
              </CardTitle>
              {challenge.reward_amount && (
                <CardDescription>
                  {challenge.reward_amount} {challenge.reward_type}
                  {challenge.reward_amount > 1 ? 's' : ''} available
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Participation Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants
                  </span>
                  <span>
                    {challenge.current_participants}
                    {challenge.max_participants && ` / ${challenge.max_participants}`}
                  </span>
                </div>
                {challenge.max_participants && (
                  <Progress value={participationRate} className="h-2" />
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-2 text-sm">
                {challenge.start_date && (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-green-500" />
                    <span>Started {formatDistanceToNow(new Date(challenge.start_date), { addSuffix: true })}</span>
                  </div>
                )}
                {challenge.end_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>
                      {new Date(challenge.end_date) > new Date() 
                        ? `Ends ${formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}`
                        : 'Challenge ended'
                      }
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created {formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                {canJoin && (
                  <Button 
                    onClick={handleJoinChallenge} 
                    disabled={joinLoading}
                    className="w-full"
                  >
                    {joinLoading ? 'Joining...' : 'Join Challenge'}
                  </Button>
                )}

                {isParticipating && challenge.status === 'active' && (
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Submit Entry
                  </Button>
                )}

                {!user && (
                  <Button 
                    onClick={() => router.push('/sign-in')}
                    className="w-full"
                  >
                    Sign In to Join
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="participants">
            Participants ({challenge.current_participants})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Rules</CardTitle>
              <CardDescription>
                Follow these guidelines to successfully complete the challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {challenge.rules.map((rule, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          {(challenge.start_date || challenge.end_date) && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenge.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Challenge Started</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(challenge.start_date), 'PPP')} at {format(new Date(challenge.start_date), 'p')}
                      </p>
                    </div>
                  </div>
                )}
                {challenge.end_date && (
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      new Date(challenge.end_date) > new Date() ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">
                        Challenge {new Date(challenge.end_date) > new Date() ? 'Ends' : 'Ended'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(challenge.end_date), 'PPP')} at {format(new Date(challenge.end_date), 'p')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants">
          {/* <ChallengeParticipants challengeId={challenge.id} /> */}
          <div className="p-4 text-center text-muted-foreground">
            Participants view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          {/* <ChallengeLeaderboard challengeId={challenge.id} /> */}
          <div className="p-4 text-center text-muted-foreground">
            Leaderboard coming soon...
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          {/* <ChallengeSubmission 
            challengeId={challenge.id} 
            userParticipation={userParticipation}
            isParticipating={isParticipating}
          /> */}
          <div className="p-4 text-center text-muted-foreground">
            Submissions view coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
