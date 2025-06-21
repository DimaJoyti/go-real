'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, ImageIcon, Plus, X, Trophy, Coins, Gift, Award } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const createChallengeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must be less than 1000 characters'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  rewardAmount: z.number().min(0, 'Reward amount must be positive').optional(),
  rewardType: z.enum(['nft', 'token', 'points', 'badge']),
  maxParticipants: z.number().min(1, 'Must allow at least 1 participant').max(10000, 'Maximum 10,000 participants').optional(),
  rules: z.array(z.string().min(1, 'Rule cannot be empty')).min(1, 'At least one rule is required'),
  tags: z.array(z.string().min(1, 'Tag cannot be empty')).min(1, 'At least one tag is required'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

type CreateChallengeFormData = z.infer<typeof createChallengeSchema>

const rewardTypeOptions = [
  { value: 'nft', label: 'NFT Reward', icon: Trophy, description: 'Unique digital collectible' },
  { value: 'token', label: 'Token Reward', icon: Coins, description: 'Cryptocurrency tokens' },
  { value: 'points', label: 'Platform Points', icon: Gift, description: 'Platform experience points' },
  { value: 'badge', label: 'Achievement Badge', icon: Award, description: 'Digital achievement badge' },
]

const popularTags = [
  'fitness', 'creativity', 'education', 'technology', 'art', 'music', 'photography', 
  'cooking', 'travel', 'sustainability', 'health', 'gaming', 'writing', 'design'
]

export function CreateChallengeForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newRule, setNewRule] = useState('')
  const [newTag, setNewTag] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<CreateChallengeFormData>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      rewardType: 'points',
      rules: [],
      tags: [],
    },
  })

  const watchedRules = watch('rules') || []
  const watchedTags = watch('tags') || []
  const watchedRewardType = watch('rewardType')
  const watchedStartDate = watch('startDate')
  const watchedEndDate = watch('endDate')

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addRule = () => {
    if (newRule.trim()) {
      const currentRules = getValues('rules') || []
      setValue('rules', [...currentRules, newRule.trim()])
      setNewRule('')
    }
  }

  const removeRule = (index: number) => {
    const currentRules = getValues('rules') || []
    setValue('rules', currentRules.filter((_, i) => i !== index))
  }

  const addTag = (tag: string) => {
    const currentTags = getValues('tags') || []
    if (!currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag])
    }
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    const currentTags = getValues('tags') || []
    setValue('tags', currentTags.filter(t => t !== tag))
  }

  const onSubmit = async (data: CreateChallengeFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/challenge-${Date.now()}.${fileExt}`
        
        // TODO: Implement file upload
        console.log('File upload not implemented:', fileName)

        imageUrl = '' // Placeholder
      }

      // Create challenge
      const challengeData = {
        title: data.title,
        description: data.description,
        creator_id: user.id,
        category: 'general', // Default category
        difficulty: 'medium', // Default difficulty
        start_date: data.startDate?.toISOString() || new Date().toISOString(),
        end_date: data.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reward_amount: data.rewardAmount,
        reward_currency: 'ETH',
        max_participants: data.maxParticipants,
        current_participants: 0,
        rules: data.rules,
        tags: data.tags,
        image_url: imageUrl,
        status: 'draft' as const,
      }

      const { data: challenge, error } = await api.createChallenge(challengeData)

      if (error) {
        throw error
      }

      router.push(`/challenges/${challenge.id}`)
    } catch (error) {
      console.error('Error creating challenge:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create New Challenge</h1>
        <p className="text-muted-foreground">
          Design an engaging challenge for the community to participate in
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the essential details about your challenge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title</Label>
              <Input
                id="title"
                placeholder="Enter an engaging title for your challenge"
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
                placeholder="Describe what participants need to do, what they'll learn, and why they should join..."
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Challenge Image</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an eye-catching image for your challenge (optional)
                  </p>
                </div>
                {imagePreview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Challenge preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Set when your challenge starts and ends (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedStartDate ? format(watchedStartDate, "PPP") : "Pick a start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watchedStartDate}
                      onSelect={(date) => setValue('startDate', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedEndDate ? format(watchedEndDate, "PPP") : "Pick an end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watchedEndDate}
                      onSelect={(date) => setValue('endDate', date)}
                      disabled={(date) => {
                        const minDate = watchedStartDate || new Date()
                        return date < minDate
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum Participants (Optional)</Label>
              <Input
                id="maxParticipants"
                type="number"
                placeholder="Leave empty for unlimited participants"
                {...register('maxParticipants', { valueAsNumber: true })}
                className={errors.maxParticipants ? 'border-red-500' : ''}
              />
              {errors.maxParticipants && (
                <p className="text-sm text-red-500">{errors.maxParticipants.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rewards */}
        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <CardDescription>
              Define what participants can earn by completing your challenge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reward Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rewardTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        watchedRewardType === option.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                      onClick={() => setValue('rewardType', option.value as any)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {(watchedRewardType === 'nft' || watchedRewardType === 'token') && (
              <div className="space-y-2">
                <Label htmlFor="rewardAmount">
                  {watchedRewardType === 'nft' ? 'Number of NFTs' : 'Token Amount'}
                </Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  step="0.01"
                  placeholder={watchedRewardType === 'nft' ? 'e.g., 1' : 'e.g., 100'}
                  {...register('rewardAmount', { valueAsNumber: true })}
                  className={errors.rewardAmount ? 'border-red-500' : ''}
                />
                {errors.rewardAmount && (
                  <p className="text-sm text-red-500">{errors.rewardAmount.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Challenge Rules</CardTitle>
            <CardDescription>
              Set clear guidelines for participants to follow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a rule (e.g., Post daily updates)"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
              />
              <Button type="button" onClick={addRule} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {watchedRules.length > 0 && (
              <div className="space-y-2">
                {watchedRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <span className="flex-1 text-sm">{rule}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {errors.rules && (
              <p className="text-sm text-red-500">{errors.rules.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Help people discover your challenge with relevant tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
              />
              <Button type="button" onClick={() => addTag(newTag)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Popular Tags</Label>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={watchedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (watchedTags.includes(tag)) {
                        removeTag(tag)
                      } else {
                        addTag(tag)
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {watchedTags.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="default" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {errors.tags && (
              <p className="text-sm text-red-500">{errors.tags.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Creating Challenge...' : 'Create Challenge'}
          </Button>
        </div>
      </form>
    </div>
  )
}
