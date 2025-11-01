"use client"

import { useState } from "react"
import { Package, Clock, Truck, CheckCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import  ProtectedRoute  from "@/components/protected-route"
import { mockOrders } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

  // Mock vendor orders - in production, filter by actual vendor ID
  const vendorOrders = mockOrders.filter((o) => o.vendorId === "v1")

  const filteredOrders = vendorOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    toast({
      title: "Order updated",
      description: `Order ${orderId} status changed to ${newStatus}.`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Manage and fulfill customer orders</p>
        </div>

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
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">Orders will appear here when customers make purchases</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Order {order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={statusConfig[order.status].variant} className="w-fit">
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
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
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">MWK {order.total.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <Button onClick={() => handleUpdateStatus(order.id, "processing")} className="flex-1">
                          Start Processing
                        </Button>
                      )}
                      {order.status === "processing" && (
                        <Button onClick={() => handleUpdateStatus(order.id, "shipped")} className="flex-1">
                          Mark as Shipped
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button onClick={() => handleUpdateStatus(order.id, "delivered")} className="flex-1">
                          Mark as Delivered
                        </Button>
                      )}
                      <Button variant="outline" className="flex-1 bg-transparent">
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
