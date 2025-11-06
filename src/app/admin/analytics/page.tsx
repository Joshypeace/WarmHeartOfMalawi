"use client"

import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ProtectedRoute from "@/components/protected-route"
import { useAdminAnalytics } from "@/hooks/use-admin-analytics"

function AdminAnalyticsContent() {
  const { analytics, loading, error, refetch } = useAdminAnalytics()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Platform Analytics</h1>
            <p className="text-muted-foreground">Monitor platform performance and growth</p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                  <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded animate-pulse mb-1"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Platform Analytics</h1>
            <p className="text-muted-foreground">Monitor platform performance and growth</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading analytics</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={refetch}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `MWK ${(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      description: analytics?.growthMetrics?.revenueGrowth ? 
        `${analytics.growthMetrics.revenueGrowth >= 0 ? '+' : ''}${analytics.growthMetrics.revenueGrowth.toFixed(1)}% from last month` : 
        "No previous data",
    },
    {
      title: "Platform Fee",
      value: `MWK ${(analytics?.platformFee || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: "10% commission",
    },
    {
      title: "Total Orders",
      value: (analytics?.totalOrders || 0).toString(),
      icon: ShoppingCart,
      description: analytics?.growthMetrics?.ordersGrowth ? 
        `${analytics.growthMetrics.ordersGrowth >= 0 ? '+' : ''}${analytics.growthMetrics.ordersGrowth.toFixed(1)}% from last month` : 
        "No previous data",
    },
    {
      title: "Active Vendors",
      value: (analytics?.activeVendors || 0).toString(),
      icon: Users,
      description: `${analytics?.pendingVendors || 0} pending approval`,
    },
    {
      title: "Total Products",
      value: (analytics?.totalProducts || 0).toString(),
      icon: Package,
      description: "Active listings",
    },
  ]

  // Find max revenue for progress bar scaling
  const maxRevenue = Math.max(...(analytics?.monthlyData?.map(d => d.revenue) || [1]))

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Platform Analytics</h1>
            <p className="text-muted-foreground">Monitor platform performance and growth</p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <Loader2 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Monthly Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Performance (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.monthlyData && analytics.monthlyData.length > 0 ? (
              <div className="space-y-4">
                {analytics.monthlyData.map((data) => (
                  <div key={data.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-muted-foreground">{data.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Revenue</span>
                        <span className="text-sm font-medium">MWK {data.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm text-muted-foreground">{data.orders} orders</p>
                      <p className="text-xs text-muted-foreground">{data.vendors} vendors</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No monthly data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topVendors && analytics.topVendors.length > 0 ? (
              <div className="space-y-4">
                {analytics.topVendors.map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor.totalProducts} products</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">MWK {vendor.totalSales.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total sales</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No vendor data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminAnalyticsContent />
    </ProtectedRoute>
  )
}