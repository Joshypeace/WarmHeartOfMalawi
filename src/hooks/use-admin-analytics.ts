// hooks/use-admin-analytics.ts
import { useState, useEffect } from 'react'

interface MonthlyData {
  month: string
  revenue: number
  orders: number
  vendors: number
}

interface TopVendor {
  id: string
  name: string
  email: string
  totalProducts: number
  totalSales: number
}

interface GrowthMetrics {
  revenueGrowth: number
  ordersGrowth: number
}

interface AnalyticsData {
  totalRevenue: number
  platformFee: number
  totalOrders: number
  activeVendors: number
  pendingVendors: number
  totalProducts: number
  growthMetrics: GrowthMetrics
  monthlyData: MonthlyData[]
  topVendors: TopVendor[]
}

interface ApiResponse {
  success: boolean
  data: AnalyticsData
  error?: string
}

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/analytics')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchAnalytics()
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    analytics,
    loading,
    error,
    refetch
  }
}