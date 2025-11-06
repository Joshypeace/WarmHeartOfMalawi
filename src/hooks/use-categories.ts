// hooks/use-categories.ts
import { useState, useEffect } from 'react'

interface Category {
  name: string
  count: number
  image?: string | null
  description: string
}

interface ApiResponse {
  success: boolean
  data?: Category[]
  error?: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/categories/with-images')
        const data: ApiResponse = await response.json()

        if (data.success && data.data) {
          setCategories(data.data)
        } else {
          throw new Error(data.error || 'Failed to fetch categories')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error
  }
}