"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ShoppingBag, Star, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProducts } from "@/lib/mock-data"

// Pre-generate consistent discount percentages to avoid hydration errors
const generateConsistentDiscounts = () => {
  // Use a seed or fixed values to ensure consistency
  const fixedDiscounts = [15, 20, 25, 30, 35, 40, 45, 50]
  return fixedDiscounts
}

export default function HomePage() {
  const heroProducts = mockProducts.slice(0, 5)
  const [currentSlide, setCurrentSlide] = useState(0)
  const featuredProducts = mockProducts.filter((p) => p.featured).slice(0, 6)
  const topDeals = mockProducts.slice(0, 8)
  
  // Use consistent discounts to avoid hydration errors
  const [discounts, setDiscounts] = useState<number[]>([])
  
  // Refs for horizontal scrolling
  const categoriesRef = useRef<HTMLDivElement>(null)
  const dealsRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  // Initialize consistent discounts on client side only
  useEffect(() => {
    setDiscounts(generateConsistentDiscounts())
  }, [])

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [heroProducts.length])

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % heroProducts.length)
  const prevSlide = () =>
    setCurrentSlide((p) => (p - 1 + heroProducts.length) % heroProducts.length)

  const categories = [
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
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => scrollCategories('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div 
                ref={categoriesRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((cat) => (
                  <Link key={cat.name} href={`/shop?category=${cat.name.toLowerCase().replace(' ', '-')}`} className="block flex-shrink-0">
                    <Card className="w-32 hover:shadow-md transition-all border-none shadow-sm">
                      <CardContent className="p-3 text-center flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full ${cat.color} flex items-center justify-center text-xl mb-2`}>
                          {cat.icon}
                        </div>
                        <p className="text-sm font-medium line-clamp-1">{cat.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              
              {/* Gradient overlay for scroll indication */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Deals - Horizontally Scrollable */}
        <section className="py-6 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Today's Deals</h2>
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
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollDeals('right')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div 
                ref={dealsRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {topDeals.map((p, index) => {
                  // Use index to get consistent discount or use a fixed percentage
                  const discount = discounts[index] || 20 // Fallback to 20% if discounts not loaded yet
                  
                  return (
                    <Link key={p.id} href={`/shop/${p.id}`} className="block flex-shrink-0">
                      <Card className="w-64 h-full hover:shadow-md transition">
                        <div className="h-40 bg-muted overflow-hidden rounded-t-lg">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium line-clamp-2 mb-2">{p.name}</p>
                          <p className="text-primary font-bold text-base mb-2">
                            MWK {p.price.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{p.rating}</span>
                              <span className="text-muted-foreground">({p.reviews})</span>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              -{discount}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              
              {/* Gradient overlay for scroll indication */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/20 to-transparent pointer-events-none" />
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
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollFeatured('right')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
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
                          src={p.image}
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
                            <p className="text-primary font-bold text-lg">MWK {p.price.toLocaleString()}</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{p.rating}</span>
                              <span className="text-muted-foreground">({p.reviews})</span>
                            </div>
                          </div>
                          <Button size="sm" className="gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              
              {/* Gradient overlay for scroll indication */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 bg-primary text-white text-center">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-bold mb-3">Become a Vendor</h3>
            <p className="text-sm mb-5 max-w-md mx-auto">
              Sell to thousands of customers across Malawi. Join WaHeA marketplace today!
            </p>

            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link href="/register" className="gap-2">
                <Package className="w-4 h-4" />
                Start Selling
              </Link>
            </Button>
          </div>
        </section>

      </main>
    </div>
  )
}