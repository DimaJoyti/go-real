import { Header } from '@/components/layout/header'

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">NFT Marketplace</h1>
          <p className="text-muted-foreground">
            Real estate NFT marketplace coming soon...
          </p>
        </div>
      </main>
    </div>
  )
}
