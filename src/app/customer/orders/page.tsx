"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, Search, Filter, ArrowUpDown, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

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
  orderNumber: string
  status: string
  totalAmount: number
  shippingCost: number
  subtotal: number
  shippingAddress: any
  district: string
  shippingMethod: string
  paymentMethod: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      currentPage: number
      totalPages: number
      totalOrders: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  SHIPPED: "bg-orange-100 text-orange-800 border-orange-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

const PAYMENT_METHODS = {
  'mobile': 'Mobile Money',
  'card': 'Credit/Debit Card',
  'cod': 'Cash on Delivery'
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, sortBy, pagination.currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "10",
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
      })

      const response = await fetch(`/api/customer/orders?${params}`)
      const data: OrdersResponse = await response.json()

      if (data.success) {
        setOrders(data.data.orders)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "price-high":
        return b.totalAmount - a.totalAmount
      case "price-low":
        return a.totalAmount - b.totalAmount
      default:
        return 0
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6 md:py-8 px-4 md:px-6 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            View and track all your orders in one place
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-high">Total: High to Low</SelectItem>
                    <SelectItem value="price-low">Total: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {sortedOrders.length} of {pagination.totalOrders} orders
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {sortedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search criteria" 
                    : "You haven't placed any orders yet"
                  }
                </p>
                <Button onClick={() => router.push('/shop')}>
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Order #{order.orderNumber}
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          MWK {order.totalAmount.toLocaleString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/customer/orders/${order.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-12 h-12 rounded bg-muted flex-shrink-0">
                          <Image
                            src={item.images[0] || "/placeholder.svg"}
                            alt={item.productName}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × MWK {item.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-medium whitespace-nowrap">
                          MWK {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <div className="space-y-1">
                      <p>
                        <span className="text-muted-foreground">Payment: </span>
                        {PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS] || order.paymentMethod}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Shipping: </span>
                        {order.shippingMethod} to {order.district}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <p className="font-semibold">
                        Total: MWK {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}