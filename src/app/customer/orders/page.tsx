"use client"

import { Package, Clock, Truck, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import { useCustomerOrders } from "@/hooks/use-customer-orders"

const statusConfig = {
  PENDING: { icon: Clock, label: "Pending", variant: "secondary" as const },
  CONFIRMED: { icon: Package, label: "Confirmed", variant: "default" as const },
  PROCESSING: { icon: Package, label: "Processing", variant: "default" as const },
  SHIPPED: { icon: Truck, label: "Shipped", variant: "default" as const },
  DELIVERED: { icon: CheckCircle, label: "Delivered", variant: "default" as const },
  CANCELLED: { icon: XCircle, label: "Cancelled", variant: "destructive" as const },
}

function OrdersContent() {
  const { orders, loading, error, pagination } = useCustomerOrders()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-6 bg-muted rounded animate-pulse w-32"></div>
                      <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
                    </div>
                    <div className="h-8 bg-muted rounded animate-pulse w-24"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 2 }).map((_, itemIndex) => (
                    <div key={itemIndex}>
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <div className="h-5 bg-muted rounded animate-pulse w-40"></div>
                          <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                        </div>
                        <div className="h-5 bg-muted rounded animate-pulse w-20"></div>
                      </div>
                      {itemIndex < 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between">
                    <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                    <div className="h-6 bg-muted rounded animate-pulse w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show empty state for both no orders AND errors (graceful degradation)
  // This prevents customers from seeing confusing error messages
  if (error || orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6 text-center">
                {error 
                  ? "We're having trouble loading your orders. Start shopping to place your first order!"
                  : "Start shopping to see your orders here"
                }
              </p>
              <Button asChild>
                <Link href="/shop">Browse Products</Link>
              </Button>
              
              {/* Only show retry button if there's an actual error */}
              {error && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Package
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING
            
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant} className="w-fit">
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-medium">MWK {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                        {index < order.items.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">MWK {order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1 bg-transparent" asChild>
                      <Link href={`/customer/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {order.status === "DELIVERED" && (
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Leave Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('page', (pagination.currentPage - 1).toString())
                window.location.href = url.toString()
              }}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('page', (pagination.currentPage + 1).toString())
                window.location.href = url.toString()
              }}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <OrdersContent />
    </ProtectedRoute>
  )
}