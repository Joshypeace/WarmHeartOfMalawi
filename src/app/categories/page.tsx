"use client"

import Link from "next/link"
import { Package, ArrowRight, Sparkles, ChevronLeft, ChevronRight, FolderTree, Grid } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  type: string
  level: number
  parentId: string | null
  productCount: number
  childrenCount: number
  children?: Category[]
}

export default function CategoriesPage() {
  const [mainCategories, setMainCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch managed categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/admin/categories')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data?.categories) {
          // Filter only main categories (level 1) that are active
          const mainCats = result.data.categories.filter((cat: any) => 
            cat.level === 1 && cat.isActive && (cat.productCount > 0 || cat.childrenCount > 0)
          )
          
          setMainCategories(mainCats)
        } else {
          throw new Error(result.error || 'Failed to fetch categories')
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const categoryColors = [
    "from-primary to-accent",
    "from-secondary to-primary",
    "from-accent to-secondary",
    "from-primary/80 to-accent/80",
    "from-secondary/80 to-primary/80",
    "from-accent/80 to-secondary/80",
  ]

  const getTotalProductCount = (category: any): number => {
    const childProductCount = category.children?.reduce((sum: number, child: any) => 
      sum + (child.productCount || 0), 0) || 0
    
    return (category.productCount || 0) + childProductCount
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Error Loading Categories</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
          >
            <Sparkles className="h-3 w-3 mr-1 fill-current text-accent" />
            Browse by Category
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Product Categories
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover authentic Malawian products organized by category
          </p>
        </div>

        {loading && (
          <div className="flex gap-8 overflow-hidden py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-80">
                <Card className="overflow-hidden border-2 animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded mb-4" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {!loading && mainCategories.length > 0 && (
          <>
            {/* Scroll buttons for desktop */}
            <div className="hidden md:flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollLeft}
                className="rounded-full h-10 w-10"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {mainCategories.length} main categories available
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollRight}
                className="rounded-full h-10 w-10"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Horizontally scrollable categories */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {mainCategories.map((category, index) => {
                const totalProducts = getTotalProductCount(category)
                const hasSubcategories = category.childrenCount > 0
                
                return (
                  <div 
                    key={category.id} 
                    className="flex-shrink-0 w-full sm:w-80 snap-start"
                  >
                    <Link
                      href={`/categories/${category.id}`}  // Changed to category detail page
                      className="group block h-full"
                    >
                      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all h-full">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              {hasSubcategories ? (
                                <FolderTree className="h-16 w-16 text-primary/40" />
                              ) : (
                                <Package className="h-16 w-16 text-primary/40" />
                              )}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge
                                className={`bg-gradient-to-r ${categoryColors[index % categoryColors.length]} border-none shadow-lg`}
                              >
                                {totalProducts} {totalProducts === 1 ? 'Product' : 'Products'}
                              </Badge>
                              {hasSubcategories && (
                                <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                                  <Grid className="h-3 w-3 mr-1" />
                                  {category.childrenCount} Subcategories
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                            <p className="text-sm text-white/80 mb-4 line-clamp-2">
                              {category.description || `Explore our ${category.name.toLowerCase()} collection`}
                            </p>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-2 bg-white/90 hover:bg-white text-foreground transition-all duration-200"
                            >
                              {hasSubcategories ? 'View Subcategories' : 'Browse Products'}
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Mobile scroll hint */}
            <div className="md:hidden text-center mt-4">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Swipe to browse more categories
                <ChevronRight className="h-4 w-4" />
              </p>
            </div>
          </>
        )}

        {!loading && mainCategories.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Categories Found</h3>
            <p className="text-muted-foreground mb-6">
              No product categories are currently available.
            </p>
            <Button asChild>
              <Link href="/shop">
                Browse All Products
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-16 text-center">
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300">
            <CardContent className="py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Browse all products or use our search to find exactly what you need
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent">
                <Link href="/shop">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}