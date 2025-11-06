// hooks/use-regional-admin-dashboard.ts
import { useState, useEffect } from 'react'

interface Vendor {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface DashboardStats {
  totalUsers: number
  totalCustomers: number
  totalVendors: number
  pendingVendors: number
  approvedVendors: number
}

interface DistrictStats {
  totalOrders: number
  totalRevenue: number
  activeVendors: number
  recentActivity: number
}

interface DashboardData {
  district: string
  stats: DashboardStats
  recentVendors: Vendor[]
  districtStats: DistrictStats
}

interface ApiResponse {
  success: boolean
  data: DashboardData
  error?: string
}

export function useRegionalAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/regional-admin/dashboard')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      if (data.success) {
        setDashboardData(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      console.error('Error fetching regional admin dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchDashboardData()
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    dashboardData,
    loading,
    error,
    refetch
  }
}