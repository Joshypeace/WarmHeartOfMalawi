"use client"

import { useState } from "react"
import { Search, UserCog, Shield, Store, UserIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProtectedRoute from "@/components/protected-route"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { useToast } from "@/hooks/use-toast"

const roleConfig = {
  CUSTOMER: { label: "Customer", variant: "secondary" as const, icon: UserIcon },
  VENDOR: { label: "Vendor", variant: "default" as const, icon: Store },
  ADMIN: { label: "Admin", variant: "destructive" as const, icon: Shield },
}

function AdminUsersContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  
  const { users, stats, loading, error, updateUserRole } = useAdminUsers()
  const { toast } = useToast()

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleChangeRole = async (userId: string, userName: string, newRole: string) => {
  setUpdatingRole(userId)
  
  const result = await updateUserRole(userId, newRole)
  
  if (result.success) {
    toast({
      title: "Role updated",
      description: result.message || `${userName}'s role has been changed to ${newRole}.`,
    })
    // No need to reload the page - the hook will refresh the data
  } else {
    toast({
      title: "Error",
      description: result.error || "Failed to update user role",
      variant: "destructive",
    })
  }
  
  setUpdatingRole(null)
}

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage platform users and their roles</p>
          </div>
          
          {/* Loading skeleton */}
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage platform users and their roles</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading users</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
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
          <h1 className="text-4xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and their roles</p>
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
                </div>
                <Store className="h-8 w-8 text-muted-foreground" />
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
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="CUSTOMER">Customers</SelectItem>
              <SelectItem value="VENDOR">Vendors</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
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
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const RoleIcon = roleConfig[user.role as keyof typeof roleConfig]?.icon || UserIcon
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleConfig[user.role as keyof typeof roleConfig]?.variant || "secondary"}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleConfig[user.role as keyof typeof roleConfig]?.label || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{user.orders}</TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleChangeRole(user.id, user.name, newRole)}
                            disabled={updatingRole === user.id}
                          >
                            <SelectTrigger className="w-32">
                              {updatingRole === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">Customer</SelectItem>
                              <SelectItem value="VENDOR">Vendor</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminUsersContent />
    </ProtectedRoute>
  )
}