import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface OrderItem {
  id: string
  productName: string
  quantity: number
  price: number
  productId: string
  images: string[]
}

interface Order {
  id: string
  status: string
  totalAmount: number
  shippingAddress: string
  district: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalOrders: number
  hasNext: boolean
  hasPrev: boolean
}

interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: Pagination
  }
}

export function useCustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        const page = searchParams.get('page')
        const status = searchParams.get('status')

        if (page) params.set('page', page)
        if (status) params.set('status', status)

        const queryString = params.toString()
        const url = queryString ? `/api/customer/orders?${queryString}` : '/api/customer/orders'

        const response = await fetch(url)

        // Even if response is not ok, try to parse it
        const data: OrdersResponse = await response.json()

        if (data.success) {
          setOrders(data.data.orders)
          setPagination(data.data.pagination)
        } else {
          // If API returns success: false, treat as no orders
          setOrders([])
          setPagination({
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNext: false,
            hasPrev: false
          })
        }
      } catch (err) {
        console.error('Orders fetch error:', err)
        // Don't set error for fetch failures - just show empty state
        // setError(err instanceof Error ? err.message : 'Failed to fetch orders')
        setOrders([])
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalOrders: 0,
          hasNext: false,
          hasPrev: false
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [searchParams])

  return { orders, loading, error, pagination }
}