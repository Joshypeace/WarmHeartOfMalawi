// hooks/use-admin-vendors.ts
import { useState, useEffect } from 'react'

interface Vendor {
  id: string
  vendorId: string
  name: string
  email: string
  description: string
  joinedDate: string
  totalProducts: number
  totalSales: number
  status: 'pending' | 'approved' | 'rejected'
  district: string
  logo?: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalVendors: number
  hasNext: boolean
  hasPrev: boolean
}

interface ApiResponse {
  success: boolean
  data: {
    vendors: Vendor[]
    pagination: Pagination
  }
  error?: string
}

interface ActionResponse {
  success: boolean
  message?: string
  error?: string
}

export function useAdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 0,
    totalVendors: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchVendors = async (page = 1, limit = 10, status = 'all', search = '') => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search
      })

      const response = await fetch(`/api/admin/vendors?${params}`)
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vendors')
      }

      if (data.success) {
        setVendors(data.data.vendors)
        setPagination(data.data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch vendors')
      }
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const approveVendor = async (vendorId: string): Promise<ActionResponse> => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to approve vendor'
        }
      }

      // Refresh the vendors list
      await fetchVendors()
      
      return {
        success: true,
        message: data.message
      }
    } catch (err) {
      console.error('Error approving vendor:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to approve vendor'
      }
    }
  }

  const rejectVendor = async (vendorId: string): Promise<ActionResponse> => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/reject`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to reject vendor'
        }
      }

      // Refresh the vendors list
      await fetchVendors()
      
      return {
        success: true,
        message: data.message
      }
    } catch (err) {
      console.error('Error rejecting vendor:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reject vendor'
      }
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  return {
    vendors,
    loading,
    error,
    pagination,
    fetchVendors,
    approveVendor,
    rejectVendor
  }
}