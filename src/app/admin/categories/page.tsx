// app/admin/categories/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Filter, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface Category {
  id: string
  name: string
  description: string | null
  isActive: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

function CategoriesContent() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      const result = await response.json()
      
      if (result.success) {
        setCategories(result.data.categories)
      } else {
        throw new Error(result.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter categories based on search and active status
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive = showInactive ? true : category.isActive
    return matchesSearch && matchesActive
  })

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true
    })
    setEditingCategory(null)
  }

  // Open dialog for creating/editing
  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || "",
        isActive: category.isActive
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: editingCategory ? "Category updated successfully" : "Category created successfully",
        })
        setIsDialogOpen(false)
        resetForm()
        fetchCategories() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? Products in this category will lose their category association.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        fetchCategories() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive"
      })
    }
  }

  // Toggle category status
  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        })
        fetchCategories() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Product Categories</h1>
            <p className="text-muted-foreground">
              Manage product categories and organize your inventory
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Update the category details below.'
                    : 'Add a new product category to organize your inventory.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Electronics, Clothing, Food"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe this category..."
                    rows={3}
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="flex-1">
                    Active Category
                  </Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={submitting || !formData.name}
                  >
                    {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="showInactive" className="text-sm">
                  Show Inactive
                </Label>
                <Switch
                  id="showInactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Categories ({filteredCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || !showInactive 
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first category"
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Folder className="h-5 w-5 text-primary" />
                          </div>
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate" title={category.description || ""}>
                          {category.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {category.productCount} products
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCategoryStatus(category.id, category.isActive)}
                          >
                            {category.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            disabled={category.productCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {category.productCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cannot delete - has products
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <CategoriesContent />
    </ProtectedRoute>
  )
}