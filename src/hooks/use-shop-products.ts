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
  stockCount: number
  featured: boolean
  rating: number | null
  reviews: number | null
  vendorId: string
  vendorName: string
  createdAt: string
  updatedAt: string
}

interface UseShopProductsProps {
  search?: string
  category?: string
  sortBy?: string
}

export function useShopProducts({ search = '', category = '', sortBy = 'featured' }: UseShopProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (category) params.append('category', category)
        if (sortBy) params.append('sortBy', sortBy)

        const response = await fetch(`/api/shop/products?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          setProducts(data.data.products || [])
        } else {
          throw new Error(data.error || 'Failed to load products')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [search, category, sortBy])

  return { products, loading, error }
}