import { FilmList } from '@/components/films/FilmList'

export default function FilmsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <FilmList />
    </div>
  )
}

export const metadata = {
  title: 'Short Films - GoReal Platform',
  description: 'Discover amazing short films from creators around the world',
}
