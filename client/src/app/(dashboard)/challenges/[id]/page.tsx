import { ChallengeDetail } from '@/components/challenges/ChallengeDetail'

interface ChallengePageProps {
  params: {
    id: string
  }
}

export default function ChallengePage({ params }: ChallengePageProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <ChallengeDetail challengeId={params.id} />
    </div>
  )
}

export const metadata = {
  title: 'Challenge Details - GoReal Platform',
  description: 'View challenge details and participate in exciting challenges',
}
