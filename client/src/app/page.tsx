import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Hero Section */}
        <section className="text-center py-20">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to GoReal Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The next-generation platform combining social challenges, short films, 
            and real estate NFT tokenization.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/challenges">Explore Challenges</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/films">Watch Films</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Social Challenges</h3>
              <p className="text-muted-foreground">
                Participate in community-driven challenges and earn rewards
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Short Films</h3>
              <p className="text-muted-foreground">
                Discover and share creative video content from talented creators
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Real Estate NFTs</h3>
              <p className="text-muted-foreground">
                Invest in tokenized real estate with fractional ownership
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
