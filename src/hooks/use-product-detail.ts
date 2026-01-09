import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  categoryId: string | null
  inStock: boolean
  stockCount: number
  featured: boolean
  rating: number | null
  reviewCount: number | null
  brand: string | null
  size: string | null
  color: string | null
  material: string | null
  vendorId: string
  vendorName: string
  vendorShop?: {
    id: string
    name: string
    description: string | null
    district: string | null
    logo?: string | null
  }
  createdAt: string
  updatedAt: string
  // Add category hierarchy fields
  categoryData?: {
    id: string
    name: string
    type: 'MAIN' | 'SUB'
    level: number
    parentId: string | null
    parent?: {
      id: string
      name: string
    }
  }
}

interface RelatedProduct {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  inStock: boolean
  stockCount: number
  rating: number | null
  reviewCount: number | null
  brand: string | null
  size: string | null
  color: string | null
  material: string | null
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
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ApiResponse = await response.json()

        if (data.success && data.data) {
          // Normalize product data
          const normalizedProduct = {
            ...data.data.product,
            stockCount: data.data.product.stockCount ?? 0,
          }
          
          const normalizedRelated = data.data.relatedProducts.map(rp => ({
            ...rp,
            stockCount: rp.stockCount ?? 0,
          }))
          
          setProduct(normalizedProduct)
          setRelatedProducts(normalizedRelated)
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