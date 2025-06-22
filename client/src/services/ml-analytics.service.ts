import { apiClient } from './api.service'

// ML Analytics interfaces
export interface SalesPrediction {
  period: string
  predicted_sales: number
  predicted_revenue: number
  confidence: number
  upper_bound: number
  lower_bound: number
  factors: string[]
  generated_at: string
}

export interface LeadScoring {
  lead_id: string
  score: number
  grade: string // A, B, C, D
  conversion_probability: number
  factors: ScoringFactor[]
  recommendations: string[]
  next_best_action: string
  updated_at: string
}

export interface ScoringFactor {
  name: string
  value: string
  weight: number
  impact: number
  description: string
}

export interface ChurnPrediction {
  client_id: string
  churn_risk: string // low, medium, high
  churn_probability: number
  days_to_churn: number
  risk_factors: string[]
  interventions: string[]
  last_activity: string
  predicted_at: string
}

export interface MarketTrend {
  property_type: string
  location: string
  trend_direction: string // up, down, stable
  price_change: number
  demand_index: number
  supply_index: number
  seasonality: Record<string, number>
  predictions: PricePrediction[]
  market_factors: MarketFactor[]
  generated_at: string
}

export interface PricePrediction {
  month: string
  predicted_price: number
  confidence: number
}

export interface MarketFactor {
  name: string
  impact: number
  description: string
}

export interface MLModelPerformance {
  model_name: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  last_trained: string
  training_data_size: number
  validation_score: number
}

export interface PredictionInsights {
  total_predictions: number
  accuracy_rate: number
  successful_interventions: number
  revenue_impact: number
  cost_savings: number
  model_confidence: number
  last_updated: string
}

export interface LeadScoringBatch {
  leads: LeadScoring[]
  total_count: number
  high_value_count: number
  average_score: number
  score_distribution: ScoreDistribution[]
}

export interface ScoreDistribution {
  grade: string
  count: number
  percentage: number
  min_score: number
  max_score: number
}

export interface ChurnAnalysis {
  predictions: ChurnPrediction[]
  total_at_risk: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  intervention_success_rate: number
  revenue_at_risk: number
}

export interface MarketInsights {
  trends: MarketTrend[]
  opportunities: MarketOpportunity[]
  risks: MarketRisk[]
  recommendations: MarketRecommendation[]
  market_summary: MarketSummary
}

export interface MarketOpportunity {
  type: string
  description: string
  potential_impact: number
  confidence: number
  timeline: string
}

export interface MarketRisk {
  type: string
  description: string
  probability: number
  impact: number
  mitigation: string[]
}

export interface MarketRecommendation {
  category: string
  title: string
  description: string
  priority: string // high, medium, low
  expected_impact: string
  implementation_effort: string
}

export interface MarketSummary {
  overall_trend: string
  market_health: number
  growth_rate: number
  volatility: number
  key_drivers: string[]
}

export interface ModelTrainingRequest {
  model_type: string
  data_range: {
    start_date: string
    end_date: string
  }
  features: string[]
  target_variable: string
  validation_split: number
  hyperparameters?: Record<string, any>
}

export interface ModelTrainingResponse {
  job_id: string
  status: string
  estimated_completion: string
  progress: number
}

// ML Analytics Service
export class MLAnalyticsService {
  private baseUrl = '/api/analytics/ml'

  // Sales Predictions
  async getSalesPredictions(months: number = 6): Promise<SalesPrediction[]> {
    const response = await apiClient.get(`${this.baseUrl}/predictions/sales`, {
      params: { months }
    })
    return response.data.data
  }

  // Lead Scoring
  async getLeadScoring(leadId: string): Promise<LeadScoring> {
    const response = await apiClient.get(`${this.baseUrl}/scoring/leads/${leadId}`)
    return response.data.data
  }

  async getLeadScoringBatch(filters: Record<string, any> = {}): Promise<LeadScoringBatch> {
    const response = await apiClient.get(`${this.baseUrl}/scoring/leads`, {
      params: filters
    })
    return response.data.data
  }

  async updateLeadScore(leadId: string): Promise<LeadScoring> {
    const response = await apiClient.post(`${this.baseUrl}/scoring/leads/${leadId}/update`)
    return response.data.data
  }

  // Churn Predictions
  async getChurnPredictions(limit: number = 50): Promise<ChurnPrediction[]> {
    const response = await apiClient.get(`${this.baseUrl}/predictions/churn`, {
      params: { limit }
    })
    return response.data.data
  }

  async getChurnAnalysis(filters: Record<string, any> = {}): Promise<ChurnAnalysis> {
    const response = await apiClient.get(`${this.baseUrl}/analysis/churn`, {
      params: filters
    })
    return response.data.data
  }

  async triggerChurnIntervention(clientId: string, interventionType: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/interventions/churn`, {
      client_id: clientId,
      intervention_type: interventionType
    })
  }

  // Market Trends
  async getMarketTrends(propertyType?: string, location?: string): Promise<MarketTrend> {
    const response = await apiClient.get(`${this.baseUrl}/trends/market`, {
      params: { property_type: propertyType, location }
    })
    return response.data.data
  }

  async getMarketInsights(filters: Record<string, any> = {}): Promise<MarketInsights> {
    const response = await apiClient.get(`${this.baseUrl}/insights/market`, {
      params: filters
    })
    return response.data.data
  }

  // Model Performance and Management
  async getModelPerformance(modelType?: string): Promise<MLModelPerformance[]> {
    const response = await apiClient.get(`${this.baseUrl}/models/performance`, {
      params: { model_type: modelType }
    })
    return response.data.data
  }

  async trainModel(request: ModelTrainingRequest): Promise<ModelTrainingResponse> {
    const response = await apiClient.post(`${this.baseUrl}/models/train`, request)
    return response.data.data
  }

  async getTrainingStatus(jobId: string): Promise<ModelTrainingResponse> {
    const response = await apiClient.get(`${this.baseUrl}/models/training/${jobId}`)
    return response.data.data
  }

  // Prediction Insights and Analytics
  async getPredictionInsights(period: string = 'month'): Promise<PredictionInsights> {
    const response = await apiClient.get(`${this.baseUrl}/insights/predictions`, {
      params: { period }
    })
    return response.data.data
  }

  async validatePredictions(predictionType: string, actualData: any[]): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/validation/${predictionType}`, {
      actual_data: actualData
    })
    return response.data.data
  }

  // Feature Importance and Explanations
  async getFeatureImportance(modelType: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/models/${modelType}/features`)
    return response.data.data
  }

  async explainPrediction(predictionType: string, entityId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/explain/${predictionType}/${entityId}`)
    return response.data.data
  }

  // A/B Testing for ML Models
  async createABTest(testConfig: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/ab-tests`, testConfig)
    return response.data.data
  }

  async getABTestResults(testId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/ab-tests/${testId}/results`)
    return response.data.data
  }

  // Data Quality for ML
  async getDataQuality(dataType: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/data-quality/${dataType}`)
    return response.data.data
  }

  async validateDataForML(dataType: string, data: any[]): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/data-quality/${dataType}/validate`, {
      data
    })
    return response.data.data
  }

  // Automated ML Workflows
  async createAutoMLWorkflow(config: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/automl/workflows`, config)
    return response.data.data
  }

  async getWorkflowStatus(workflowId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/automl/workflows/${workflowId}`)
    return response.data.data
  }

  // Real-time Predictions
  async getRealtimePrediction(predictionType: string, inputData: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/realtime/${predictionType}`, inputData)
    return response.data.data
  }

  // Batch Predictions
  async createBatchPrediction(predictionType: string, inputData: any[]): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/batch/${predictionType}`, {
      input_data: inputData
    })
    return response.data.data
  }

  async getBatchPredictionResults(jobId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/batch/results/${jobId}`)
    return response.data.data
  }

  // Model Monitoring and Alerts
  async getModelAlerts(): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/monitoring/alerts`)
    return response.data.data
  }

  async createModelAlert(alertConfig: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/monitoring/alerts`, alertConfig)
    return response.data.data
  }

  async getModelDrift(modelType: string, timeRange: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/monitoring/drift/${modelType}`, {
      params: { time_range: timeRange }
    })
    return response.data.data
  }

  // Prediction Feedback and Learning
  async submitPredictionFeedback(predictionId: string, feedback: any): Promise<void> {
    await apiClient.post(`${this.baseUrl}/feedback/${predictionId}`, feedback)
  }

  async getPredictionAccuracy(predictionType: string, timeRange: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/accuracy/${predictionType}`, {
      params: { time_range: timeRange }
    })
    return response.data.data
  }

  // Custom ML Models
  async uploadCustomModel(modelFile: File, metadata: any): Promise<any> {
    const formData = new FormData()
    formData.append('model', modelFile)
    formData.append('metadata', JSON.stringify(metadata))

    const response = await apiClient.post(`${this.baseUrl}/custom/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  }

  async deployCustomModel(modelId: string, deploymentConfig: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/custom/${modelId}/deploy`, deploymentConfig)
    return response.data.data
  }

  // ML Experiments and Versioning
  async createExperiment(experimentConfig: any): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/experiments`, experimentConfig)
    return response.data.data
  }

  async getExperimentResults(experimentId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/experiments/${experimentId}/results`)
    return response.data.data
  }

  async compareModels(modelIds: string[]): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/models/compare`, {
      model_ids: modelIds
    })
    return response.data.data
  }
}

// Create and export service instance
export const mlAnalyticsService = new MLAnalyticsService()
export default mlAnalyticsService
