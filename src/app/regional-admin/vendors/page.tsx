"use client"

import { useState } from "react"
import { Search, CheckCircle, X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import  ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

// Mock vendors for regional admin
const mockRegionalVendors = [
  {
    id: "v1",
    name: "Lilongwe Crafts",
    email: "info@lilongwecrafts.mw",
    description: "Traditional Malawian crafts",
    district: "Lilongwe",
    status: "approved" as const,
    joinedDate: "2024-06-15",
    totalProducts: 24,
  },
  {
    id: "v2",
    name: "Lilongwe Textiles",
    email: "textiles@lilongwe.mw",
    description: "Quality fabrics and textiles",
    district: "Lilongwe",
    status: "pending" as const,
    joinedDate: "2025-01-20",
    totalProducts: 0,
  },
]

function RegionalAdminVendorsContent() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  const filteredVendors = mockRegionalVendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApprove = (vendorName: string) => {
    toast({
      title: "Vendor approved",
      description: `${vendorName} has been approved in ${user?.district}.`,
    })
  }

  const handleReject = (vendorName: string) => {
    toast({
      title: "Vendor rejected",
      description: `${vendorName} has been rejected in ${user?.district}.`,
      variant: "destructive",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-bold">Vendor Management</h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {user?.district}
            </Badge>
          </div>
          <p className="text-muted-foreground">Review and manage vendors in {user?.district} district</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendors</p>
                  <p className="text-2xl font-bold">{mockRegionalVendors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">
                    {mockRegionalVendors.filter((v) => v.status === "approved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {mockRegionalVendors.filter((v) => v.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendors Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No vendors found in {user?.district}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{vendor.email}</TableCell>
                      <TableCell>{vendor.totalProducts}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vendor.status === "approved"
                              ? "default"
                              : vendor.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(vendor.joinedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {vendor.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleApprove(vendor.name)}
                              className="text-success hover:bg-success/10"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleReject(vendor.name)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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

export default function RegionalAdminVendorsPage() {
  return (
    <ProtectedRoute allowedRoles={["regional_admin"]}>
      <RegionalAdminVendorsContent />
    </ProtectedRoute>
  )
}
