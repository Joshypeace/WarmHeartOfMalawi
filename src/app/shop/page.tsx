"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Star, Package } from "lucide-react"
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

interface Category {
  name: string
  count: number
}

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [categories, setCategories] = useState<Category[]>([])
  
  const { products, loading, error } = useShopProducts({
    search: searchQuery,
    category: selectedCategory === "all" ? "" : selectedCategory,
    sortBy
  })

  const { addItem } = useCart()
  const { toast } = useToast()

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/shop/categories')
        const data = await response.json()
        
        if (data.success) {
          setCategories(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }

    fetchCategories()
  }, [])

  const handleAddToCart = (product: any) => {
    // addItem expects a product ID (string), so pass the id
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Shop All Products</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Discover authentic Malawian products from local artisans and vendors
          </p>
        </div>

        {/* Filters - Always show these */}
        <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8 max-w-4xl mx-auto md:mx-0">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 md:h-11"
              />
            </div>

            <div className="flex gap-2 md:gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 sm:w-[160px] md:w-[200px] h-10 md:h-11">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 sm:w-[160px] md:w-[200px] h-10 md:h-11">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
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
          </div>
        </div>

        {/* Results count and clear filters - Always show */}
        <div className="mb-4 md:mb-6 text-center md:text-left">
          <p className="text-xs md:text-sm text-muted-foreground">
            {loading ? (
              "Loading products..."
            ) : error ? (
              "Unable to load products"
            ) : (
              <>
                {hasActiveFilters ? "Filtered results: " : ""}
                {products.length} {products.length === 1 ? "product" : "products"} found
                {hasActiveFilters && (
                  <Button 
                    variant="link" 
                    className="ml-2 text-xs h-auto p-0"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </>
            )}
          </p>
        </div>

        {/* Error State - Show error but keep UI intact */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="h-6 bg-muted rounded w-1/2" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Product Grid - Show when we have products */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/shop/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.featured && (
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                        Featured
                      </Badge>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="bg-white text-black">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-3 md:p-4">
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="font-semibold text-sm md:text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-primary text-primary" />
                    <span className="text-xs md:text-sm font-medium">{product.rating}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">({product.reviews})</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">by {product.vendorName}</p>
                </CardContent>
                <CardFooter className="p-3 md:p-4 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="w-full sm:w-auto">
                    <p className="text-xl md:text-2xl font-bold">MWK {product.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    size="sm"
                    className="w-full sm:w-auto text-xs md:text-sm"
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State - No products but no error */}
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

        {/* Call to Action - Always show at bottom */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-4">
                Explore our categories or contact vendors directly for custom requests.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/categories">
                    Browse Categories
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/vendors">
                    View All Vendors
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}