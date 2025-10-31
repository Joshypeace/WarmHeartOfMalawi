"use client"

import { TrendingUp, DollarSign, ShoppingCart, Users, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { mockOrders, mockProducts, mockVendors } from "@/lib/mock-data"

function AdminAnalyticsContent() {
  // Platform analytics
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
  const platformFee = totalRevenue * 0.1
  const totalOrders = mockOrders.length
  const totalProducts = mockProducts.length
  const activeVendors = mockVendors.filter((v) => v.status === "approved").length

  const monthlyData = [
    { month: "Jan", revenue: 45000, orders: 32, vendors: 3 },
    { month: "Feb", revenue: 52000, orders: 38, vendors: 4 },
    { month: "Mar", revenue: 61000, orders: 45, vendors: 4 },
    { month: "Apr", revenue: 68000, orders: 52, vendors: 5 },
    { month: "May", revenue: 75000, orders: 58, vendors: 5 },
    { month: "Jun", revenue: 82000, orders: 65, vendors: 5 },
  ]

  const topVendors = mockVendors
    .filter((v) => v.status === "approved")
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">Monitor platform performance and growth</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">+18.2% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fee</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {platformFee.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">10% commission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVendors}</div>
              <p className="text-xs text-muted-foreground mt-1">1 pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Active listings</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data) => (
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
                        style={{ width: `${(data.revenue / 100000) * 100}%` }}
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
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVendors.map((vendor, index) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminAnalyticsContent />
    </ProtectedRoute>
  )
}
