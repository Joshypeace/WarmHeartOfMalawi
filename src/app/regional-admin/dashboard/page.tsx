"use client"

import { Users, Store, AlertCircle, MapPin, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { mockVendors } from "@/lib/mock-data"

function RegionalAdminDashboardContent() {
  const { user } = useAuth()

  // Mock data filtered by district
  const districtVendors = mockVendors.slice(0, 3)
  const pendingVendors = districtVendors.filter((v) => v.status === "pending")
  const totalUsers = 45
  const totalCustomers = 32
  const totalVendorsInDistrict = districtVendors.length

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "In your district",
    },
    {
      title: "Customers",
      value: totalCustomers,
      icon: Users,
      description: "Active customers",
    },
    {
      title: "Vendors",
      value: totalVendorsInDistrict,
      icon: Store,
      description: `${pendingVendors.length} pending approval`,
      alert: pendingVendors.length > 0,
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
              {user?.district}
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage users and vendors in {user?.district} district</p>
        </div>

        {/* Alerts */}
        {pendingVendors.length > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Pending Vendor Approvals</p>
                <p className="text-sm text-muted-foreground">
                  {pendingVendors.length} vendor{pendingVendors.length > 1 ? "s" : ""} in {user?.district} waiting for
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

        {/* Quick Actions */}
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
              <CardTitle>Jurisdiction Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned District</p>
                  <p className="font-medium">{user?.district}</p>
                </div>
              </div>
              {user?.city && (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Primary City</p>
                    <p className="font-medium">{user.city}</p>
                  </div>
                </div>
              )}
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  As a Regional Admin, you can manage all customers and vendors within {user?.district} district.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* District Vendors Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors in Your District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {districtVendors.map((vendor) => (
                <div key={vendor.id} className="flex justify-between items-start pb-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.email}</p>
                  </div>
                  <Badge variant={vendor.status === "approved" ? "default" : "secondary"}>{vendor.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RegionalAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["regional_admin"]}>
      <RegionalAdminDashboardContent />
    </ProtectedRoute>
  )
}
