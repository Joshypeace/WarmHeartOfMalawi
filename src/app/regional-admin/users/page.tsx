"use client"

import { useState } from "react"
import { Search, UserCog, MapPin, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

// Mock users data for regional admin (filtered by district)
const mockRegionalUsers = [
  {
    id: "1",
    name: "John Banda",
    email: "john@example.com",
    role: "customer",
    district: "Lilongwe",
    joinedDate: "2024-01-15",
    orders: 12,
  },
  {
    id: "2",
    name: "Grace Phiri",
    email: "grace@example.com",
    role: "customer",
    district: "Lilongwe",
    joinedDate: "2024-02-20",
    orders: 8,
  },
  {
    id: "3",
    name: "Peter Mwale",
    email: "peter@example.com",
    role: "customer",
    district: "Lilongwe",
    joinedDate: "2024-03-10",
    orders: 5,
  },
  {
    id: "4",
    name: "Lilongwe Crafts",
    email: "info@lilongwecrafts.mw",
    role: "vendor",
    district: "Lilongwe",
    joinedDate: "2024-06-15",
    orders: 0,
  },
  {
    id: "5",
    name: "Lilongwe Textiles",
    email: "textiles@lilongwe.mw",
    role: "vendor",
    district: "Lilongwe",
    joinedDate: "2024-07-01",
    orders: 0,
  },
]

const roleConfig = {
  customer: { label: "Customer", variant: "secondary" as const },
  vendor: { label: "Vendor", variant: "default" as const },
}

function RegionalAdminUsersContent() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const { toast } = useToast()

  const filteredUsers = mockRegionalUsers.filter((u) => {
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
                  <p className="text-2xl font-bold">{mockRegionalUsers.length}</p>
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
                  <p className="text-2xl font-bold">{mockRegionalUsers.filter((u) => u.role === "customer").length}</p>
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
                  <p className="text-2xl font-bold">{mockRegionalUsers.filter((u) => u.role === "vendor").length}</p>
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
                        <Badge variant={roleConfig[u.role as keyof typeof roleConfig].variant}>
                          {roleConfig[u.role as keyof typeof roleConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(u.joinedDate).toLocaleDateString()}</TableCell>
                      <TableCell>{u.orders}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUserAction(u.name, "User details viewed")}
                        >
                          <UserCog className="h-4 w-4" />
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
    <ProtectedRoute allowedRoles={["regional_admin"]}>
      <RegionalAdminUsersContent />
    </ProtectedRoute>
  )
}
