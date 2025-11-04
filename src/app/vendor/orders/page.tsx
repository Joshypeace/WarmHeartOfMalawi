"use client"

import { useState } from "react"
import { Package, Clock, Truck, CheckCircle, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { useVendorOrders } from "@/hooks/use-vendor-orders"

const statusConfig = {
  pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
  processing: { icon: Package, label: "Processing", variant: "default" as const },
  shipped: { icon: Truck, label: "Shipped", variant: "default" as const },
  delivered: { icon: CheckCircle, label: "Delivered", variant: "default" as const },
  cancelled: { icon: CheckCircle, label: "Cancelled", variant: "destructive" as const },
}

function VendorOrdersContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const { toast } = useToast()
  
  const { orders, loading, error, updateOrderStatus } = useVendorOrders(statusFilter, searchQuery)

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    
    const success = await updateOrderStatus(orderId, newStatus)
    
    if (success) {
      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus.toLowerCase()}.`,
      })
    } else {
      toast({
        title: "Update failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    }
    
    setUpdatingOrder(null)
  }

  const getCustomerName = (order: any) => {
    return `${order.customer.firstName} ${order.customer.lastName}`
  }

  const getOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Manage and fulfill customer orders</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div key={itemIndex}>
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                          <div className="h-4 bg-muted rounded w-16"></div>
                        </div>
                        {itemIndex < 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between">
                    <div className="h-5 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No orders match your current filters.' 
                    : 'Orders will appear here when customers make purchases from your products.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Package
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Customer: {getCustomerName(order)} • {getOrderDate(order.createdAt)}
                        </p>
                        {order.district && (
                          <p className="text-sm text-muted-foreground">
                            District: {order.district}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusInfo.variant} className="w-fit">
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, index) => (
                        <div key={item.id}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} • MWK {item.price.toLocaleString()} each
                              </p>
                            </div>
                            <p className="font-medium">
                              MWK {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                          {index < order.items.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </div>
                    
                    {order.shippingAddress && (
                      <>
                        <Separator className="my-4" />
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-1">Shipping Address:</p>
                          <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                        </div>
                      </>
                    )}
                    
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">MWK {order.totalAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {order.status === "pending" && (
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, "processing")} 
                          className="flex-1 min-w-[140px]"
                          disabled={updatingOrder === order.id}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Start Processing
                        </Button>
                      )}
                      {order.status === "processing" && (
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, "shipped")} 
                          className="flex-1 min-w-[140px]"
                          disabled={updatingOrder === order.id}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Mark as Shipped
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, "delivered")} 
                          className="flex-1 min-w-[140px]"
                          disabled={updatingOrder === order.id}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Mark as Delivered
                        </Button>
                      )}
                      <Button variant="outline" className="flex-1 min-w-[140px] bg-transparent">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default function VendorOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorOrdersContent />
    </ProtectedRoute>
  )
}