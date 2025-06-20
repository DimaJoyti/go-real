'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { NFTCard } from '@/components/features/marketplace/nft-card'
import { useNFTs } from '@/hooks/useNFTs'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PropertyType } from '@/types'
import { Search, Plus, Loader2, Building, TrendingUp, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'

export default function MarketplacePage() {
  const { nfts, listings, loading, purchaseNFT } = useNFTs()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | 'all'>('all')
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [purchasingId, setPurchasingId] = useState<string | null>(null)

  const handlePurchaseNFT = async (nftId: string) => {
    if (!user) {
      window.location.href = '/auth'
      return
    }

    setPurchasingId(nftId)
    // In production, get the listing ID from the NFT
    const listing = listings.find(l => l.nft.id === nftId)
    if (listing) {
      await purchaseNFT(listing.id, user.profile?.wallet_address || '0x...')
    }
    setPurchasingId(null)
  }

  const getPriceRangeFilter = (range: string) => {
    switch (range) {
      case 'low': return [0, 1000]
      case 'medium': return [1000, 10000]
      case 'high': return [10000, Infinity]
      default: return undefined
    }
  }

  const filteredNFTs = nfts.filter(nft => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        nft.name.toLowerCase().includes(query) ||
        nft.description.toLowerCase().includes(query) ||
        nft.property_address.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    // Property type filter
    if (selectedPropertyType !== 'all' && nft.property_type !== selectedPropertyType) {
      return false
    }

    // Price range filter
    if (priceRange !== 'all') {
      const range = getPriceRangeFilter(priceRange)
      if (range && (nft.price_per_token < range[0] || nft.price_per_token > range[1])) {
        return false
      }
    }

    return true
  })

  // Calculate marketplace stats
  const totalValue = nfts.reduce((sum, nft) => sum + nft.total_value, 0)
  const totalTokens = nfts.reduce((sum, nft) => sum + nft.token_supply, 0)
  const activeListings = listings.length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">NFT Marketplace</h1>
            <p className="text-muted-foreground">
              Discover and invest in tokenized real estate properties
            </p>
          </div>
          
          <Button asChild className="gradient-bg">
            <Link href="/marketplace/create">
              <Plus className="mr-2 h-4 w-4" />
              Create NFT
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{nfts.length}</p>
              </div>
              <Building className="h-8 w-8 text-nft-600" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold">{activeListings}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Property Type Filter */}
            <Select value={selectedPropertyType} onValueChange={(value) => setSelectedPropertyType(value as PropertyType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={PropertyType.RESIDENTIAL}>Residential</SelectItem>
                <SelectItem value={PropertyType.COMMERCIAL}>Commercial</SelectItem>
                <SelectItem value={PropertyType.INDUSTRIAL}>Industrial</SelectItem>
                <SelectItem value={PropertyType.LAND}>Land</SelectItem>
                <SelectItem value={PropertyType.MIXED_USE}>Mixed Use</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range Filter */}
            <Select value={priceRange} onValueChange={(value) => setPriceRange(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">$0 - $1,000</SelectItem>
                <SelectItem value="medium">$1,000 - $10,000</SelectItem>
                <SelectItem value="high">$10,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredNFTs.length} of {nfts.length} properties
          </p>
        </div>

        {/* NFTs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredNFTs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedPropertyType !== 'all' || priceRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to tokenize a property'
              }
            </p>
            <Button asChild>
              <Link href="/marketplace/create">Create your first NFT</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onPurchase={handlePurchaseNFT}
                isPurchasing={purchasingId === nft.id}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
