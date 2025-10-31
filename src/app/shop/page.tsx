"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockProducts } from "@/lib/mock-data"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const { addItem } = useCart()
  const { toast } = useToast()

  const categories = ["all", ...Array.from(new Set(mockProducts.map((p) => p.category)))]

  const filteredProducts = mockProducts
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      }
    })

  const handleAddToCart = (product: (typeof mockProducts)[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendorId: product.vendorId,
    })
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-balance">Shop All Products</h1>
          <p className="text-sm md:text-base text-muted-foreground text-pretty">
            Discover authentic Malawian products from local artisans and vendors
          </p>
        </div>

        {/* Filters - Responsive stacking */}
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
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
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
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 md:mb-6 text-center md:text-left">
          <p className="text-xs md:text-sm text-muted-foreground">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Product Grid - Responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/shop/${product.id}`}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.featured && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                      Featured
                    </Badge>
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
                >
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
