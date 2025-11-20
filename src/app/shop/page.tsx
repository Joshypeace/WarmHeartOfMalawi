"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Star, Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useShopProducts } from "@/hooks/use-shop-products"
import { useCategories } from "@/hooks/use-categories"

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Use SWR hooks - now fetching from /api/admin/categories
  const { products, loading, error } = useShopProducts({
    search: searchQuery,
    category: selectedCategory === "all" ? "" : selectedCategory,
    sort: sortBy
  })

  const { categories, loading: categoriesLoading } = useCategories()

  const { addItem } = useCart()
  const { toast } = useToast()

  // Get active categories with products
  const activeCategories = categories.filter(cat => cat.isActive && cat.productCount > 0)

  const handleAddToCart = (product: any) => {
    addItem(String(product.id))
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
  }

  const hasActiveFilters = searchQuery || selectedCategory !== "all"

  const formatRating = (rating: number | null) => {
    return rating ? rating.toFixed(1) : "0.0"
  }

  const formatReviewCount = (reviews: number | null) => {
    return reviews || 0
  }

  const renderRatingStars = (rating: number | null) => {
    const displayRating = rating || 0
    return (
      <div className="flex items-center gap-1">
        <Star className={`h-3 w-3 ${displayRating > 0 ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs font-medium">{formatRating(rating)}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 md:py-6 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Shop All Products</h1>
          <p className="text-sm text-muted-foreground">
            Discover authentic Malawian products from local artisans and vendors
          </p>
        </div>

        <div className="flex gap-6">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden fixed bottom-4 right-4 z-50 shadow-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>

          {/* Left Sidebar - Filters */}
          <aside className={`
            fixed md:sticky top-0 left-0 h-screen md:h-auto z-40
            w-64 md:w-72 flex-shrink-0 
            bg-background border-r md:border-r-0 md:border-0
            transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            overflow-y-auto
            p-4 md:p-0
          `}>
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden absolute top-2 right-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Categories</h3>
                <div className="space-y-1">
                  <Button
                    variant={selectedCategory === "all" ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm h-9"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Categories
                    <span className="ml-auto text-xs text-muted-foreground">
                      {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
                    </span>
                  </Button>
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  ) : activeCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 px-3">
                      No categories available
                    </p>
                  ) : (
                    activeCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm h-9"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <span className="flex-1 text-left">{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {category.productCount}
                        </span>
                      </Button>
                    ))
                  )}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Sort By</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{searchQuery}"
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {activeCategories.find(cat => cat.id === selectedCategory)?.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedCategory("all")}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  "Loading products..."
                ) : error ? (
                  "Unable to load products"
                ) : (
                  <>
                    {products.length} {products.length === 1 ? "product" : "products"} found
                    {selectedCategory !== "all" && (
                      <> in "{activeCategories.find(cat => cat.id === selectedCategory)?.name}"</>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-8">
                <Card className="max-w-md mx-auto border-dashed">
                  <CardContent className="py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Unable to Load Products</h3>
                    <p className="text-muted-foreground mb-4">
                      We're having trouble loading products right now. Please check back later.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <CardContent className="p-2 md:p-3">
                      <div className="h-3 bg-muted rounded mb-2" />
                      <div className="h-2 bg-muted rounded mb-2" />
                      <div className="h-2 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <Link href={`/shop/${product.id}`}>
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.featured && (
                          <Badge className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                            Featured
                          </Badge>
                        )}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white text-black text-xs">
                              Out of Stock
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-2 md:p-3 flex-1 flex flex-col">
                      <Link href={`/shop/${product.id}`}>
                        <h3 className="font-semibold text-xs md:text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 mb-1">
                        {renderRatingStars(product.rating)}
                        <span className="text-xs text-muted-foreground">
                          ({formatReviewCount(product.reviews)})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{product.vendorName}</p>
                      <div className="mt-auto pt-2">
                        <p className="text-base md:text-lg font-bold">MWK {product.price.toLocaleString()}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 md:p-3 pt-0">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        size="sm"
                        className="w-full h-8 text-xs"
                        disabled={!product.inStock}
                      >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12">
                <Card className="max-w-md mx-auto border-dashed">
                  <CardContent className="py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {hasActiveFilters ? "No Products Found" : "No Products Available Yet"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {hasActiveFilters 
                        ? "Try adjusting your search criteria or browse different categories."
                        : "We're working on adding new products. Please check back later for amazing Malawian products!"}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                      <Button asChild>
                        <Link href="/categories">
                          Browse Categories
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-8">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6">
                  <h3 className="text-lg font-semibold mb-2">Can't find what you're looking for?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore our categories or contact vendors directly for custom requests.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/categories">
                        Browse Categories
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/vendors">
                        View All Vendors
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}