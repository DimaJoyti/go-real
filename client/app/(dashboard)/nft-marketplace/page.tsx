'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Shield,
  Award,
  Info,
  Plus,
  Wallet,
  BarChart3
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

// Mock NFT data
const mockNFTs = [
  {
    id: '1',
    name: 'Luxury Downtown Apartment',
    description: 'Premium 2-bedroom apartment in the heart of downtown with stunning city views',
    image: '/api/placeholder/400/300',
    price: 250000,
    totalShares: 1000,
    availableShares: 750,
    location: 'Downtown, New York',
    yearBuilt: 2020,
    squareFootage: 1200,
    type: 'Apartment',
    status: 'Active',
    verified: true,
    yieldAPY: 8.5,
    totalInvestors: 25,
    creator: '0x1234...5678',
    createdAt: '2024-01-15',
    lastSale: 250,
    priceChange24h: 2.5,
    volume24h: 15000,
    floorPrice: 240,
    marketCap: 250000,
    tags: ['Verified', 'High Yield', 'Prime Location']
  },
  {
    id: '2',
    name: 'Modern Suburban Villa',
    description: 'Beautiful 4-bedroom villa with garden and pool in prestigious neighborhood',
    image: '/api/placeholder/400/300',
    price: 450000,
    totalShares: 1800,
    availableShares: 1200,
    location: 'Beverly Hills, CA',
    yearBuilt: 2019,
    squareFootage: 2800,
    type: 'Villa',
    status: 'Active',
    verified: true,
    yieldAPY: 6.8,
    totalInvestors: 42,
    creator: '0x8765...4321',
    createdAt: '2024-01-10',
    lastSale: 450,
    priceChange24h: -1.2,
    volume24h: 28000,
    floorPrice: 440,
    marketCap: 450000,
    tags: ['Verified', 'Luxury', 'Pool']
  },
  {
    id: '3',
    name: 'Commercial Office Space',
    description: 'Prime commercial real estate in business district with long-term tenants',
    image: '/api/placeholder/400/300',
    price: 800000,
    totalShares: 3200,
    availableShares: 800,
    location: 'Financial District, NYC',
    yearBuilt: 2018,
    squareFootage: 5000,
    type: 'Commercial',
    status: 'Active',
    verified: true,
    yieldAPY: 12.3,
    totalInvestors: 78,
    creator: '0x9876...1234',
    createdAt: '2024-01-05',
    lastSale: 800,
    priceChange24h: 4.1,
    volume24h: 45000,
    floorPrice: 780,
    marketCap: 800000,
    tags: ['Verified', 'Commercial', 'High Yield']
  }
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800'
    case 'Sold Out': return 'bg-red-100 text-red-800'
    case 'Coming Soon': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function NFTMarketplacePage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('explore')
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterType, setFilterType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [nfts, setNfts] = useState(mockNFTs)
  const [favorites, setFavorites] = useState<string[]>([])

  const handleToggleFavorite = (nftId: string) => {
    setFavorites(prev => 
      prev.includes(nftId) 
        ? prev.filter(id => id !== nftId)
        : [...prev, nftId]
    )
  }

  const handleBuyShares = (nftId: string, shares: number) => {
    toast.success(`Purchasing ${shares} shares of property ${nftId}`)
    // Would integrate with Web3 contract
  }

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || nft.type.toLowerCase() === filterType.toLowerCase()
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'under-500k' && nft.price < 500000) ||
                        (priceRange === '500k-1m' && nft.price >= 500000 && nft.price < 1000000) ||
                        (priceRange === 'over-1m' && nft.price >= 1000000)
    
    return matchesSearch && matchesType && matchesPrice
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price
      case 'price-high': return b.price - a.price
      case 'yield-high': return b.yieldAPY - a.yieldAPY
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default: return 0
    }
  })

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-8 w-8 text-purple-600" />
              NFT Marketplace
            </h1>
            <p className="text-gray-600">Discover and invest in tokenized real estate properties</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              List Property
            </Button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold">{formatCurrency(1250000)}</p>
                  <p className="text-sm text-green-600">+12.5% 24h</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Properties</p>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm text-green-600">+8 this week</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Investors</p>
                  <p className="text-2xl font-bold">2,847</p>
                  <p className="text-sm text-green-600">+156 this month</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Yield</p>
                  <p className="text-2xl font-bold">9.2%</p>
                  <p className="text-sm text-green-600">APY</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="my-portfolio">My Portfolio</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Property Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Price Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="under-500k">Under $500K</SelectItem>
                        <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                        <SelectItem value="over-1m">Over $1M</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="yield-high">Highest Yield</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {sortedNFTs.map((nft) => (
                <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {nft.verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/80 backdrop-blur-sm"
                        onClick={() => handleToggleFavorite(nft.id)}
                      >
                        <Heart className={`h-3 w-3 ${favorites.includes(nft.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge className={getStatusColor(nft.status)}>
                        {nft.status}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{nft.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {nft.location}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(nft.price)}</p>
                          <p className="text-sm text-gray-500">Total Value</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">{nft.yieldAPY}%</p>
                          <p className="text-sm text-gray-500">APY</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Available Shares</span>
                          <span>{nft.availableShares.toLocaleString()} / {nft.totalShares.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(nft.totalShares - nft.availableShares) / nft.totalShares * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{nft.squareFootage} sq ft</span>
                        <span>{nft.totalInvestors} investors</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={() => handleBuyShares(nft.id, 10)}>
                          Buy Shares
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sortedNFTs.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters.</p>
                  <Button onClick={() => {
                    setSearchTerm('')
                    setFilterType('all')
                    setPriceRange('all')
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Trending properties based on 24h volume, price changes, and investor interest.
              </AlertDescription>
            </Alert>
            {/* Trending content would go here */}
          </TabsContent>

          <TabsContent value="my-portfolio" className="space-y-4">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Connect your wallet to view your property portfolio and manage your investments.
              </AlertDescription>
            </Alert>
            {/* Portfolio content would go here */}
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-4">
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                Properties you're watching will appear here. Click the heart icon on any property to add it to your watchlist.
              </AlertDescription>
            </Alert>
            {/* Watchlist content would go here */}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
