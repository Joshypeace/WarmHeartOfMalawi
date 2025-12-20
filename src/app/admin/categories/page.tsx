"use client"

import { useState, useEffect, useRef, JSX} from "react"
import { Plus, Edit, Trash2, Search, Filter, Folder, Upload, X, Image as ImageIcon, ChevronDown, ChevronRight, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"
import Image from "next/image"
import React from "react"

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  slug: string | null
  isActive: boolean
  type: 'MAIN' | 'SUB'
  level: number
  parentId: string | null
  parent: Category | null
  children: Category[]
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
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
    isActive: true,
    type: "MAIN" as "MAIN" | "SUB",
    parentId: "",
    level: 1
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch categories with hierarchy
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      const result = await response.json()
      
      if (result.success) {
        // Build hierarchy from flat list
        const categoryMap = new Map<string, Category>()
        const rootCategories: Category[] = []
        
        // First pass: create map
        result.data.categories.forEach((category: Category) => {
          categoryMap.set(category.id, { ...category, children: [] })
        })
        
        // Second pass: build tree
        result.data.categories.forEach((category: Category) => {
          const categoryNode = categoryMap.get(category.id)!
          if (category.parentId && categoryMap.has(category.parentId)) {
            const parent = categoryMap.get(category.parentId)!
            parent.children.push(categoryNode)
          } else {
            rootCategories.push(categoryNode)
          }
        })
        
        setCategories(rootCategories)
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

  // Get all main categories for subcategory dropdown
  const mainCategories = categories.filter(cat => cat.type === 'MAIN')

  // Toggle row expansion
  const toggleRowExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedRows(newExpanded)
  }

  // Filter categories based on search and active status
  const filterCategories = (cats: Category[]): Category[] => {
    return cats.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          category.children.some(child => 
                            child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            child.description?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
      const matchesActive = showInactive ? true : category.isActive
      return matchesSearch && matchesActive
    })
  }

  const filteredCategories = filterCategories(categories)

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value }
    
    // Automatically set level based on type
    if (field === 'type') {
      newFormData.level = value === 'MAIN' ? 1 : 2
      if (value === 'MAIN') {
        newFormData.parentId = ''
      }
    }
    
    setFormData(newFormData)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, WebP, or SVG files.",
        variant: "destructive"
      })
      return
    }

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
      imageUrl: ""
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
      isActive: true,
      type: "MAIN",
      parentId: "",
      level: 1
    })
    setEditingCategory(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Open dialog for creating/editing
  const openDialog = (category?: Category, parentCategory?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || "",
        image: null,
        imagePreview: "",
        imageUrl: category.image || "",
        isActive: category.isActive,
        type: category.type,
        parentId: category.parentId || "",
        level: category.level
      })
    } else if (parentCategory) {
      // Creating a subcategory
      setEditingCategory(null)
      setFormData({
        name: "",
        description: "",
        image: null,
        imagePreview: "",
        imageUrl: "",
        isActive: true,
        type: "SUB",
        parentId: parentCategory.id,
        level: 2
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
          image: imageUrl,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-')
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
        fetchCategories()
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
    if (!confirm("Are you sure you want to delete this category? This will also delete all subcategories and products will lose their category association.")) {
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
        fetchCategories()
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
        fetchCategories()
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

  // Render category rows recursively
  const renderCategoryRow = (
  category: Category,
  depth = 0
): JSX.Element => {
  const isExpanded = expandedRows.has(category.id)

  return (
    <React.Fragment key={category.id}>
      <TableRow className={depth > 0 ? "bg-muted/20" : ""}>
        <TableCell style={{ paddingLeft: `${depth * 32 + 16}px` }}>
          <div className="flex items-center gap-2">
            {category.children.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleRowExpansion(category.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
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
          </div>
        </TableCell>

        {/* ...rest unchanged */}
      </TableRow>

      {isExpanded &&
        category.children.map(child =>
          renderCategoryRow(child, depth + 1)
        )}
    </React.Fragment>
  )
}

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Product Categories</h1>
            <p className="text-muted-foreground">
              Manage hierarchical categories with 2-level system (Main → Subcategories)
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
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Update the category details below.'
                    : formData.type === 'SUB'
                    ? 'Add a new subcategory'
                    : 'Add a new main category'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                      placeholder={
                        formData.type === 'MAIN' 
                          ? "e.g., Clothing, Agricultural Commodities" 
                          : "e.g., Men's Clothing, Crops & Produce"
                      }
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Category Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "MAIN" | "SUB") => handleInputChange('type', value)}
                      disabled={submitting || !!editingCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAIN">Main Category (Level 1)</SelectItem>
                        <SelectItem value="SUB">Subcategory (Level 2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'SUB' && (
                    <div className="space-y-2">
                      <Label htmlFor="parentId">Parent Category *</Label>
                      <Select
                        value={formData.parentId}
                        onValueChange={(value) => handleInputChange('parentId', value)}
                        disabled={submitting || !!editingCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mainCategories
                            .filter(cat => cat.isActive)
                            .map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                    disabled={submitting || !formData.name || (formData.type === 'SUB' && !formData.parentId)}
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
              Categories ({filteredCategories.reduce((acc, cat) => acc + 1 + cat.children.length, 0)})
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
                    {filteredCategories.map((category) => renderCategoryRow(category))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick reference for the 2-level system */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2-Level Category System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Clothing Categories</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Men's Clothing → T-Shirts, Shirts, Jeans, etc.</li>
                  <li>• Women's Clothing → Dresses, Tops, Skirts, etc.</li>
                  <li>• Kids' Clothing → Boys, Girls, Baby Wear</li>
                  <li>• Accessories → Hats, Belts, Scarves, etc.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Agricultural Commodities</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Crops & Produce → Cereals, Fruits, Vegetables</li>
                  <li>• Cash Crops → Tobacco, Tea, Coffee, etc.</li>
                  <li>• Livestock Products → Meat, Dairy, Eggs</li>
                  <li>• Farm Inputs → Seeds, Fertilizers, Pesticides</li>
                  <li>• Agricultural Equipment → Tools, Machinery</li>
                </ul>
              </div>
            </div>
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