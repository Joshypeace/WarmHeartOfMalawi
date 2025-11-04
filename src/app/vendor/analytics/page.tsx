"use client"

import { TrendingUp, DollarSign, ShoppingCart, Package, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProtectedRoute from "@/components/protected-route"
import { useVendorAnalytics } from "@/hooks/use-vendor-analytics"

function VendorAnalyticsContent() {
  const { analytics, loading, error } = useVendorAnalytics()

  // Mock data fallback while loading or on error
  const fallbackData = {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalProducts: 0,
    monthlyData: [
      { month: "Jan", revenue: 0, orders: 0 },
      { month: "Feb", revenue: 0, orders: 0 },
      { month: "Mar", revenue: 0, orders: 0 },
      { month: "Apr", revenue: 0, orders: 0 },
      { month: "May", revenue: 0, orders: 0 },
      { month: "Jun", revenue: 0, orders: 0 },
    ],
    topProducts: [],
    growthMetrics: {
      revenueGrowth: 0,
      ordersGrowth: 0,
      aovGrowth: 0,
      productsGrowth: 0,
    },
  }

  const data = analytics || fallbackData

  const metrics = [
    {
      title: "Total Revenue",
      value: `MWK ${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: `+${data.growthMetrics.revenueGrowth.toFixed(1)}% from last month`,
      loading: loading,
    },
    {
      title: "Total Orders",
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
      description: `+${data.growthMetrics.ordersGrowth.toFixed(1)}% from last month`,
      loading: loading,
    },
    {
      title: "Avg Order Value",
      value: `MWK ${Math.round(data.averageOrderValue).toLocaleString()}`,
      icon: TrendingUp,
      description: `+${data.growthMetrics.aovGrowth.toFixed(1)}% from last month`,
      loading: loading,
    },
    {
      title: "Active Products",
      value: data.totalProducts.toString(),
      icon: Package,
      description: `${data.growthMetrics.productsGrowth} added this month`,
      loading: loading,
    },
  ]

  // Find max revenue for progress bar scaling
  const maxRevenue = Math.max(...data.monthlyData.map(d => d.revenue), 1)

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your sales performance and growth</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  {metric.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  {metric.loading ? (
                    <>
                      <div className="h-8 bg-muted rounded animate-pulse mb-1"></div>
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Monthly Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              // Loading skeleton for monthly data
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 h-4 bg-muted rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                      </div>
                      <div className="h-2 bg-muted rounded-full animate-pulse"></div>
                    </div>
                    <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data.monthlyData.map((monthData) => (
                  <div key={monthData.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-muted-foreground">
                      {monthData.month}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Revenue</span>
                        <span className="text-sm font-medium">
                          MWK {monthData.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ 
                            width: `${(monthData.revenue / maxRevenue) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-muted-foreground">
                      {monthData.orders} orders
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              // Loading skeleton for top products
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sales data available yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Top products will appear here when customers make purchases
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {product.category.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">MWK {product.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} {product.sales === 1 ? 'sale' : 'sales'}
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
  )
}

export default function VendorAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorAnalyticsContent />
    </ProtectedRoute>
  )
}