// hooks/use-vendors.ts
import { useState, useEffect } from 'react'

interface Vendor {
  id: string
  name: string
  description: string
  location: string
  status: 'approved'
  rating: number
  totalSales: number
  totalRevenue: number
  totalProducts: number
  categories: string[]
  joinedDate: string
  logo?: string
}

interface ApiResponse {
  success: boolean
  data?: {
    vendors: Vendor[]
    pagination: {
      currentPage: number
      totalPages: number
      totalVendors: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  error?: string
}

export function useVendors(search = '', district = '', category = '') {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (district) params.append('district', district)
        if (category) params.append('category', category)

        const response = await fetch(`/api/vendors?${params}`)
        const data: ApiResponse = await response.json()

        if (data.success && data.data) {
          setVendors(data.data.vendors)
        } else {
          throw new Error(data.error || 'Failed to fetch vendors')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
        setVendors([])
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [search, district, category])

  return {
    vendors,
    loading,
    error
  }
}