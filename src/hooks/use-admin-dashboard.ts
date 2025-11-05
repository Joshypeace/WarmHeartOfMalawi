import { useState, useEffect } from 'react'

interface DashboardStats {
  totalVendors: number
  pendingVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  platformFee: number
  vendorDistribution: {
    approved: number
    pending: number
    rejected: number
  }
  orderStatus: {
    delivered: number
    inProgress: number
    cancelled: number
  }
  topCategories: Array<{
    category: string
    count: number
  }>
  recentActivity: Array<{
    type: string
    title: string
    description: string
    status: string
    createdAt: string
  }>
}

interface DashboardResponse {
  success: boolean
  data: DashboardStats
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/dashboard')

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data: DashboardResponse = await response.json()

        if (data.success) {
          setStats(data.data)
        } else {
          throw new Error('Failed to load dashboard data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  return { stats, loading, error }
}