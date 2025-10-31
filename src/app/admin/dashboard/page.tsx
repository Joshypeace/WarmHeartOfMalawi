"use client"

import { Users, Store, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"
import { mockVendors, mockOrders, mockProducts } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

function AdminDashboardContent() {
  const { user } = useAuth()

  // Platform statistics
  const totalVendors = mockVendors.length
  const pendingVendors = mockVendors.filter((v) => v.status === "pending").length
  const totalProducts = mockProducts.length
  const totalOrders = mockOrders.length
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
  const platformFee = totalRevenue * 0.1 // 10% platform fee

  const stats = [
    {
      title: "Total Vendors",
      value: totalVendors,
      icon: Store,
      description: `${pendingVendors} pending approval`,
      alert: pendingVendors > 0,
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: ShoppingCart,
      description: "Active listings",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: TrendingUp,
      description: "All time",
    },
    {
      title: "Platform Revenue",
      value: `MWK ${platformFee.toLocaleString()}`,
      icon: DollarSign,
      description: "10% commission",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>

        {/* Alerts */}
        {pendingVendors > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Pending Vendor Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {pendingVendors} vendor{pendingVendors > 1 ? "s" : ""} waiting for approval
                </p>
              </div>
              <Button asChild>
                <Link href="/admin/vendors">Review Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/vendors">
                  <Store className="h-4 w-4 mr-2" />
                  Manage Vendors
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/admin/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">New vendor registration</p>
                    <p className="text-xs text-muted-foreground">Sweet Malawi</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">Order completed</p>
                    <p className="text-xs text-muted-foreground">ORD-001</p>
                  </div>
                  <Badge>Delivered</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">New product listed</p>
                    <p className="text-xs text-muted-foreground">Handwoven Basket</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Vendor Distribution</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Approved</span>
                    <span className="font-medium">{mockVendors.filter((v) => v.status === "approved").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending</span>
                    <span className="font-medium">{mockVendors.filter((v) => v.status === "pending").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rejected</span>
                    <span className="font-medium">{mockVendors.filter((v) => v.status === "rejected").length}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Status</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Delivered</span>
                    <span className="font-medium">{mockOrders.filter((o) => o.status === "delivered").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>In Progress</span>
                    <span className="font-medium">
                      {mockOrders.filter((o) => ["pending", "processing", "shipped"].includes(o.status)).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cancelled</span>
                    <span className="font-medium">{mockOrders.filter((o) => o.status === "cancelled").length}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Categories</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Crafts</span>
                    <span className="font-medium">{mockProducts.filter((p) => p.category === "Crafts").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Food</span>
                    <span className="font-medium">{mockProducts.filter((p) => p.category === "Food").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Textiles</span>
                    <span className="font-medium">{mockProducts.filter((p) => p.category === "Textiles").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
