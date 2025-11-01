"use client"

import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { mockOrders } from "@/lib/mock-data"
import  ProtectedRoute  from "@/components/protected-route"
import Link from "next/link"

const statusConfig = {
  pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
  processing: { icon: Package, label: "Processing", variant: "default" as const },
  shipped: { icon: Truck, label: "Shipped", variant: "default" as const },
  delivered: { icon: CheckCircle, label: "Delivered", variant: "default" as const },
  cancelled: { icon: XCircle, label: "Cancelled", variant: "destructive" as const },
}

function OrdersContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {mockOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
              <Button asChild>
                <Link href="/shop">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {mockOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Order {order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={statusConfig[order.status].variant} className="w-fit">
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index}>
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
                      <span className="text-xl font-bold">MWK {order.total.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1 bg-transparent">
                        View Details
                      </Button>
                      {order.status === "delivered" && (
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
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["customer", "vendor", "admin"]}>
      <OrdersContent />
    </ProtectedRoute>
  )
}
