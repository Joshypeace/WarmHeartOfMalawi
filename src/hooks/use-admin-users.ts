import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  joinedDate: string
  orders: number
  district?: string | null
  phone?: string | null
  vendorShop?: {
    id: string
    name: string
    isApproved: boolean
  } | null
}

interface UserStats {
  totalUsers: number
  totalCustomers: number
  totalVendors: number
  totalAdmins: number
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalUsers: number
  hasNext: boolean
  hasPrev: boolean
}

interface UsersResponse {
  success: boolean
  data: {
    users: User[]
    stats: UserStats
    pagination: Pagination
  }
}

export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        const page = searchParams.get('page')
        const role = searchParams.get('role')
        const search = searchParams.get('search')

        if (page) params.set('page', page)
        if (role) params.set('role', role)
        if (search) params.set('search', search)

        const queryString = params.toString()
        const url = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users'

        const response = await fetch(url)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch users')
        }

        const data: UsersResponse = await response.json()

        if (data.success) {
          setUsers(data.data.users)
          setStats(data.data.stats)
          setPagination(data.data.pagination)
        } else {
          throw new Error('Failed to load users data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [searchParams])

  const updateUserRole = async (userId: string, role: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user role')
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to update user role'
      }
    }
  }

  return { 
    users, 
    stats,
    loading, 
    error, 
    pagination,
    updateUserRole
  }
}