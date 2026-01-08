"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ShoppingBag, Star, Package, ChevronLeft, ChevronRight, TrendingUp, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProducts, type Product as MockProduct } from "@/lib/mock-data"

// Pre-generate consistent discount percentages to avoid hydration errors
const generateConsistentDiscounts = () => {
  const fixedDiscounts = [15, 20, 25, 30, 35, 40, 45, 50]
  return fixedDiscounts
}

// Define category interface based on your API response
interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  productCount: number
}

// Define API Product interface based on your Prisma schema
interface ApiProduct {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  categoryId: string | null
  inStock: boolean
  stockCount: number
  vendorId: string
  vendorName: string
  rating: number
  reviewCount: number
  featured: boolean
  brand?: string | null
  size?: string | null
  color?: string | null
  material?: string | null
  createdAt: string
  updatedAt: string
  orderCount?: number
  popularityBadge?: string
  dealMetric?: string
}

// Union type for featured products
type DisplayProduct = ApiProduct | MockProduct

export default function HomePage() {
  const heroProducts = mockProducts.slice(0, 5)
  const [currentSlide, setCurrentSlide] = useState(0)
  const topDeals = mockProducts.slice(0, 8)

  const [deals, setDeals] = useState<DisplayProduct[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [dealsError, setDealsError] = useState<string | null>(null)
  
  // Featured products state
  const [featuredProducts, setFeaturedProducts] = useState<DisplayProduct[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [featuredError, setFeaturedError] = useState<string | null>(null)
  
  // Use consistent discounts to avoid hydration errors
  const [discounts, setDiscounts] = useState<number[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  
  // Refs for horizontal scrolling
  const categoriesRef = useRef<HTMLDivElement>(null)
  const dealsRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  // Initialize consistent discounts on client side only
  useEffect(() => {
    setDiscounts(generateConsistentDiscounts())
  }, [])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        setCategoriesError(null)
        
        const response = await fetch('/api/admin/categories')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          // Filter only categories with products and are active
          const activeCategories = result.data.categories.filter(
            (cat: Category) => cat.isActive && cat.productCount > 0
          )
          setCategories(activeCategories)
        } else {
          throw new Error(result.error || 'Failed to load categories')
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setCategoriesError(err instanceof Error ? err.message : 'Failed to load categories')
        // Fallback to mock categories if API fails
        setCategories(getFallbackCategories())
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch featured products from API
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setFeaturedLoading(true)
        setFeaturedError(null)
        
        // Fetch featured products with sort=featured and limit=6
        const response = await fetch('/api/shop/products?featured=true&limit=6')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch featured products: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          setFeaturedProducts(result.data.products)
        } else {
          throw new Error(result.error || 'Failed to load featured products')
        }
      } catch (err) {
        console.error('Error fetching featured products:', err)
        setFeaturedError(err instanceof Error ? err.message : 'Failed to load featured products')
        // Fallback to mock featured products if API fails
        const fallbackProducts = mockProducts
          .filter((p) => p.featured)
          .slice(0, 6)
          .map(p => ({
            ...p,
            // Ensure fallback products have required ApiProduct properties
            images: [p.image],
            categoryId: null,
            inStock: p.stock > 0,
            stockCount: p.stock,
            featured: p.featured || false,
            brand: undefined,
            size: undefined,
            color: undefined,
            material: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        setFeaturedProducts(fallbackProducts)
      } finally {
        setFeaturedLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Fetch Today's Deals (top selling products)
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setDealsLoading(true)
        setDealsError(null)
        
        // Fetch top selling products
        const response = await fetch('/api/shop/top-selling?limit=8')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch deals: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          setDeals(result.data.products)
        } else {
          throw new Error(result.error || 'Failed to load deals')
        }
      } catch (err) {
        console.error('Error fetching deals:', err)
        setDealsError(err instanceof Error ? err.message : 'Failed to load deals')
        // Fallback to mock deals if API fails
        setDeals(mockProducts.slice(0, 8))
      } finally {
        setDealsLoading(false)
      }
    }

    fetchDeals()
  }, [])



  // Fallback categories if API fails
  const getFallbackCategories = (): Category[] => {
    const fallbackCategories = [
      { name: "Crafts", icon: "🖼️", color: "bg-blue-100 text-blue-700" },
      { name: "Fashion", icon: "👕", color: "bg-pink-100 text-pink-700" },
      { name: "Food", icon: "🍎", color: "bg-green-100 text-green-700" },
      { name: "Home Decor", icon: "🏠", color: "bg-amber-100 text-amber-700" },
      { name: "Jewelry", icon: "💎", color: "bg-purple-100 text-purple-700" },
      { name: "Accessories", icon: "🎒", color: "bg-cyan-100 text-cyan-700" },
      { name: "Electronics", icon: "📱", color: "bg-indigo-100 text-indigo-700" },
      { name: "Beauty", icon: "💄", color: "bg-rose-100 text-rose-700" },
      { name: "Books", icon: "📚", color: "bg-orange-100 text-orange-700" },
      { name: "Sports", icon: "⚽", color: "bg-emerald-100 text-emerald-700" },
    ]
    
    return fallbackCategories.map((cat, index) => ({
      id: `fallback-${index}`,
      name: cat.name,
      description: null,
      image: null,
      isActive: true,
      productCount: 10,
      icon: cat.icon,
      color: cat.color
    }))
  }

  // Helper function to get product image
  const getProductImage = (product: DisplayProduct): string => {
    if ('images' in product) {
      // API Product
      return product.images[0] || "/placeholder.svg"
    } else {
      // Mock Product
      return product.image
    }
  }

  // Helper function to get product rating
  const getProductRating = (product: DisplayProduct): number => {
    return product.rating || 0
  }

  // Helper function to get product reviews count
  const getProductReviews = (product: DisplayProduct): number => {
    return product.reviewCount || 0
  }

  // Helper function to check if product is in stock
  const isProductInStock = (product: DisplayProduct): boolean => {
    if ('inStock' in product) {
      return product.inStock
    } else {
      return product.stock > 0
    }
  }
  
   const getOrderCount = (product: DisplayProduct): number => {
    if ('orderCount' in product && product.orderCount !== undefined) {
      return product.orderCount
    }
    return 0
  }

  // Helper function to get deal metric
  const getDealMetric = (product: DisplayProduct): string => {
    if ('dealMetric' in product && product.dealMetric) {
      return product.dealMetric
    }
    return "Hot deal"
  }

  // Helper function to get popularity badge
  const getPopularityBadge = (product: DisplayProduct): string => {
    if ('popularityBadge' in product && product.popularityBadge) {
      return product.popularityBadge
    }
    const orderCount = getOrderCount(product)
    if (orderCount >= 50) return "🔥 Bestseller"
    if (orderCount >= 20) return "⭐ Popular"
    if (orderCount >= 10) return "🆕 Trending"
    if (orderCount > 0) return "📈 New Seller"
    return "🆕 New"
  }


  // Scroll functions
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200
      categoriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollDeals = (direction: 'left' | 'right') => {
    if (dealsRef.current) {
      const scrollAmount = 300
      dealsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredRef.current) {
      const scrollAmount = 300
      featuredRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Auto-rotate hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [heroProducts.length])

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % heroProducts.length)
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + heroProducts.length) % heroProducts.length)

  // Predefined colors for categories (used when category doesn't have image)
  const categoryColors = [
    "bg-blue-100 text-blue-700",
    "bg-pink-100 text-pink-700", 
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700",
    "bg-orange-100 text-orange-700",
    "bg-emerald-100 text-emerald-700",
  ]

  // Predefined icons for categories (used when category doesn't have image)
  const categoryIcons = [
    "🖼️", "👕", "🍎", "🏠", "💎", "🎒", "📱", "💄", "📚", "⚽"
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">

        {/* HERO – Smaller Compact Banner */}
        <section className="relative bg-muted/10">
          <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden rounded-b-md border-b">
            {heroProducts.map((p, i) => (
              <div
                key={p.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}

            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1.5 rounded-full hover:bg-black/40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1.5 rounded-full hover:bg-black/40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="container mx-auto px-4 py-3">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">
              Shop Authentic Malawian Crafts & Products
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Fast, reliable, marketplace-style shopping.
            </p>
          </div>
        </section>

        {/* Categories - Horizontally Scrollable */}
        <section className="py-6 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Shop by Category</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => scrollCategories('left')}
                  disabled={categoriesLoading || categories.length === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => scrollCategories('right')}
                  disabled={categoriesLoading || categories.length === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              {categoriesLoading ? (
                <div className="flex gap-3 overflow-x-hidden pb-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Card key={index} className="w-32 border-none shadow-sm animate-pulse">
                      <CardContent className="p-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2" />
                        <div className="h-4 bg-muted rounded w-20 mx-auto" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : categoriesError ? (
                <div className="text-center py-6">
                  <p className="text-destructive text-sm">{categoriesError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No categories available</p>
                </div>
              ) : (
                <>
                  <div 
                    ref={categoriesRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {categories.map((cat, index) => (
                      <Link 
                        key={cat.id} 
                        href={`/shop?category=${cat.id}`} 
                        className="block flex-shrink-0"
                      >
                        <Card className="w-32 hover:shadow-md transition-all border-none shadow-sm">
                          <CardContent className="p-3 text-center flex flex-col items-center">
                            {cat.image ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden mb-2">
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div 
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 ${
                                  categoryColors[index % categoryColors.length]
                                }`}
                              >
                                {categoryIcons[index % categoryIcons.length]}
                              </div>
                            )}
                            <p className="text-sm font-medium line-clamp-1">{cat.name}</p>
                            {cat.productCount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Gradient overlay for scroll indication */}
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                </>
              )}
            </div>
          </div>
        </section>

       {/* Today's Deals - Horizontally Scrollable */}
        <section className="py-6 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Today's Deals</h2>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/shop" className="text-sm text-primary hover:underline">
                  View all
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollDeals('left')}
                    disabled={dealsLoading || deals.length === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollDeals('right')}
                    disabled={dealsLoading || deals.length === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              {dealsLoading ? (
                <div className="flex gap-4 overflow-x-hidden pb-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="w-64 flex-shrink-0">
                      <Card className="h-full hover:shadow-md transition animate-pulse">
                        <div className="h-40 bg-muted rounded-t-lg" />
                        <CardContent className="p-4">
                          <div className="h-5 bg-muted rounded mb-2" />
                          <div className="h-6 bg-muted rounded mb-2" />
                          <div className="h-4 bg-muted rounded" />
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : dealsError ? (
                <div className="text-center py-6">
                  <p className="text-destructive text-sm">{dealsError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : deals.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No deals available today</p>
                </div>
              ) : (
                <>
                  <div 
                    ref={dealsRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {deals.map((p) => {
                      const orderCount = getOrderCount(p)
                      const dealMetric = getDealMetric(p)
                      const popularityBadge = getPopularityBadge(p)
                      
                      return (
                        <Link key={p.id} href={`/shop/${p.id}`} className="block flex-shrink-0">
                          <Card className="w-64 h-full hover:shadow-md transition border border-orange-200">
                            <div className="h-40 bg-muted overflow-hidden rounded-t-lg relative">
                              <img
                                src={getProductImage(p)}
                                alt={p.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                              {/* Popularity Badge */}
                              {popularityBadge && (
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-orange-600 text-white border-none">
                                    {popularityBadge}
                                  </Badge>
                                </div>
                              )}
                              {/* Deal Metric */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <div className="flex items-center gap-1 text-white text-xs">
                                  <TrendingUp className="h-3 w-3" />
                                  <span className="font-medium">{dealMetric}</span>
                                </div>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <p className="text-sm font-medium line-clamp-2 mb-2">{p.name}</p>
                              <p className="text-primary font-bold text-base mb-2">
                                MWK {p.price.toLocaleString()}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="font-medium">{getProductRating(p)}</span>
                                  <span className="text-muted-foreground">({getProductReviews(p)})</span>
                                </div>
                                {orderCount > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ShoppingBag className="h-3 w-3" />
                                    <span>{orderCount}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                  
                  {/* Gradient overlay for scroll indication */}
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/20 to-transparent pointer-events-none" />
                </>
              )}
            </div>
          </div>
        </section>


        {/* Featured Products - Horizontally Scrollable */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Featured Products</h2>
              <div className="flex items-center gap-4">
                <Link href="/shop" className="text-sm text-primary hover:underline">
                  View all
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollFeatured('left')}
                    disabled={featuredLoading || featuredProducts.length === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollFeatured('right')}
                    disabled={featuredLoading || featuredProducts.length === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              {featuredLoading ? (
                <div className="flex gap-4 overflow-x-hidden pb-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="w-72 h-full border shadow-sm animate-pulse">
                      <div className="h-48 bg-muted rounded-t-lg" />
                      <CardContent className="p-5">
                        <div className="h-6 bg-muted rounded mb-2" />
                        <div className="h-4 bg-muted rounded mb-3" />
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="h-7 bg-muted rounded w-24 mb-2" />
                            <div className="h-4 bg-muted rounded w-32" />
                          </div>
                          <div className="h-9 bg-muted rounded w-28" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : featuredError ? (
                <div className="text-center py-8">
                  <p className="text-destructive text-sm mb-2">{featuredError}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No featured products available</p>
                </div>
              ) : (
                <>
                  <div 
                    ref={featuredRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {featuredProducts.map((p) => (
                      <Link key={p.id} href={`/shop/${p.id}`} className="block flex-shrink-0">
                        <Card className="w-72 h-full hover:shadow-lg transition border shadow-sm">
                          <div className="h-48 bg-muted overflow-hidden relative rounded-t-lg">
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-white text-black hover:bg-white">
                                Featured
                              </Badge>
                            </div>
                          </div>

                          <CardContent className="p-5">
                            <p className="text-base font-semibold mb-2 line-clamp-2">{p.name}</p>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {p.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-primary font-bold text-lg">
                                  MWK {p.price.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-medium">{getProductRating(p)}</span>
                                  <span className="text-muted-foreground">({getProductReviews(p)})</span>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="gap-2"
                                disabled={!isProductInStock(p)}
                              >
                                <ShoppingBag className="h-4 w-4" />
                                {isProductInStock(p) ? "Add to Cart" : "Out of Stock"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Gradient overlay for scroll indication */}
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                </>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        {/* CTA - Multiple Action Buttons */}
<section className="py-10 bg-gradient-to-r from-primary to-primary/90 text-white text-center">
  <div className="container mx-auto px-4">
    <h3 className="text-2xl font-bold mb-2">Join WaHeA Today</h3>
    <p className="text-sm mb-6 max-w-md mx-auto">
      Choose how you want to experience the Warm Heart of Malawi marketplace
    </p>

    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
      {/* Customer Registration */}
      <Button 
        asChild 
        size="lg" 
        className="bg-white text-primary hover:bg-white/90 flex-1 min-w-[180px]"
      >
        <Link href="/register/customer" className="gap-2">
          <ShoppingBag className="w-4 h-4" />
          Start Shopping
        </Link>
      </Button>
      
      {/* Vendor Registration */}
      <Button 
        asChild 
        size="lg" 
        variant="outline"
        className="bg-transparent border-white text-white hover:bg-white/10 flex-1 min-w-[180px]"
      >
        <Link href="/register/vendor" className="gap-2">
          <Package className="w-4 h-4" />
          Start Selling
        </Link>
      </Button>
    </div>
  
  </div>
</section>

      </main>
    </div>
  )
}