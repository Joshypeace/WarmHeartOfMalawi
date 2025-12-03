// app/admin/categories/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Edit, Trash2, Search, Filter, Folder, Upload, X, Image as ImageIcon } from "lucide-react"
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
import Image from "next/image"

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    imagePreview: "",
    imageUrl: "", // For existing image
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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, WebP, or SVG files.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 2MB.",
        variant: "destructive"
      })
      return
    }

    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
      imageUrl: "" // Clear existing URL when uploading new image
    }))
  }

  // Remove image
  const removeImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview)
    }
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: "",
      imageUrl: editingCategory?.image || ""
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Reset form
  const resetForm = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview)
    }
    setFormData({
      name: "",
      description: "",
      image: null,
      imagePreview: "",
      imageUrl: "",
      isActive: true
    })
    setEditingCategory(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Open dialog for creating/editing
  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || "",
        image: null,
        imagePreview: "",
        imageUrl: category.image || "",
        isActive: category.isActive
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch('/api/admin/categories/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload image')
    }

    return result.imageUrl
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let imageUrl = formData.imageUrl

      // Upload new image if provided
      if (formData.image) {
        imageUrl = await uploadImage(formData.image)
      }

      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image: imageUrl
        })
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
              Manage product categories with images for better organization
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Update the category details below.'
                    : 'Add a new product category with an image for visual recognition.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Image */}
                <div className="space-y-2">
                  <Label>Category Image</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={submitting}
                  />
                  
                  {(formData.imagePreview || formData.imageUrl) ? (
                    <div className="relative group">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                        <Image
                          src={formData.imagePreview || formData.imageUrl || "/placeholder.svg"}
                          alt="Category preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={removeImage}
                        disabled={submitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP or SVG (max 2MB)</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
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
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
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
                        <TableCell>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
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
              </div>
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