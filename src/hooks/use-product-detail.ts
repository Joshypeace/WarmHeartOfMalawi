// hooks/use-product-detail.ts
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
  vendorShop?: {
    id: string
    name: string
    description: string
    district: string
    logo?: string
  }
  createdAt: string
  updatedAt: string
}

interface RelatedProduct {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  inStock: boolean
  stock: number
  rating: number
  reviews: number
  vendorId: string
  vendorName: string
}

interface ApiResponse {
  success: boolean
  data?: {
    product: Product
    relatedProducts: RelatedProduct[]
  }
  error?: string
}

export function useProductDetail(productId: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/shop/products/${productId}`)
        const data: ApiResponse = await response.json()

        if (data.success && data.data) {
          setProduct(data.data.product)
          setRelatedProducts(data.data.relatedProducts)
        } else {
          throw new Error(data.error || 'Product not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
        setProduct(null)
        setRelatedProducts([])
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProductDetail()
    }
  }, [productId])

  return {
    product,
    relatedProducts,
    loading,
    error
  }
}