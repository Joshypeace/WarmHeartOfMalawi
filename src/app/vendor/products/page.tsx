"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Loader2, Package, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useVendorProducts } from "@/hooks/use-vendor-products"

interface ManagedCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
  productCount: number
  type: 'MAIN' | 'SUB'
  level: number
  parentId: string | null
  children?: ManagedCategory[]
}

interface ProductResponse {
  id: string
  name: string
  description: string
  price: number
  category: string
  categoryId: string | null
  categoryData?: {
    id: string
    name: string
    type: 'MAIN' | 'SUB'
    level: number
    parentId: string | null
    parentName?: string
  }
  images: string[]
  stockCount: number
  inStock: boolean
  createdAt: string
  updatedAt: string
  vendorId: string
}

function VendorProductsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  
  const { products, loading, error, deleteProduct } = useVendorProducts({ search: searchQuery })

  // Fetch managed categories
  useEffect(() => {
    const fetchManagedCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/admin/categories')
        const result = await response.json()
        
        if (result.success) {
          // Filter only active categories and build hierarchy
          const activeCategories = result.data.categories.filter((cat: ManagedCategory) => cat.isActive)
          setManagedCategories(activeCategories)
        } else {
          console.error('Failed to fetch categories:', result.error)
          setManagedCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setManagedCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchManagedCategories()
  }, [])

  // Filter products by selected category
  const filteredProducts = selectedCategory 
    ? products.filter(product => 
        product.categoryData?.id === selectedCategory || 
        product.categoryId === selectedCategory ||
        (product.categoryData?.parentId === selectedCategory && product.categoryData?.type === 'SUB')
      )
    : products

  // Helper function to get category name with hierarchy
  const getCategoryName = (product: ProductResponse) => {
    if (product.categoryData) {
      const { name, type, parentName } = product.categoryData
      if (type === 'SUB' && parentName) {
        return `${parentName} - ${name}`
      }
      return name
    }
    
    if (product.categoryId) {
      const category = managedCategories.find(cat => cat.id === product.categoryId)
      if (category) {
        if (category.type === 'SUB' && category.parentId) {
          const parent = managedCategories.find(c => c.id === category.parentId)
          return parent ? `${parent.name} - ${category.name}` : category.name
        }
        return category.name
      }
    }
    
    return product.category || "Uncategorized"
  }

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Get category stats (product counts)
  const getCategoryStats = () => {
    const stats: Record<string, { total: number, main: number, sub: number }> = {}
    
    // Initialize main categories
    const mainCategories = managedCategories.filter(cat => cat.type === 'MAIN')
    mainCategories.forEach(cat => {
      stats[cat.id] = { total: 0, main: 0, sub: 0 }
    })
    
    // Count products in each category
    products.forEach(product => {
      if (product.categoryData) {
        const categoryId = product.categoryData.parentId || product.categoryData.id
        if (stats[categoryId]) {
          stats[categoryId].total++
          if (product.categoryData.type === 'MAIN') {
            stats[categoryId].main++
          } else {
            stats[categoryId].sub++
          }
        }
      } else if (product.categoryId) {
        const category = managedCategories.find(cat => cat.id === product.categoryId)
        if (category) {
          const parentId = category.parentId || category.id
          if (stats[parentId]) {
            stats[parentId].total++
            if (category.type === 'MAIN') {
              stats[parentId].main++
            } else {
              stats[parentId].sub++
            }
          }
        }
      }
    })
    
    return stats
  }

  const categoryStats = getCategoryStats()

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingProduct(productId)
    
    try {
      await deleteProduct(productId)
      toast({
        title: "Product deleted",
        description: `${productName} has been removed from your listings.`,
      })
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingProduct(null)
    }
  }

  const getStockStatus = (stockCount: number) => {
    if (stockCount > 10) return { variant: "default" as const, text: `${stockCount} units` }
    if (stockCount > 0) return { variant: "secondary" as const, text: `${stockCount} units` }
    return { variant: "destructive" as const, text: "Out of stock" }
  }

  const getProductStatus = (inStock: boolean, stockCount: number) => {
    if (inStock && stockCount > 0) return { variant: "default" as const, text: "Active" }
    return { variant: "secondary" as const, text: "Out of Stock" }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Products</h1>
            <p className="text-muted-foreground">Manage your product listings</p>
          </div>
          <Button asChild size="lg">
            <Link href="/vendor/products/new">
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Search and Category Filter */}
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Filter by Category</label>
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-6 text-xs"
                >
                  Clear filter
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-xs h-7"
              >
                All Products ({products.length})
              </Button>
              
              {categoriesLoading ? (
                <div className="h-7 px-3 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <span className="ml-2 text-xs text-muted-foreground">Loading categories...</span>
                </div>
              ) : (
                managedCategories
                  .filter(cat => cat.type === 'MAIN')
                  .map(category => {
                    const stats = categoryStats[category.id] || { total: 0, main: 0, sub: 0 }
                    const hasSubCategories = managedCategories.some(c => c.parentId === category.id)
                    
                    return (
                      <div key={category.id} className="space-y-1">
                        <Button
                          variant={selectedCategory === category.id ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                          className="text-xs h-7"
                        >
                          {category.name}
                          <Badge variant="secondary" className="ml-1 text-[10px]">
                            {stats.total}
                          </Badge>
                        </Button>
                        
                        {/* Subcategories if any */}
                        {hasSubCategories && stats.total > 0 && (
                          <div className="ml-4 flex flex-wrap gap-1">
                            {managedCategories
                              .filter(cat => cat.parentId === category.id)
                              .map(subCategory => {
                                const subStats = categoryStats[subCategory.id] || { total: 0 }
                                if (subStats.total === 0) return null
                                
                                return (
                                  <Button
                                    key={subCategory.id}
                                    variant={selectedCategory === subCategory.id ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(selectedCategory === subCategory.id ? null : subCategory.id)}
                                    className="text-xs h-6 px-2"
                                  >
                                    {subCategory.name}
                                    <Badge variant="secondary" className="ml-1 text-[10px]">
                                      {subStats.total}
                                    </Badge>
                                  </Button>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                            <div className="h-3 bg-muted rounded animate-pulse w-48"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery || selectedCategory 
                        ? 'No products match your filters' 
                        : 'No products found. Start by adding your first product!'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product: ProductResponse) => {
                    const stockStatus = getStockStatus(product.stockCount)
                    const productStatus = getProductStatus(product.inStock, product.stockCount)
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded bg-muted flex-shrink-0">
                              {product.images.length > 0 ? (
                                <Image
                                  src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10 rounded">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {categoriesLoading ? (
                            <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-sm">
                                {getCategoryName(product)}
                              </span>
                              {product.categoryData?.type === 'SUB' && (
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <ChevronRight className="h-3 w-3" />
                                  Subcategory
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          MWK {product.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={productStatus.variant}>
                            {productStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/shop/${product.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/vendor/products/${product.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={deletingProduct === product.id}
                            >
                              {deletingProduct === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
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
      </div>
    </div>
  )
}

export default function VendorProductsPage() {
  return (
    <ProtectedRoute allowedRoles={["VENDOR"]}>
      <VendorProductsContent />
    </ProtectedRoute>
  )
}