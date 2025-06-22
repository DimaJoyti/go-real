'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Home,
  TrendingUp,
  Users,
  Shield,
  Heart,
  Share2,
  Download,
  ExternalLink,
  DollarSign,
  BarChart3,
  FileText,
  Vote,
  Coins,
  Clock,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

// Mock property data
const mockProperty = {
  id: '1',
  name: 'Luxury Downtown Apartment',
  description: 'Premium 2-bedroom apartment in the heart of downtown with stunning city views. This property features modern amenities, high-end finishes, and is located in one of the most desirable neighborhoods in the city.',
  images: [
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600'
  ],
  price: 250000,
  totalShares: 1000,
  availableShares: 750,
  sharePrice: 250,
  location: 'Downtown, New York',
  address: '123 Main Street, New York, NY 10001',
  yearBuilt: 2020,
  squareFootage: 1200,
  bedrooms: 2,
  bathrooms: 2,
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
  amenities: ['Pool', 'Gym', 'Parking', 'Security', 'Elevator', 'Balcony'],
  documents: [
    { name: 'Property Deed', url: '#', verified: true },
    { name: 'Insurance Policy', url: '#', verified: true },
    { name: 'Inspection Report', url: '#', verified: true },
    { name: 'Rental Agreement', url: '#', verified: false }
  ],
  financials: {
    monthlyRent: 3500,
    monthlyExpenses: 800,
    netMonthlyIncome: 2700,
    annualYield: 32400,
    occupancyRate: 95,
    propertyTax: 5000,
    insurance: 2400,
    maintenance: 3600
  },
  governance: {
    activeProposals: 2,
    totalProposals: 8,
    votingPower: 0,
    nextMeeting: '2024-02-15'
  },
  priceHistory: [
    { date: '2024-01-01', price: 240 },
    { date: '2024-01-08', price: 245 },
    { date: '2024-01-15', price: 250 },
    { date: '2024-01-22', price: 248 },
    { date: '2024-01-29', price: 252 }
  ]
}

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

export default function PropertyDetailPage() {
  const params = useParams()
  const { user } = useEnhancedAuth()
  const [selectedImage, setSelectedImage] = useState(0)
  const [shareAmount, setShareAmount] = useState(10)
  const [isFavorite, setIsFavorite] = useState(false)
  const [property] = useState(mockProperty)

  const totalInvestment = shareAmount * property.sharePrice
  const expectedAnnualReturn = totalInvestment * (property.yieldAPY / 100)
  const expectedMonthlyReturn = expectedAnnualReturn / 12

  const handleBuyShares = () => {
    if (shareAmount <= 0 || shareAmount > property.availableShares) {
      toast.error('Invalid share amount')
      return
    }
    
    toast.success(`Purchasing ${shareAmount} shares for ${formatCurrency(totalInvestment)}`)
    // Would integrate with Web3 contract
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from watchlist' : 'Added to watchlist')
  }

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/nft-marketplace">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {property.address}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleToggleFavorite}>
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={property.images[selectedImage]}
                    alt={property.name}
                    width={800}
                    height={600}
                    className="w-full h-96 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {property.verified && (
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge className="bg-blue-100 text-blue-800">
                      {property.type}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`View ${index + 1}`}
                          width={80}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{property.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 border rounded-lg">
                        <Home className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <div className="font-semibold">{property.squareFootage}</div>
                        <div className="text-sm text-gray-500">Sq Ft</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="font-semibold">{property.bedrooms}</div>
                        <div className="text-sm text-gray-500">Bedrooms</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="font-semibold">{property.bathrooms}</div>
                        <div className="text-sm text-gray-500">Bathrooms</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="font-semibold">{property.yearBuilt}</div>
                        <div className="text-sm text-gray-500">Year Built</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financials" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Statement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Monthly Rent</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(property.financials.monthlyRent)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Expenses</span>
                          <span className="font-semibold text-red-600">
                            -{formatCurrency(property.financials.monthlyExpenses)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-semibold">Net Monthly Income</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(property.financials.netMonthlyIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">Annual Yield</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(property.financials.annualYield)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Property Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Occupancy Rate</span>
                          <span className="font-semibold">{property.financials.occupancyRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Property Tax</span>
                          <span>{formatCurrency(property.financials.propertyTax)}/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance</span>
                          <span>{formatCurrency(property.financials.insurance)}/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maintenance</span>
                          <span>{formatCurrency(property.financials.maintenance)}/year</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Documents</CardTitle>
                    <CardDescription>
                      All property-related documents and certifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {property.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                {doc.verified ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Verified
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                    Pending Verification
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="governance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Governance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Your Voting Power</span>
                          <span className="font-semibold">{property.governance.votingPower}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Proposals</span>
                          <span className="font-semibold">{property.governance.activeProposals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Proposals</span>
                          <span className="font-semibold">{property.governance.totalProposals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Meeting</span>
                          <span className="font-semibold">{property.governance.nextMeeting}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Proposals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium">Roof Maintenance</div>
                          <div className="text-sm text-gray-500">Proposed budget: $5,000</div>
                          <div className="text-sm text-green-600">Status: Approved</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium">Rent Increase</div>
                          <div className="text-sm text-gray-500">Proposed increase: 3%</div>
                          <div className="text-sm text-blue-600">Status: Voting</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Price History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center border rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Price chart would be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Purchase Panel */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Share Price</span>
                    <span className="font-semibold">{formatCurrency(property.sharePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24h Change</span>
                    <span className={`font-semibold ${property.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(property.priceChange24h)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Yield</span>
                    <span className="font-semibold text-green-600">{property.yieldAPY}%</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="shares">Number of Shares</Label>
                  <Input
                    id="shares"
                    type="number"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(parseInt(e.target.value) || 0)}
                    min="1"
                    max={property.availableShares}
                  />
                  <div className="text-sm text-gray-500">
                    Available: {property.availableShares.toLocaleString()} shares
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total Investment</span>
                    <span className="font-semibold">{formatCurrency(totalInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Annual Return</span>
                    <span className="font-semibold text-green-600">{formatCurrency(expectedAnnualReturn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Monthly Return</span>
                    <span className="font-semibold text-green-600">{formatCurrency(expectedMonthlyReturn)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleBuyShares}
                  disabled={shareAmount <= 0 || shareAmount > property.availableShares}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Buy {shareAmount} Shares
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  By purchasing, you agree to the terms and conditions
                </div>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Property Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Investors</span>
                  <span className="font-semibold">{property.totalInvestors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Market Cap</span>
                  <span className="font-semibold">{formatCurrency(property.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span>24h Volume</span>
                  <span className="font-semibold">{formatCurrency(property.volume24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Floor Price</span>
                  <span className="font-semibold">{formatCurrency(property.floorPrice)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
