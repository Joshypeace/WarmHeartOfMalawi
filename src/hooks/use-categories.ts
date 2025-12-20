import useSWR from 'swr'

interface Category {
  id: string
  name: string
  description: string | null
  image?: string | null
  isActive: boolean
  type: 'MAIN' | 'SUB'
  level: number
  parentId: string | null
  productCount: number
  childrenCount: number
  parent?: {
    id: string
    name: string
  }
  children?: Array<{
    id: string
    name: string
    description: string | null
    image?: string | null
    isActive: boolean
    productCount: number
    type: 'MAIN' | 'SUB'
    level: number
  }>
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  success: boolean
  data?: {
    categories: Category[]
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

  // Extract categories from response
  const rawCategories = data?.success ? data.data?.categories || [] : []

  // Flatten categories for compatibility with existing code
  // This includes both main categories and their subcategories
  const allCategories = rawCategories.flatMap(category => [
    {
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      productCount: category.productCount,
      type: category.type,
      level: category.level,
      parentId: category.parentId,
      childrenCount: category.childrenCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent
    },
    ...(category.children || []).map(child => ({
      id: child.id,
      name: child.name,
      description: child.description,
      image: child.image,
      isActive: child.isActive,
      productCount: child.productCount,
      type: child.type,
      level: child.level,
      parentId: category.id,
      childrenCount: 0,
      createdAt: category.createdAt, // Child might not have its own created date in the nested structure
      updatedAt: category.updatedAt, // Child might not have its own updated date in the nested structure
      parent: { id: category.id, name: category.name }
    }))
  ])

  // Get only main categories for hierarchical display
  const mainCategories = rawCategories.filter(cat => cat.type === 'MAIN')

  // Get all categories as a flat list for backward compatibility
  const flatCategories = allCategories.filter(cat => cat.isActive && cat.productCount > 0)

  return {
    // For backward compatibility (used in ShopPage)
    categories: flatCategories,
    
    // For hierarchical display (if needed)
    mainCategories,
    
    // All categories including inactive (for admin)
    allCategories: rawCategories,
    
    loading: isLoading,
    error: error?.message || (data && !data.success ? data.error : null),
  }
}