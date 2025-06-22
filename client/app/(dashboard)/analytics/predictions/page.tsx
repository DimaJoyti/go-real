'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target,
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  BarChart3,
  LineChart,
  Activity
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Mock data for ML predictions
const mockSalesPredictions = [
  { period: '2024-02', predicted_sales: 28, predicted_revenue: 1480000, confidence: 0.85 },
  { period: '2024-03', predicted_sales: 32, predicted_revenue: 1690000, confidence: 0.82 },
  { period: '2024-04', predicted_sales: 29, predicted_revenue: 1530000, confidence: 0.78 },
  { period: '2024-05', predicted_sales: 35, predicted_revenue: 1850000, confidence: 0.75 },
  { period: '2024-06', predicted_sales: 38, predicted_revenue: 2010000, confidence: 0.72 },
  { period: '2024-07', predicted_sales: 33, predicted_revenue: 1740000, confidence: 0.70 }
]

const mockLeadScoring = [
  { 
    lead_id: '1', 
    name: 'John Smith', 
    score: 92, 
    grade: 'A', 
    conversion_probability: 0.92,
    next_best_action: 'Schedule property viewing',
    factors: [
      { name: 'Budget Range', impact: 90, weight: 0.3 },
      { name: 'Source Quality', impact: 85, weight: 0.25 },
      { name: 'Engagement Level', impact: 95, weight: 0.2 }
    ]
  },
  { 
    lead_id: '2', 
    name: 'Sarah Johnson', 
    score: 78, 
    grade: 'B', 
    conversion_probability: 0.78,
    next_best_action: 'Send property brochure',
    factors: [
      { name: 'Budget Range', impact: 75, weight: 0.3 },
      { name: 'Source Quality', impact: 80, weight: 0.25 },
      { name: 'Engagement Level', impact: 70, weight: 0.2 }
    ]
  }
]

const mockChurnPredictions = [
  {
    client_id: '1',
    name: 'Michael Brown',
    churn_risk: 'high',
    churn_probability: 0.85,
    days_to_churn: 15,
    risk_factors: ['Long period without contact', 'Decreased engagement'],
    interventions: ['Immediate personal outreach', 'Offer exclusive property previews']
  },
  {
    client_id: '2',
    name: 'Emily Davis',
    churn_risk: 'medium',
    churn_probability: 0.65,
    days_to_churn: 45,
    risk_factors: ['Reduced interaction frequency'],
    interventions: ['Send personalized market update', 'Invite to property events']
  }
]

const mockMarketTrends = {
  property_type: '2 BHK',
  location: 'Downtown',
  trend_direction: 'up',
  price_change: 5.2,
  demand_index: 75.0,
  supply_index: 60.0,
  predictions: [
    { month: '2024-02', predicted_price: 520000, confidence: 0.8 },
    { month: '2024-03', predicted_price: 525000, confidence: 0.78 },
    { month: '2024-04', predicted_price: 530000, confidence: 0.75 }
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
  return `${(value * 100).toFixed(1)}%`
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-800'
    case 'B': return 'bg-blue-100 text-blue-800'
    case 'C': return 'bg-yellow-100 text-yellow-800'
    case 'D': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getTrendIcon = (direction: string) => {
  return direction === 'up' ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : direction === 'down' ? (
    <TrendingDown className="h-4 w-4 text-red-500" />
  ) : (
    <Activity className="h-4 w-4 text-gray-500" />
  )
}

export default function PredictionsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('sales')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshPredictions = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
    toast.success('Predictions updated successfully!')
  }

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-600" />
              AI Predictions & Insights
            </h1>
            <p className="text-gray-600">Machine learning powered analytics and forecasting</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefreshPredictions}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Insights
            </Button>
          </div>
        </div>

        {/* AI Status Alert */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            AI models are actively learning from your data. Predictions improve over time with more data.
            Last model update: 2 hours ago
          </AlertDescription>
        </Alert>

        {/* Prediction Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Sales Forecasting</TabsTrigger>
            <TabsTrigger value="leads">Lead Scoring</TabsTrigger>
            <TabsTrigger value="churn">Churn Prediction</TabsTrigger>
            <TabsTrigger value="market">Market Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Predictions Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Sales Forecast
                  </CardTitle>
                  <CardDescription>6-month sales and revenue predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSalesPredictions.map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{prediction.period}</div>
                          <div className="text-sm text-gray-500">
                            {prediction.predicted_sales} sales
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(prediction.predicted_revenue)}</div>
                          <div className="text-sm text-gray-500">
                            {formatPercentage(prediction.confidence)} confidence
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prediction Accuracy */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance</CardTitle>
                  <CardDescription>Prediction accuracy metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Sales Prediction Accuracy</span>
                        <span>87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Revenue Prediction Accuracy</span>
                        <span>84%</span>
                      </div>
                      <Progress value={84} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Model Confidence</span>
                        <span>79%</span>
                      </div>
                      <Progress value={79} className="h-2" />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <p>• Model trained on 24 months of historical data</p>
                        <p>• Accuracy improves with more recent data</p>
                        <p>• Next model update scheduled for next week</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Scoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    High-Value Leads
                  </CardTitle>
                  <CardDescription>AI-powered lead scoring and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockLeadScoring.map((lead, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatPercentage(lead.conversion_probability)} conversion probability
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getGradeColor(lead.grade)}>
                              Grade {lead.grade}
                            </Badge>
                            <div className="text-right">
                              <div className="text-lg font-bold">{lead.score}</div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-2">Scoring Factors:</div>
                          <div className="space-y-1">
                            {lead.factors.map((factor, factorIndex) => (
                              <div key={factorIndex} className="flex items-center justify-between text-sm">
                                <span>{factor.name}</span>
                                <span className="font-medium">{factor.impact}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm font-medium text-blue-800">Next Best Action:</div>
                          <div className="text-sm text-blue-700">{lead.next_best_action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Score Distribution</CardTitle>
                  <CardDescription>Current lead quality breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Grade A</Badge>
                        <span className="text-sm">80-100 points</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">23 leads</div>
                        <div className="text-sm text-gray-500">18.4%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">Grade B</Badge>
                        <span className="text-sm">60-79 points</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">45 leads</div>
                        <div className="text-sm text-gray-500">36.0%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">Grade C</Badge>
                        <span className="text-sm">40-59 points</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">38 leads</div>
                        <div className="text-sm text-gray-500">30.4%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800">Grade D</Badge>
                        <span className="text-sm">0-39 points</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">19 leads</div>
                        <div className="text-sm text-gray-500">15.2%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="churn" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Churn Risk Clients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    At-Risk Clients
                  </CardTitle>
                  <CardDescription>Clients with high churn probability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockChurnPredictions.map((prediction, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{prediction.name}</div>
                            <div className="text-sm text-gray-500">
                              Estimated {prediction.days_to_churn} days to churn
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskColor(prediction.churn_risk)}>
                              {prediction.churn_risk.toUpperCase()} RISK
                            </Badge>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {formatPercentage(prediction.churn_probability)}
                              </div>
                              <div className="text-xs text-gray-500">Churn Prob</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-2">Risk Factors:</div>
                          <div className="flex flex-wrap gap-1">
                            {prediction.risk_factors.map((factor, factorIndex) => (
                              <Badge key={factorIndex} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 p-3 rounded">
                          <div className="text-sm font-medium text-orange-800">Recommended Actions:</div>
                          <ul className="text-sm text-orange-700 mt-1">
                            {prediction.interventions.map((intervention, interventionIndex) => (
                              <li key={interventionIndex}>• {intervention}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Churn Prevention Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Churn Prevention Impact</CardTitle>
                  <CardDescription>Results from AI-driven interventions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">73%</div>
                      <div className="text-sm text-gray-600">Successful Interventions</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold">$2.4M</div>
                        <div className="text-xs text-gray-600">Revenue Saved</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold">156</div>
                        <div className="text-xs text-gray-600">Clients Retained</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <p>• Early intervention increases retention by 65%</p>
                        <p>• Personal outreach most effective for high-risk clients</p>
                        <p>• Average intervention cost: $150 per client</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Market Analysis
                  </CardTitle>
                  <CardDescription>AI-powered market trend analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{mockMarketTrends.property_type} - {mockMarketTrends.location}</div>
                        <div className="text-sm text-gray-500">Property Type & Location</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(mockMarketTrends.trend_direction)}
                        <span className="font-medium">
                          {mockMarketTrends.price_change > 0 ? '+' : ''}{mockMarketTrends.price_change}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-blue-600">{mockMarketTrends.demand_index}</div>
                        <div className="text-sm text-gray-600">Demand Index</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-green-600">{mockMarketTrends.supply_index}</div>
                        <div className="text-sm text-gray-600">Supply Index</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Price Predictions:</div>
                      <div className="space-y-2">
                        {mockMarketTrends.predictions.map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{prediction.month}</span>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(prediction.predicted_price)}</div>
                              <div className="text-xs text-gray-500">
                                {formatPercentage(prediction.confidence)} confidence
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Insights</CardTitle>
                  <CardDescription>Key market factors and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="font-medium text-green-800 mb-2">Opportunities</div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• High demand for 2-3 BHK units in downtown area</li>
                        <li>• Price appreciation expected to continue</li>
                        <li>• Low inventory levels creating seller's market</li>
                      </ul>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="font-medium text-yellow-800 mb-2">Considerations</div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Interest rate changes may affect demand</li>
                        <li>• New supply coming online in Q3</li>
                        <li>• Seasonal slowdown expected in summer</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="font-medium text-blue-800 mb-2">Recommendations</div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Focus marketing on high-demand segments</li>
                        <li>• Adjust pricing strategy for market conditions</li>
                        <li>• Accelerate sales in current inventory</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
