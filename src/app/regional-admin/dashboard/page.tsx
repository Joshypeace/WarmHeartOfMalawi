"use client"

import { Users, Store, AlertCircle, MapPin, BarChart3, ShoppingCart, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRegionalAdminDashboard } from "@/hooks/use-regional-admin-dashboard"

function RegionalAdminDashboardContent() {
  const { user } = useAuth()
  const { dashboardData, loading, error, refetch } = useRegionalAdminDashboard()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">Regional Admin Dashboard</h1>
              <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-4 bg-muted rounded animate-pulse w-64"></div>
          </div>

          {/* Loading skeleton */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
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
            <h1 className="text-4xl font-bold mb-2">Regional Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and vendors in your district</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading dashboard</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={refetch}>
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
      title: "Total Users",
      value: dashboardData?.stats.totalUsers || 0,
      icon: Users,
      description: "In your district",
    },
    {
      title: "Customers",
      value: dashboardData?.stats.totalCustomers || 0,
      icon: Users,
      description: "Active customers",
    },
    {
      title: "Vendors",
      value: dashboardData?.stats.totalVendors || 0,
      icon: Store,
      description: `${dashboardData?.stats.pendingVendors || 0} pending approval`,
      alert: (dashboardData?.stats.pendingVendors || 0) > 0,
    },
  ]

  const districtStats = [
    {
      title: "Total Orders",
      value: dashboardData?.districtStats.totalOrders || 0,
      icon: ShoppingCart,
    },
    {
      title: "Total Revenue",
      value: `MWK ${(dashboardData?.districtStats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "Active Vendors",
      value: dashboardData?.districtStats.activeVendors || 0,
      icon: Store,
    },
    {
      title: "Recent Activity",
      value: dashboardData?.districtStats.recentActivity || 0,
      icon: Users,
      description: "New users (7 days)",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-bold">Regional Admin Dashboard</h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {dashboardData?.district || user?.district}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage users and vendors in {dashboardData?.district || user?.district} district
          </p>
        </div>

        {/* Alerts */}
        {(dashboardData?.stats.pendingVendors || 0) > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Pending Vendor Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {dashboardData?.stats.pendingVendors} vendor{dashboardData!.stats.pendingVendors > 1 ? "s" : ""} in {dashboardData?.district} waiting for
                  approval
                </p>
              </div>
              <Button asChild>
                <Link href="/regional-admin/vendors">Review Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
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

        {/* Quick Actions & District Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Regional Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/regional-admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/regional-admin/vendors">
                  <Store className="h-4 w-4 mr-2" />
                  Manage Vendors
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/regional-admin/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>District Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {districtStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.title} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{stat.title}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{stat.value}</p>
                      {stat.description && (
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Vendors Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Vendors in Your District</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/regional-admin/vendors">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentVendors && dashboardData.recentVendors.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentVendors.map((vendor) => (
                  <div key={vendor.id} className="flex justify-between items-start pb-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.email}</p>
                    </div>
                    <Badge 
                      variant={
                        vendor.status === "approved" ? "default" : 
                        vendor.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No vendors found in your district
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RegionalAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["REGIONAL_ADMIN"]}>
      <RegionalAdminDashboardContent />
    </ProtectedRoute>
  )
}