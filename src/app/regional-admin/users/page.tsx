"use client"

import { useState } from "react"
import { Search, UserCog, MapPin, UserIcon, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useRegionalAdminUsers } from "@/hooks/use-regional-admin-users"

const roleConfig = {
  customer: { label: "Customer", variant: "secondary" as const },
  vendor: { label: "Vendor", variant: "default" as const },
}

function RegionalAdminUsersContent() {
  const { user } = useAuth()
  const { users, stats, loading, error, refetch } = useRegionalAdminUsers()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const { toast } = useToast()

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleUserAction = (userName: string, action: string) => {
    toast({
      title: "Action completed",
      description: `${action} for ${userName}`,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">User Management</h1>
              <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-4 bg-muted rounded animate-pulse w-64"></div>
          </div>

          {/* Loading skeleton for stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                      <div className="h-6 bg-muted rounded animate-pulse w-12"></div>
                    </div>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading skeleton for table */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-6 bg-muted rounded animate-pulse w-32"></div>
                      <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
                    </div>
                    <div className="h-8 bg-muted rounded animate-pulse w-24"></div>
                  </div>
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
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">User Management</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user?.district}
              </Badge>
            </div>
            <p className="text-muted-foreground">Manage users and vendors in {user?.district} district</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading users</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={refetch}>
                <Loader2 className="h-4 w-4 mr-2" />
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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-bold">User Management</h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {user?.district}
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage users and vendors in {user?.district} district</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">{stats?.totalCustomers || 0}</p>
                </div>
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendors</p>
                  <p className="text-2xl font-bold">{stats?.totalVendors || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingVendors || 0} pending approval
                  </p>
                </div>
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found in {user?.district}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleConfig[u.role].variant}>
                          {roleConfig[u.role].label}
                        </Badge>
                        {u.vendorShop && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {u.vendorShop.isApproved ? (
                              <Badge variant="default" className="text-xs">Approved</Badge>
                            ) : u.vendorShop.isRejected ? (
                              <Badge variant="destructive" className="text-xs">Rejected</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pending</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{new Date(u.joinedDate).toLocaleDateString()}</TableCell>
                      <TableCell>{u.orders}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUserAction(u.name, "User details viewed")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RegionalAdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["REGIONAL_ADMIN"]}>
      <RegionalAdminUsersContent />
    </ProtectedRoute>
  )
}