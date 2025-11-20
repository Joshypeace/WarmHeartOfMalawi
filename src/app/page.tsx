"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ShoppingBag, Star, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProducts } from "@/lib/mock-data"

export default function HomePage() {
  const heroProducts = mockProducts.slice(0, 5)
  const [currentSlide, setCurrentSlide] = useState(0)
  const featuredProducts = mockProducts.filter((p) => p.featured).slice(0, 6)
  const topDeals = mockProducts.slice(0, 8)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [heroProducts.length])

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % heroProducts.length)
  const prevSlide = () =>
    setCurrentSlide((p) => (p - 1 + heroProducts.length) % heroProducts.length)

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

        {/* Categories */}
        <section className="py-6 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-semibold mb-3">Shop by Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {["Crafts", "Fashion", "Food", "Home Decor", "Jewelry", "Accessories"].map((cat) => (
                <Link key={cat} href="/shop" className="block">
                  <Card className="hover:shadow-sm transition-all">
                    <CardContent className="p-3 text-center">
                      <p className="text-sm font-medium">{cat}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Deals */}
        <section className="py-6 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Today's Deals</h2>
              <Link href="/shop" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {topDeals.map((p) => (
                <Link key={p.id} href="#" className="block">
                  <Card className="h-full hover:shadow-md transition">
                    <div className="h-36 bg-muted overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                      <p className="text-primary font-bold mt-1 text-base">
                        MWK {p.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{p.rating}</span>
                        <span className="text-muted-foreground">({p.reviews})</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">Featured Products</h2>
              <Link href="/shop" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {featuredProducts.map((p) => (
                <Link key={p.id} href="#" className="block">
                  <Card className="hover:shadow-sm transition border">
                    <div className="h-40 bg-muted overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <CardContent className="p-4">
                      <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {p.category}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-primary font-bold">MWK {p.price.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{p.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 bg-primary text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Become a Vendor</h3>
          <p className="text-sm mb-5 max-w-md mx-auto">
            Sell to thousands of customers across Malawi.
          </p>

          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link href="/register" className="gap-2">
              <Package className="w-4 h-4" />
              Start Selling
            </Link>
          </Button>
        </section>

      </main>
    </div>
  )
}
