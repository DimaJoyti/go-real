'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ChallengeCard } from '@/components/features/challenges/challenge-card'
import { useChallenges } from '@/hooks/useChallenges'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChallengeCategory, ChallengeDifficulty, ChallengeStatus } from '@/types'
import { Search, Filter, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ChallengesPage() {
  const { challenges, loading, joinChallenge } = useChallenges()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | 'all'>('all')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) {
      // Redirect to auth
      window.location.href = '/auth'
      return
    }

    setJoiningId(challengeId)
    await joinChallenge(challengeId, user.id)
    setJoiningId(null)
  }

  const filteredChallenges = challenges.filter(challenge => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        challenge.title.toLowerCase().includes(query) ||
        challenge.description.toLowerCase().includes(query) ||
        challenge.tags.some(tag => tag.toLowerCase().includes(query))
      
      if (!matchesSearch) return false
    }

    // Category filter
    if (selectedCategory !== 'all' && challenge.category !== selectedCategory) {
      return false
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all' && challenge.difficulty !== selectedDifficulty) {
      return false
    }

    // Status filter
    if (selectedStatus !== 'all' && challenge.status !== selectedStatus) {
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
            <h1 className="text-3xl font-bold">Challenges</h1>
            <p className="text-muted-foreground">
              Discover and participate in exciting challenges from the community
            </p>
          </div>
          
          <Button asChild className="gradient-bg">
            <Link href="/challenges/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search challenges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ChallengeCategory | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value={ChallengeCategory.FITNESS}>Fitness</SelectItem>
                <SelectItem value={ChallengeCategory.CREATIVE}>Creative</SelectItem>
                <SelectItem value={ChallengeCategory.EDUCATIONAL}>Educational</SelectItem>
                <SelectItem value={ChallengeCategory.SOCIAL}>Social</SelectItem>
                <SelectItem value={ChallengeCategory.ENVIRONMENTAL}>Environmental</SelectItem>
                <SelectItem value={ChallengeCategory.TECH}>Tech</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as ChallengeDifficulty | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value={ChallengeDifficulty.EASY}>Easy</SelectItem>
                <SelectItem value={ChallengeDifficulty.MEDIUM}>Medium</SelectItem>
                <SelectItem value={ChallengeDifficulty.HARD}>Hard</SelectItem>
                <SelectItem value={ChallengeDifficulty.EXPERT}>Expert</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ChallengeStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ChallengeStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={ChallengeStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={ChallengeStatus.DRAFT}>Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredChallenges.length} of {challenges.length} challenges
          </p>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button asChild>
              <Link href="/challenges/create">Create the first challenge</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={handleJoinChallenge}
                isJoining={joiningId === challenge.id}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
