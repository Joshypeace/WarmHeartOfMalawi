import useSWR from 'swr'

interface FilterOptions {
  sizes: string[]
  colors: string[]
  materials: string[]
  brands: string[]
}

interface FilterOptionsResponse {
  success: boolean
  data: FilterOptions
  error?: string
}

const fetcher = async (url: string): Promise<FilterOptionsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }
  return response.json()
}

export function useFilterOptions(category: string = '') {
  const params = new URLSearchParams()
  if (category && category !== 'all') {
    params.append('category', category)
  }

  const url = `/api/shop/filter-options?${params.toString()}`

  const { data, error, isLoading } = useSWR<FilterOptionsResponse>(
    category ? url : null, // Only fetch when category is selected
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  return {
    filterOptions: data?.success ? data.data : { sizes: [], colors: [], materials: [], brands: [] },
    loading: isLoading,
    error: error?.message || (data && !data.success ? data.error : null),
  }
}