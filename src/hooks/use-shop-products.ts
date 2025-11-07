// hooks/use-shop-products.ts
import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  inStock: boolean
  stock: number
  featured: boolean
  rating: number
  reviews: number
  vendorId: string
  vendorName: string
  createdAt: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalProducts: number
  hasNext: boolean
  hasPrev: boolean
}

interface ApiResponse {
  success: boolean
  data?: {
    products: Product[]
    pagination: Pagination
  }
  error?: string
}

interface UseShopProductsProps {
  search?: string
  category?: string
  vendor?: string
  sortBy?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export function useShopProducts({ 
  search = '', 
  category = '', 
  vendor = '', 
  sortBy = 'featured',
  minPrice = 0,
  maxPrice = 0,
  page = 1,
  limit = 12
}: UseShopProductsProps = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort: sortBy,
          ...(search && { search }),
          ...(category && { category }),
          ...(vendor && { vendor }),
          ...(minPrice > 0 && { minPrice: minPrice.toString() }),
          ...(maxPrice > 0 && { maxPrice: maxPrice.toString() })
        })

        const response = await fetch(`/api/shop/products?${params}`)
        const data: ApiResponse = await response.json()

        if (data.success && data.data) {
          setProducts(data.data.products)
          setPagination(data.data.pagination)
        } else {
          throw new Error(data.error || 'Failed to fetch products')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [search, category, vendor, sortBy, minPrice, maxPrice, page, limit])

  return {
    products,
    loading,
    error,
    pagination
  }
}