import { FilmDetail } from '@/components/films/FilmDetail'

interface FilmPageProps {
  params: {
    id: string
  }
}

export default function FilmPage({ params }: FilmPageProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <FilmDetail filmId={params.id} />
    </div>
  )
}

export const metadata = {
  title: 'Film Details - GoReal Platform',
  description: 'Watch and discover amazing short films',
}
