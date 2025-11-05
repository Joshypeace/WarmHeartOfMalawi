"use client"

import { Users, Store, ShoppingCart, DollarSign, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useAdminDashboard } from "@/hooks/use-admin-dashboard"

function AdminDashboardContent() {
  const { user } = useAuth()
  const { stats, loading, error } = useAdminDashboard()

  const statsData = [
    {
      title: "Total Vendors",
      value: stats?.totalVendors || 0,
      icon: Store,
      description: `${stats?.pendingVendors || 0} pending approval`,
      alert: (stats?.pendingVendors || 0) > 0,
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: ShoppingCart,
      description: "Active listings",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: TrendingUp,
      description: "All time",
    },
    {
      title: "Platform Revenue",
      value: `MWK ${(stats?.platformFee || 0).toLocaleString()}`,
      icon: DollarSign,
      description: "10% commission",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.firstName}</p>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
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
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.firstName}</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading dashboard</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}</p>
        </div>

        {/* Alerts */}
        {(stats?.pendingVendors || 0) > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Pending Vendor Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingVendors} vendor{stats!.pendingVendors > 1 ? "s" : ""} waiting for approval
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
          {statsData.map((stat) => {
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
                {stats?.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge variant={
                      activity.status === 'pending' ? 'secondary' : 
                      activity.status === 'cancelled' ? 'destructive' : 'default'
                    }>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </Badge>
                  </div>
                ))}
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
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
                    <span className="font-medium">{stats?.vendorDistribution.approved || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending</span>
                    <span className="font-medium">{stats?.vendorDistribution.pending || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rejected</span>
                    <span className="font-medium">{stats?.vendorDistribution.rejected || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Status</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Delivered</span>
                    <span className="font-medium">{stats?.orderStatus.delivered || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>In Progress</span>
                    <span className="font-medium">{stats?.orderStatus.inProgress || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cancelled</span>
                    <span className="font-medium">{stats?.orderStatus.cancelled || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Categories</p>
                <div className="space-y-2">
                  {stats?.topCategories?.map((category, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{category.category}</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                  ))}
                  {(!stats?.topCategories || stats.topCategories.length === 0) && (
                    <p className="text-sm text-muted-foreground">No categories yet</p>
                  )}
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
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}