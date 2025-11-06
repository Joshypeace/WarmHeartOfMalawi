import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface Vendor {
  id: string
  name: string
  email: string
  description: string
  joinedDate: string
  totalProducts: number
  totalSales: number
  status: "pending" | "approved"
  district: string
  logo: string | null
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalVendors: number
  hasNext: boolean
  hasPrev: boolean
}

interface VendorsResponse {
  success: boolean
  data: {
    vendors: Vendor[]
    pagination: Pagination
  }
}

export function useAdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        const page = searchParams.get('page')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        if (page) params.set('page', page)
        if (status) params.set('status', status)
        if (search) params.set('search', search)

        const queryString = params.toString()
        const url = queryString ? `/api/admin/vendors?${queryString}` : '/api/admin/vendors'

        const response = await fetch(url)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch vendors')
        }

        const data: VendorsResponse = await response.json()

        if (data.success) {
          setVendors(data.data.vendors)
          setPagination(data.data.pagination)
        } else {
          throw new Error('Failed to load vendors data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
        setVendors([])
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalVendors: 0,
          hasNext: false,
          hasPrev: false
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [searchParams])

  const approveVendor = async (vendorId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve vendor')
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to approve vendor'
      }
    }
  }

  const rejectVendor = async (vendorId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/reject`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject vendor')
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to reject vendor'
      }
    }
  }

  return { 
    vendors, 
    loading, 
    error, 
    pagination,
    approveVendor,
    rejectVendor
  }
}