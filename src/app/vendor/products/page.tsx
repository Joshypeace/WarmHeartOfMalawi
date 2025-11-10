"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
}

function VendorProductsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const { toast } = useToast()
  
  const { products, loading, error, deleteProduct } = useVendorProducts(searchQuery)

  // Fetch managed categories
  useEffect(() => {
    const fetchManagedCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/admin/categories')
        const result = await response.json()
        
        if (result.success) {
          setManagedCategories(result.data.categories)
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

  // Helper function to get category name from ID
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "Uncategorized"
    
    const category = managedCategories.find(cat => cat.id === categoryId)
    return category ? category.name : "Uncategorized"
  }

  const handleDelete = async (productId: string, productName: string) => {
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No products match your search' : 'No products found. Start by adding your first product!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
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
                            <span className="capitalize">
                              {getCategoryName(product.category).toLowerCase()}
                            </span>
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
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorProductsContent />
    </ProtectedRoute>
  )
}