"use client"

import { useState, useEffect } from "react"
import { Search, CheckCircle, XCircle, Clock, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProtectedRoute from "@/components/protected-route"
import { useAdminVendors } from "@/hooks/use-admin-vendors"
import { useToast } from "@/hooks/use-toast"

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  approved: { label: "Approved", variant: "default" as const, icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
}

function AdminVendorsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { vendors, loading, error, pagination, approveVendor, rejectVendor } = useAdminVendors()
  const { toast } = useToast()

  // Filter vendors based on search and status
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (vendor: any) => {
    setSelectedVendor(vendor)
    setIsDialogOpen(true)
  }

  const handleApprove = async (vendorId: string, vendorName: string) => {
  setIsProcessing(true)
  const result = await approveVendor(vendorId)
  
  if (result.success) {
    toast({
      title: "Vendor approved",
      description: result.message || `${vendorName} has been approved and can now start selling.`,
    })
    // No need to reload the page - the hook will refresh the data
  } else {
    toast({
      title: "Error",
      description: result.error || "Failed to approve vendor",
      variant: "destructive",
    })
  }
  setIsProcessing(false)
  setIsDialogOpen(false)
}


  const handleReject = async (vendorId: string, vendorName: string) => {
  setIsProcessing(true)
  const result = await rejectVendor(vendorId)
  
  if (result.success) {
    toast({
      title: "Vendor rejected",
      description: result.message || `${vendorName} application has been rejected.`,
      variant: "destructive",
    })
    // No need to reload the page - the hook will refresh the data
  } else {
    toast({
      title: "Error",
      description: result.error || "Failed to reject vendor",
      variant: "destructive",
    })
  }
  setIsProcessing(false)
  setIsDialogOpen(false)
}

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Vendor Management</h1>
            <p className="text-muted-foreground">Review and manage vendor applications</p>
          </div>
          
          {/* Loading skeleton */}
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
            <h1 className="text-4xl font-bold mb-2">Vendor Management</h1>
            <p className="text-muted-foreground">Review and manage vendor applications</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error loading vendors</h3>
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
          <h1 className="text-4xl font-bold mb-2">Vendor Management</h1>
          <p className="text-muted-foreground">Review and manage vendor applications</p>
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
              <SelectItem value="all">All Vendors</SelectItem>
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
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No vendors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => {
                    const StatusIcon = statusConfig[vendor.status].icon
                    return (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{new Date(vendor.joinedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{vendor.totalProducts}</TableCell>
                        <TableCell>MWK {vendor.totalSales.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[vendor.status].variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[vendor.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(vendor)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {vendor.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(vendor.id, vendor.name)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReject(vendor.id, vendor.name)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vendor Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedVendor?.name}</DialogTitle>
              <DialogDescription>{selectedVendor?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{selectedVendor?.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Total Products</p>
                  <p className="text-2xl font-bold">{selectedVendor?.totalProducts}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Total Sales</p>
                  <p className="text-2xl font-bold">MWK {selectedVendor?.totalSales.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">District</p>
                <p className="text-sm text-muted-foreground">{selectedVendor?.district}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                {selectedVendor && (
                  <Badge variant={statusConfig[selectedVendor.status as keyof typeof statusConfig].variant}>
                    {statusConfig[selectedVendor.status as keyof typeof statusConfig].label}
                  </Badge>
                )}
              </div>
            </div>
            {selectedVendor?.status === "pending" && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReject(selectedVendor.id, selectedVendor.name)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApprove(selectedVendor.id, selectedVendor.name)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Approve
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function AdminVendorsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminVendorsContent />
    </ProtectedRoute>
  )
}