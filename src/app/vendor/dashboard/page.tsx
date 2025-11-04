"use client"

import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useVendorStats, useRecentOrders } from "@/hooks/use-vendor-data"

function VendorDashboardContent() {
  const { user } = useAuth()
  const { stats, loading: statsLoading, error: statsError } = useVendorStats()
  const { orders, loading: ordersLoading, error: ordersError } = useRecentOrders()

  const dashboardStats = [
    {
      title: "Total Products",
      value: statsLoading ? "..." : stats?.totalProducts?.toString() || "0",
      icon: Package,
      description: "Active listings",
      loading: statsLoading,
    },
    {
      title: "Pending Orders",
      value: statsLoading ? "..." : stats?.pendingOrders?.toString() || "0",
      icon: ShoppingCart,
      description: "Awaiting fulfillment",
      loading: statsLoading,
    },
    {
      title: "Total Revenue",
      value: statsLoading ? "..." : `MWK ${stats?.totalRevenue?.toLocaleString() || "0"}`,
      icon: DollarSign,
      description: "All time earnings",
      loading: statsLoading,
    },
    {
      title: "Growth",
      value: statsLoading ? "..." : `+${stats?.growth?.toFixed(1) || "0"}%`,
      icon: TrendingUp,
      description: "vs last month",
      loading: statsLoading,
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
          {dashboardStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  {stat.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="text-xl md:text-2xl font-bold">
                    {stat.loading ? (
                      <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Error Handling */}
        {(statsError || ordersError) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">
              {statsError || ordersError}
            </p>
          </div>
        )}

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
              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-32"></div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">#{order.id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customer.firstName} {order.customer.lastName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs md:text-sm font-medium">
                          MWK {order.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {order.status.toLowerCase()}
                        </p>
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