"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Package, 
  Grid, 
  ChevronRight,
  ShoppingBag,
  FolderTree,
  Sparkles 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Subcategory {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  productCount: number
}

interface CategoryDetail {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  productCount: number
  childrenCount: number
  subcategories: Subcategory[]
}

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [category, setCategory] = useState<CategoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categoryId = params.categoryId as string

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First, get the main category
        const categoryRes = await fetch(`/api/admin/categories/${categoryId}`)
        if (!categoryRes.ok) {
          throw new Error(`HTTP error! status: ${categoryRes.status}`)
        }
        
        const result = await categoryRes.json()
        
        if (result.success && result.data?.category) {
          const catData = result.data.category
          
          // Format the category data
          const categoryDetail: CategoryDetail = {
            id: catData.id,
            name: catData.name,
            description: catData.description,
            image: catData.image,
            isActive: catData.isActive,
            productCount: catData.productCount || 0,
            childrenCount: catData.children?.length || 0,
            subcategories: catData.children?.map((child: any) => ({
              id: child.id,
              name: child.name,
              description: child.description,
              image: child.image,
              isActive: child.isActive,
              productCount: child.productCount || 0
            })) || []
          }
          
          setCategory(categoryDetail)
        } else {
          throw new Error(result.error || 'Category not found')
        }
      } catch (err) {
        console.error('Error fetching category:', err)
        setError(err instanceof Error ? err.message : 'Failed to load category')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  const handleViewProducts = () => {
    router.push(`/shop?category=${categoryId}`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Error Loading Category</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/categories')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Categories
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/categories')}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Categories
        </Button>

        {loading ? (
          <div className="space-y-8">
            {/* Category header skeleton */}
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="w-full md:w-1/3 h-64 rounded-lg" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-4 pt-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
            
            {/* Subcategories skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 mb-2" />
                    <Skeleton className="h-4 mb-4" />
                    <Skeleton className="h-10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : category && (
          <>
            {/* Category Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              {/* Category Image */}
              <div className="w-full md:w-1/3">
                {category.image ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-4 border-white shadow-xl">
                    <FolderTree className="h-32 w-32 text-primary/40" />
                  </div>
                )}
              </div>

              {/* Category Info */}
              <div className="flex-1">
                <div className="mb-4">
                  <Badge
                    variant="secondary"
                    className="mb-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
                  >
                    <Sparkles className="h-3 w-3 mr-1 fill-current text-accent" />
                    Main Category
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
                  <p className="text-lg text-muted-foreground mb-6">
                    {category.description || `Explore our ${category.name.toLowerCase()} collection`}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-primary">
                        {category.subcategories.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Subcategories</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-accent">
                        {category.productCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Products</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent"
                    onClick={handleViewProducts}
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    View All Products
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/categories')}
                  >
                    <Grid className="mr-2 h-5 w-5" />
                    Browse All Categories
                  </Button>
                </div>
              </div>
            </div>

            {/* Subcategories Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Subcategories</h2>
                  <p className="text-muted-foreground">
                    Browse products organized by specific types within {category.name}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {category.subcategories.length} Available
                </Badge>
              </div>

              {category.subcategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      href={`/shop?category=${subcategory.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all h-full">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {subcategory.image ? (
                            <img
                              src={subcategory.image}
                              alt={subcategory.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                              <Package className="h-16 w-16 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <Badge className="mb-3 bg-white/90 text-foreground border-none shadow-lg">
                              {subcategory.productCount} {subcategory.productCount === 1 ? 'Product' : 'Products'}
                            </Badge>
                            <h3 className="text-xl font-bold text-white mb-2">{subcategory.name}</h3>
                            <p className="text-sm text-white/80 line-clamp-2">
                              {subcategory.description || `Explore ${subcategory.name.toLowerCase()} products`}
                            </p>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Click to browse products
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Subcategories</h3>
                    <p className="text-muted-foreground mb-6">
                      This category doesn't have any subcategories yet.
                    </p>
                    <Button onClick={handleViewProducts}>
                      View Products Directly
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Direct Products Link */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Want to see all products in this category?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Browse all products under {category.name}, including items from all subcategories.
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent"
                  onClick={handleViewProducts}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  View All {category.productCount} Products
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}