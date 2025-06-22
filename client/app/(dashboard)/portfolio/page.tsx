'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  Eye,
  Vote,
  Coins,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  Home,
  Users,
  Target
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

// Mock portfolio data
const mockPortfolio = {
  totalValue: 125000,
  totalInvested: 100000,
  totalReturn: 25000,
  totalReturnPercentage: 25,
  monthlyIncome: 850,
  annualYield: 10.2,
  properties: [
    {
      id: '1',
      name: 'Luxury Downtown Apartment',
      image: '/api/placeholder/300/200',
      location: 'Downtown, New York',
      sharesOwned: 100,
      totalShares: 1000,
      sharePrice: 250,
      currentValue: 25000,
      invested: 20000,
      return: 5000,
      returnPercentage: 25,
      monthlyIncome: 212.50,
      yieldAPY: 8.5,
      status: 'Active',
      lastUpdate: '2024-01-20'
    },
    {
      id: '2',
      name: 'Modern Suburban Villa',
      image: '/api/placeholder/300/200',
      location: 'Beverly Hills, CA',
      sharesOwned: 200,
      totalShares: 1800,
      sharePrice: 450,
      currentValue: 90000,
      invested: 80000,
      return: 10000,
      returnPercentage: 12.5,
      monthlyIncome: 510,
      yieldAPY: 6.8,
      status: 'Active',
      lastUpdate: '2024-01-18'
    },
    {
      id: '3',
      name: 'Commercial Office Space',
      image: '/api/placeholder/300/200',
      location: 'Financial District, NYC',
      sharesOwned: 12,
      totalShares: 3200,
      sharePrice: 800,
      currentValue: 9600,
      invested: 9600,
      return: 0,
      returnPercentage: 0,
      monthlyIncome: 127.50,
      yieldAPY: 12.3,
      status: 'Recent',
      lastUpdate: '2024-01-20'
    }
  ],
  transactions: [
    {
      id: '1',
      type: 'purchase',
      property: 'Luxury Downtown Apartment',
      shares: 50,
      price: 250,
      total: 12500,
      date: '2024-01-15',
      status: 'Completed'
    },
    {
      id: '2',
      type: 'dividend',
      property: 'Modern Suburban Villa',
      amount: 510,
      date: '2024-01-01',
      status: 'Received'
    },
    {
      id: '3',
      type: 'purchase',
      property: 'Commercial Office Space',
      shares: 12,
      price: 800,
      total: 9600,
      date: '2024-01-20',
      status: 'Completed'
    }
  ],
  governance: [
    {
      id: '1',
      property: 'Luxury Downtown Apartment',
      proposal: 'Roof Maintenance Budget',
      status: 'Active',
      votingPower: 10,
      deadline: '2024-02-01',
      description: 'Approve $5,000 budget for roof maintenance and repairs'
    },
    {
      id: '2',
      property: 'Modern Suburban Villa',
      proposal: 'Rent Increase Proposal',
      status: 'Voting',
      votingPower: 11.1,
      deadline: '2024-01-25',
      description: 'Propose 3% rent increase for next lease term'
    }
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800'
    case 'Recent': return 'bg-blue-100 text-blue-800'
    case 'Sold': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'purchase': return <ArrowDownRight className="h-4 w-4 text-red-500" />
    case 'sale': return <ArrowUpRight className="h-4 w-4 text-green-500" />
    case 'dividend': return <DollarSign className="h-4 w-4 text-blue-500" />
    default: return <Clock className="h-4 w-4 text-gray-500" />
  }
}

export default function PortfolioPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [portfolio] = useState(mockPortfolio)

  const handleVote = (proposalId: string, vote: 'for' | 'against' | 'abstain') => {
    toast.success(`Vote "${vote}" submitted for proposal ${proposalId}`)
  }

  const handleClaimDividends = (propertyId: string) => {
    toast.success(`Claiming dividends for property ${propertyId}`)
  }

  return (
    <ProtectedRoute requiredRole={UserRole.USER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="h-8 w-8 text-blue-600" />
              My Portfolio
            </h1>
            <p className="text-gray-600">Track your real estate NFT investments and returns</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {formatPercentage(portfolio.totalReturnPercentage)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Return</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(portfolio.totalReturn)}</p>
                  <p className="text-sm text-gray-500">Since inception</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolio.monthlyIncome)}</p>
                  <p className="text-sm text-blue-600">From dividends</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Yield</p>
                  <p className="text-2xl font-bold">{portfolio.annualYield}%</p>
                  <p className="text-sm text-gray-500">Annual APY</p>
                </div>
                <Percent className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                  <CardDescription>Distribution by property value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolio.properties.map((property) => {
                      const percentage = (property.currentValue / portfolio.totalValue) * 100
                      return (
                        <div key={property.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{property.name}</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{formatCurrency(property.currentValue)}</span>
                            <span className={property.return >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPercentage(property.returnPercentage)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Portfolio value over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Performance chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium capitalize">{transaction.type}</div>
                          <div className="text-sm text-gray-500">{transaction.property}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.type === 'dividend' 
                            ? formatCurrency(transaction.amount || 0)
                            : formatCurrency(transaction.total || 0)
                          }
                        </div>
                        <div className="text-sm text-gray-500">{transaction.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {portfolio.properties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative">
                    <Image
                      src={property.image}
                      alt={property.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusColor(property.status)}>
                        {property.status}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{property.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.location}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Shares Owned</div>
                          <div className="font-semibold">{property.sharesOwned}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Ownership</div>
                          <div className="font-semibold">
                            {((property.sharesOwned / property.totalShares) * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Current Value</div>
                          <div className="font-semibold">{formatCurrency(property.currentValue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Return</div>
                          <div className={`font-semibold ${property.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(property.returnPercentage)}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div>
                          <div className="text-sm text-gray-500">Monthly Income</div>
                          <div className="font-semibold text-green-600">{formatCurrency(property.monthlyIncome)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Yield APY</div>
                          <div className="font-semibold">{property.yieldAPY}%</div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/nft-marketplace/${property.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleClaimDividends(property.id)}
                        >
                          <Coins className="h-3 w-3 mr-1" />
                          Claim
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your property-related transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium capitalize">{transaction.type}</div>
                          <div className="text-sm text-gray-500">{transaction.property}</div>
                          {transaction.shares && (
                            <div className="text-sm text-gray-500">
                              {transaction.shares} shares @ {formatCurrency(transaction.price || 0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.type === 'dividend' 
                            ? `+${formatCurrency(transaction.amount || 0)}`
                            : formatCurrency(transaction.total || 0)
                          }
                        </div>
                        <div className="text-sm text-gray-500">{transaction.date}</div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="governance" className="space-y-4">
            <Alert>
              <Vote className="h-4 w-4" />
              <AlertDescription>
                Participate in property governance by voting on proposals. Your voting power is proportional to your share ownership.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {portfolio.governance.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{proposal.proposal}</CardTitle>
                        <CardDescription>{proposal.property}</CardDescription>
                      </div>
                      <Badge variant={proposal.status === 'Active' ? 'default' : 'secondary'}>
                        {proposal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700">{proposal.description}</p>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500">Your Voting Power</div>
                          <div className="font-semibold">{proposal.votingPower}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Deadline</div>
                          <div className="font-semibold">{proposal.deadline}</div>
                        </div>
                      </div>

                      {proposal.status === 'Active' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleVote(proposal.id, 'for')}
                          >
                            Vote For
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleVote(proposal.id, 'against')}
                          >
                            Vote Against
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleVote(proposal.id, 'abstain')}
                          >
                            Abstain
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
