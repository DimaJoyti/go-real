import { ChallengeList } from '@/components/challenges/ChallengeList'

export default function ChallengesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ChallengeList />
    </div>
  )
}

export const metadata = {
  title: 'Challenges - GoReal Platform',
  description: 'Discover and participate in exciting challenges on the GoReal platform',
}
