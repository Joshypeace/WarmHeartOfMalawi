import useSWR from 'swr'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  categoryId?: string
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
  subCategory?: string
  sort?: string
  sizes?: string[]
  colors?: string[]
  materials?: string[]
  brands?: string[]
  filters?: any // Add this for dynamic filters
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
  subCategory = '', 
  sort = 'featured',
  sizes = [],
  colors = [],
  materials = [],
  brands = [],
  filters = {} // Add this
}: UseShopProductsProps) {
  // Build query parameters
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (category) params.append('category', category)
  if (subCategory) params.append('subCategory', subCategory)
  if (sort) params.append('sort', sort)
  if (sizes.length > 0) params.append('sizes', sizes.join(','))
  if (colors.length > 0) params.append('colors', colors.join(','))
  if (materials.length > 0) params.append('materials', materials.join(','))
  if (brands.length > 0) params.append('brands', brands.join(','))
  
  // Add dynamic filters from ProductFilters component
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      if (key === 'priceRange') {
        const [min, max] = value as [number, number]
        if (min > 0) params.append('minPrice', min.toString())
        if (max < 10000) params.append('maxPrice', max.toString())
      } else if (Array.isArray(value) && value.length > 0) {
        params.append(key, value.join(','))
      } else if (typeof value === 'object' && value !== null) {
        const v = value as { min?: number | string; max?: number | string }
        if (v.min !== undefined && v.max !== undefined) {
          params.append(key, `${v.min}-${v.max}`)
        }
      } else if (typeof value === 'boolean') {
        params.append(key, value.toString())
      } else if (value !== '') {
        params.append(key, value.toString())
      }
    }
  })

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
    pagination: data?.success ? data.data.pagination : null
  }
}