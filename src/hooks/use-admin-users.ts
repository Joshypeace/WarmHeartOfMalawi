// hooks/use-admin-users.ts
import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
  joinedDate: string
  orders: number
  vendorShop?: {
    id: string
    name: string
    isApproved: boolean
  }
}

interface Stats {
  totalUsers: number
  totalCustomers: number
  totalVendors: number
  totalAdmins: number
  recentUsers: number
  vendorStats: {
    approved: number
    pending: number
  }
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

interface ActionResponse {
  success: boolean
  message?: string
  error?: string
}

export function useAdminUsers() {
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
        role,
        search
      })

      const response = await fetch(`/api/admin/users?${params}`)
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
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats')
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
      console.error('Error fetching stats:', err)
      // Don't set error for stats - it's not critical
    }
  }

  const updateUserRole = async (userId: string, newRole: string): Promise<ActionResponse> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      })
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update user role'
        }
      }

      // Refresh the users list and stats
      await Promise.all([fetchUsers(), fetchStats()])
      
      return {
        success: true,
        message: data.message
      }
    } catch (err) {
      console.error('Error updating user role:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update user role'
      }
    }
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
    updateUserRole
  }
}