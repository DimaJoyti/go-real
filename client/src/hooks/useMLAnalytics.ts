import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  mlAnalyticsService,
  SalesPrediction,
  LeadScoring,
  LeadScoringBatch,
  ChurnPrediction,
  ChurnAnalysis,
  MarketTrend,
  MarketInsights,
  MLModelPerformance,
  PredictionInsights,
  ModelTrainingRequest
} from '@/services/ml-analytics.service'

// ML Analytics query keys
export const mlAnalyticsKeys = {
  all: ['ml-analytics'] as const,
  salesPredictions: (months?: number) => [...mlAnalyticsKeys.all, 'sales-predictions', months] as const,
  leadScoring: (leadId?: string) => [...mlAnalyticsKeys.all, 'lead-scoring', leadId] as const,
  leadScoringBatch: (filters?: Record<string, any>) => [...mlAnalyticsKeys.all, 'lead-scoring-batch', filters] as const,
  churnPredictions: (limit?: number) => [...mlAnalyticsKeys.all, 'churn-predictions', limit] as const,
  churnAnalysis: (filters?: Record<string, any>) => [...mlAnalyticsKeys.all, 'churn-analysis', filters] as const,
  marketTrends: (propertyType?: string, location?: string) => [...mlAnalyticsKeys.all, 'market-trends', propertyType, location] as const,
  marketInsights: (filters?: Record<string, any>) => [...mlAnalyticsKeys.all, 'market-insights', filters] as const,
  modelPerformance: (modelType?: string) => [...mlAnalyticsKeys.all, 'model-performance', modelType] as const,
  predictionInsights: (period?: string) => [...mlAnalyticsKeys.all, 'prediction-insights', period] as const,
}

// Sales Predictions Hook
export function useSalesPredictions(months: number = 6) {
  return useQuery({
    queryKey: mlAnalyticsKeys.salesPredictions(months),
    queryFn: () => mlAnalyticsService.getSalesPredictions(months),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
  })
}

// Lead Scoring Hooks
export function useLeadScoring(leadId: string) {
  return useQuery({
    queryKey: mlAnalyticsKeys.leadScoring(leadId),
    queryFn: () => mlAnalyticsService.getLeadScoring(leadId),
    enabled: !!leadId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function useLeadScoringBatch(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: mlAnalyticsKeys.leadScoringBatch(filters),
    queryFn: () => mlAnalyticsService.getLeadScoringBatch(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useUpdateLeadScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leadId: string) => mlAnalyticsService.updateLeadScore(leadId),
    onSuccess: (data, leadId) => {
      // Update the specific lead scoring cache
      queryClient.setQueryData(mlAnalyticsKeys.leadScoring(leadId), data)
      
      // Invalidate batch queries to refresh lists
      queryClient.invalidateQueries({ queryKey: mlAnalyticsKeys.leadScoringBatch() })
      
      toast.success('Lead score updated successfully!')
    },
    onError: (error) => {
      toast.error('Failed to update lead score')
      console.error('Lead score update error:', error)
    },
  })
}

// Churn Prediction Hooks
export function useChurnPredictions(limit: number = 50) {
  return useQuery({
    queryKey: mlAnalyticsKeys.churnPredictions(limit),
    queryFn: () => mlAnalyticsService.getChurnPredictions(limit),
    staleTime: 20 * 60 * 1000, // 20 minutes
  })
}

export function useChurnAnalysis(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: mlAnalyticsKeys.churnAnalysis(filters),
    queryFn: () => mlAnalyticsService.getChurnAnalysis(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useChurnIntervention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, interventionType }: { clientId: string; interventionType: string }) =>
      mlAnalyticsService.triggerChurnIntervention(clientId, interventionType),
    onSuccess: () => {
      // Invalidate churn-related queries
      queryClient.invalidateQueries({ queryKey: mlAnalyticsKeys.churnPredictions() })
      queryClient.invalidateQueries({ queryKey: mlAnalyticsKeys.churnAnalysis() })
      
      toast.success('Churn intervention triggered successfully!')
    },
    onError: (error) => {
      toast.error('Failed to trigger churn intervention')
      console.error('Churn intervention error:', error)
    },
  })
}

// Market Trends Hooks
export function useMarketTrends(propertyType?: string, location?: string) {
  return useQuery({
    queryKey: mlAnalyticsKeys.marketTrends(propertyType, location),
    queryFn: () => mlAnalyticsService.getMarketTrends(propertyType, location),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useMarketInsights(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: mlAnalyticsKeys.marketInsights(filters),
    queryFn: () => mlAnalyticsService.getMarketInsights(filters),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// Model Performance Hook
export function useModelPerformance(modelType?: string) {
  return useQuery({
    queryKey: mlAnalyticsKeys.modelPerformance(modelType),
    queryFn: () => mlAnalyticsService.getModelPerformance(modelType),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// Model Training Hook
export function useModelTraining() {
  const [trainingJobs, setTrainingJobs] = useState<Record<string, any>>({})

  const trainModelMutation = useMutation({
    mutationFn: (request: ModelTrainingRequest) => mlAnalyticsService.trainModel(request),
    onSuccess: (response) => {
      setTrainingJobs(prev => ({
        ...prev,
        [response.job_id]: response
      }))
      toast.success('Model training started successfully!')
    },
    onError: (error) => {
      toast.error('Failed to start model training')
      console.error('Model training error:', error)
    },
  })

  const checkTrainingStatus = useCallback(async (jobId: string) => {
    try {
      const status = await mlAnalyticsService.getTrainingStatus(jobId)
      setTrainingJobs(prev => ({
        ...prev,
        [jobId]: status
      }))
      return status
    } catch (error) {
      console.error('Failed to check training status:', error)
      return null
    }
  }, [])

  return {
    trainModel: trainModelMutation.mutate,
    isTraining: trainModelMutation.isPending,
    trainingJobs,
    checkTrainingStatus,
    error: trainModelMutation.error,
  }
}

// Prediction Insights Hook
export function usePredictionInsights(period: string = 'month') {
  return useQuery({
    queryKey: mlAnalyticsKeys.predictionInsights(period),
    queryFn: () => mlAnalyticsService.getPredictionInsights(period),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Prediction Feedback Hook
export function usePredictionFeedback() {
  return useMutation({
    mutationFn: ({ predictionId, feedback }: { predictionId: string; feedback: any }) =>
      mlAnalyticsService.submitPredictionFeedback(predictionId, feedback),
    onSuccess: () => {
      toast.success('Feedback submitted successfully!')
    },
    onError: (error) => {
      toast.error('Failed to submit feedback')
      console.error('Prediction feedback error:', error)
    },
  })
}

// Real-time Prediction Hook
export function useRealtimePrediction() {
  const [isLoading, setIsLoading] = useState(false)
  const [predictions, setPredictions] = useState<Record<string, any>>({})

  const getPrediction = useCallback(async (predictionType: string, inputData: any) => {
    setIsLoading(true)
    try {
      const result = await mlAnalyticsService.getRealtimePrediction(predictionType, inputData)
      setPredictions(prev => ({
        ...prev,
        [`${predictionType}_${Date.now()}`]: result
      }))
      return result
    } catch (error) {
      toast.error('Failed to get real-time prediction')
      console.error('Real-time prediction error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    getPrediction,
    isLoading,
    predictions,
  }
}

// Batch Prediction Hook
export function useBatchPrediction() {
  const [batchJobs, setBatchJobs] = useState<Record<string, any>>({})

  const createBatchPredictionMutation = useMutation({
    mutationFn: ({ predictionType, inputData }: { predictionType: string; inputData: any[] }) =>
      mlAnalyticsService.createBatchPrediction(predictionType, inputData),
    onSuccess: (response) => {
      setBatchJobs(prev => ({
        ...prev,
        [response.job_id]: response
      }))
      toast.success('Batch prediction job started!')
    },
    onError: (error) => {
      toast.error('Failed to start batch prediction')
      console.error('Batch prediction error:', error)
    },
  })

  const checkBatchResults = useCallback(async (jobId: string) => {
    try {
      const results = await mlAnalyticsService.getBatchPredictionResults(jobId)
      setBatchJobs(prev => ({
        ...prev,
        [jobId]: { ...prev[jobId], results }
      }))
      return results
    } catch (error) {
      console.error('Failed to get batch results:', error)
      return null
    }
  }, [])

  return {
    createBatchPrediction: createBatchPredictionMutation.mutate,
    isCreating: createBatchPredictionMutation.isPending,
    batchJobs,
    checkBatchResults,
    error: createBatchPredictionMutation.error,
  }
}

// Model Monitoring Hook
export function useModelMonitoring() {
  const alertsQuery = useQuery({
    queryKey: [...mlAnalyticsKeys.all, 'model-alerts'],
    queryFn: () => mlAnalyticsService.getModelAlerts(),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const createAlertMutation = useMutation({
    mutationFn: (alertConfig: any) => mlAnalyticsService.createModelAlert(alertConfig),
    onSuccess: () => {
      alertsQuery.refetch()
      toast.success('Model alert created successfully!')
    },
    onError: (error) => {
      toast.error('Failed to create model alert')
      console.error('Model alert error:', error)
    },
  })

  return {
    alerts: alertsQuery.data,
    isLoadingAlerts: alertsQuery.isLoading,
    createAlert: createAlertMutation.mutate,
    isCreatingAlert: createAlertMutation.isPending,
    refetchAlerts: alertsQuery.refetch,
  }
}

// Combined ML Analytics Dashboard Hook
export function useMLAnalyticsDashboard() {
  const salesPredictions = useSalesPredictions()
  const leadScoringBatch = useLeadScoringBatch()
  const churnAnalysis = useChurnAnalysis()
  const marketInsights = useMarketInsights()
  const modelPerformance = useModelPerformance()
  const predictionInsights = usePredictionInsights()

  const isLoading = salesPredictions.isLoading ||
                   leadScoringBatch.isLoading ||
                   churnAnalysis.isLoading ||
                   marketInsights.isLoading ||
                   modelPerformance.isLoading ||
                   predictionInsights.isLoading

  const isError = salesPredictions.isError ||
                  leadScoringBatch.isError ||
                  churnAnalysis.isError ||
                  marketInsights.isError ||
                  modelPerformance.isError ||
                  predictionInsights.isError

  const error = salesPredictions.error ||
                leadScoringBatch.error ||
                churnAnalysis.error ||
                marketInsights.error ||
                modelPerformance.error ||
                predictionInsights.error

  return {
    salesPredictions: salesPredictions.data,
    leadScoring: leadScoringBatch.data,
    churnAnalysis: churnAnalysis.data,
    marketInsights: marketInsights.data,
    modelPerformance: modelPerformance.data,
    predictionInsights: predictionInsights.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      salesPredictions.refetch()
      leadScoringBatch.refetch()
      churnAnalysis.refetch()
      marketInsights.refetch()
      modelPerformance.refetch()
      predictionInsights.refetch()
    }
  }
}

// ML Analytics Utilities Hook
export function useMLAnalyticsUtils() {
  const queryClient = useQueryClient()

  const refreshAllPredictions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: mlAnalyticsKeys.all })
    toast.success('All predictions refreshed!')
  }, [queryClient])

  const clearPredictionCache = useCallback((predictionType?: string) => {
    if (predictionType) {
      queryClient.removeQueries({ queryKey: [...mlAnalyticsKeys.all, predictionType] })
    } else {
      queryClient.removeQueries({ queryKey: mlAnalyticsKeys.all })
    }
    toast.success('Prediction cache cleared!')
  }, [queryClient])

  return {
    refreshAllPredictions,
    clearPredictionCache,
  }
}

export default {
  useSalesPredictions,
  useLeadScoring,
  useLeadScoringBatch,
  useUpdateLeadScore,
  useChurnPredictions,
  useChurnAnalysis,
  useChurnIntervention,
  useMarketTrends,
  useMarketInsights,
  useModelPerformance,
  useModelTraining,
  usePredictionInsights,
  usePredictionFeedback,
  useRealtimePrediction,
  useBatchPrediction,
  useModelMonitoring,
  useMLAnalyticsDashboard,
  useMLAnalyticsUtils,
}
