"use client"

import { Package, ShoppingCart, DollarSign, TrendingUp, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import  ProtectedRoute  from "@/components/protected-route"
import Link from "next/link"
import { mockProducts, mockOrders } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

function VendorDashboardContent() {
  const { user } = useAuth()

  // Mock vendor stats - in production, this would be fetched from API
  const vendorProducts = mockProducts.filter((p) => p.vendorId === "v1")
  const vendorOrders = mockOrders.filter((o) => o.vendorId === "v1")
  const totalRevenue = vendorOrders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = vendorOrders.filter((o) => o.status === "pending" || o.status === "processing").length

  const stats = [
    {
      title: "Total Products",
      value: vendorProducts.length,
      icon: Package,
      description: "Active listings",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: ShoppingCart,
      description: "Awaiting fulfillment",
    },
    {
      title: "Total Revenue",
      value: `MWK ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "All time earnings",
    },
    {
      title: "Growth",
      value: "+12.5%",
      icon: TrendingUp,
      description: "vs last month",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Vendor Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Welcome back, {user?.firstName}</p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/vendor/products/new">
              <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 md:px-6">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent text-sm md:text-base h-10 md:h-11"
              >
                <Link href="/vendor/products">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent text-sm md:text-base h-10 md:h-11"
              >
                <Link href="/vendor/orders">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Orders
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent text-sm md:text-base h-10 md:h-11"
              >
                <Link href="/vendor/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-lg md:text-xl">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              {vendorOrders.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {vendorOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">{order.id}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.customerName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs md:text-sm font-medium">MWK {order.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function VendorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorDashboardContent />
    </ProtectedRoute>
  )
}
