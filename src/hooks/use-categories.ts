import useSWR from 'swr'

interface ManagedCategory {
  id: string
  name: string
  description: string | null
  image?: string | null
  isActive: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data?: {
    categories: ManagedCategory[]
  }
  error?: string
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }
  return response.json()
}

export function useCategories() {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    '/api/admin/categories',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  // The data structure matches exactly what your ShopPage expects
  const categories = data?.success ? data.data?.categories || [] : []

  return {
    categories,
    loading: isLoading,
    error: error?.message || (data && !data.success ? data.error : null),
  }
}