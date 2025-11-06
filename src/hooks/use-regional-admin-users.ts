// hooks/use-regional-admin-users.ts
import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'customer' | 'vendor'
  district: string
  joinedDate: string
  orders: number
  vendorShop?: {
    id: string
    name: string
    isApproved: boolean
    isRejected: boolean
  }
}

interface Stats {
  totalUsers: number
  totalCustomers: number
  totalVendors: number
  activeVendors: number
  pendingVendors: number
  recentUsers: number
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalUsers: number
  hasNext: boolean
  hasPrev: boolean
}

interface ApiResponse {
  success: boolean
  data: {
    users: User[]
    pagination: Pagination
  }
  error?: string
}

interface StatsResponse {
  success: boolean
  data: Stats
  error?: string
}

export function useRegionalAdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 0,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchUsers = async (page = 1, limit = 10, role = 'all', search = '') => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        role: role.toUpperCase(),
        search
      })

      const response = await fetch(`/api/regional-admin/users?${params}`)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      if (data.success) {
        setUsers(data.data.users)
        setPagination(data.data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching regional admin users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/regional-admin/users/stats')
      const data: StatsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }

      if (data.success) {
        setStats(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      console.error('Error fetching regional admin users stats:', err)
      // Don't set error for stats - it's not critical
    }
  }

  const refetch = () => {
    fetchUsers()
    fetchStats()
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUsers(), fetchStats()])
    }
    loadData()
  }, [])

  return {
    users,
    stats,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchStats,
    refetch
  }
}