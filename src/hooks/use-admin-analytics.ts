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
  totalProducts: number
  totalSales: number
  email: string
}

interface GrowthMetrics {
  revenueGrowth: number
  ordersGrowth: number
  vendorsGrowth: number
}

interface AnalyticsData {
  totalRevenue: number
  platformFee: number
  totalOrders: number
  totalProducts: number
  activeVendors: number
  pendingVendors: number
  monthlyData: MonthlyData[]
  topVendors: TopVendor[]
  growthMetrics: GrowthMetrics
}

interface AnalyticsResponse {
  success: boolean
  data: AnalyticsData
}

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/analytics')

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch analytics')
        }

        const data: AnalyticsResponse = await response.json()

        if (data.success) {
          setAnalytics(data.data)
        } else {
          throw new Error('Failed to load analytics data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return { analytics, loading, error }
}