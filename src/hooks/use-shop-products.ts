import useSWR from 'swr'

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
  size?: string
  color?: string
  material?: string
  brand?: string
  createdAt: string
  updatedAt: string
}

interface UseShopProductsProps {
  search?: string
  category?: string
  sort?: string
  sizes?: string[]
  colors?: string[]
  materials?: string[]
  brands?: string[]
}

interface ApiResponse {
  success: boolean
  data: {
    products: Product[]
    pagination: {
      currentPage: number
      totalPages: number
      totalProducts: number
      hasNext: boolean
      hasPrev: boolean
    }
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

export function useShopProducts({ 
  search = '', 
  category = '', 
  sort = 'featured',
  sizes = [],
  colors = [],
  materials = [],
  brands = []
}: UseShopProductsProps) {
  // Build query parameters
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (category) params.append('category', category)
  if (sort) params.append('sort', sort)
  if (sizes.length > 0) params.append('sizes', sizes.join(','))
  if (colors.length > 0) params.append('colors', colors.join(','))
  if (materials.length > 0) params.append('materials', materials.join(','))
  if (brands.length > 0) params.append('brands', brands.join(','))

  const url = `/api/shop/products?${params.toString()}`

  const { data, error, isLoading } = useSWR<ApiResponse>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  })

  return {
    products: data?.success ? data.data.products : [],
    loading: isLoading,
    error: error?.message || (data && !data.success ? data.error : null),
  }
}