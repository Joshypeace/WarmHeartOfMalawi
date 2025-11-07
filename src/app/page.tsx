"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ShoppingBag, Users, TrendingUp, Heart, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProducts } from "@/lib/mock-data"

export default function HomePage() {
  const featuredProducts = mockProducts.filter((p) => p.featured).slice(0, 3)
  const [currentSlide, setCurrentSlide] = useState(0)
  const heroProducts = mockProducts.slice(0, 4)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroProducts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroProducts.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroProducts.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroProducts.length) % heroProducts.length)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative overflow-hidden bg-muted/30">
          {/* Slideshow Background */}
          <div className="absolute inset-0">
            {heroProducts.map((product, index) => (
              <div
                key={product.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
              </div>
            ))}
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 md:p-2 rounded-full transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 md:p-2 rounded-full transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 md:gap-2">
            {heroProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-white w-6 md:w-8" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="container relative py-12 sm:py-16 md:py-20 lg:py-28 xl:py-36 px-4 md:px-6 z-10 max-w-7xl mx-auto">
            <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6 lg:space-y-8 animate-slide-up">
              <Badge
                variant="secondary"
                className="w-fit mx-auto px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-xs md:text-sm"
              >
                <Heart className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 fill-current" />
                <span className="font-medium">The Warm Heart of Malawi</span>
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-tight px-4">
                Discover Authentic Malawian Crafts
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto px-4">
                Connect with local artisans and vendors. Shop unique, handcrafted products that tell the story of
                Malawi's rich culture and heritage.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2 md:pt-4 px-4">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-xl hover:scale-105 transition-all duration-300 text-base md:text-lg px-6 md:px-8 h-12 md:h-14"
                >
                  <Link href="/shop">
                    <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
                    Start Shopping
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 border-2 border-white text-white hover:bg-white hover:text-foreground hover:scale-105 transition-all duration-300 text-base md:text-lg px-6 md:px-8 h-12 md:h-14 bg-transparent"
                >
                  <Link href="/register">
                    <Package className="h-4 w-4 md:h-5 md:w-5" />
                    Become a Vendor
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-10 md:py-14 lg:py-20 bg-background">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: ShoppingBag,
                  value: "500+",
                  label: "Products",
                  color: "text-primary",
                  bgColor: "bg-primary/10",
                },
                {
                  icon: Users,
                  value: "50+",
                  label: "Vendors",
                  color: "text-secondary",
                  bgColor: "bg-secondary/10",
                },
                {
                  icon: TrendingUp,
                  value: "1000+",
                  label: "Happy Customers",
                  color: "text-accent",
                  bgColor: "bg-accent/10",
                },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="border shadow-sm hover-lift bg-card animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8">
                    <div className="flex items-center gap-4 md:gap-6 justify-center sm:justify-start">
                      <div
                        className={`flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-xl ${stat.bgColor} shrink-0`}
                      >
                        <stat.icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color}`} />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className={`text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 md:py-16 lg:py-24 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 lg:mb-16 gap-4 animate-slide-up">
              <div className="text-center md:text-left mx-auto md:mx-0">
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 md:mb-3 text-foreground">
                  Featured Products
                </h2>
                <p className="text-base md:text-lg text-muted-foreground">Handpicked items from our talented vendors</p>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105 transition-all duration-300 bg-transparent w-full sm:w-auto mx-auto md:mx-0"
              >
                <Link href="/shop" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {featuredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="group overflow-hidden border hover:border-primary/50 hover-lift bg-card h-full">
                    <div className="aspect-square overflow-hidden bg-muted relative">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge className="absolute top-3 md:top-4 right-3 md:right-4 bg-primary text-primary-foreground border-none shadow-lg text-xs md:text-sm">
                        Featured
                      </Badge>
                    </div>
                    <CardContent className="p-4 md:p-6">
                      <Badge
                        variant="secondary"
                        className="mb-2 md:mb-3 bg-secondary/10 text-secondary border-secondary/20 text-xs md:text-sm"
                      >
                        {product.category}
                      </Badge>
                      <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xl md:text-2xl font-bold text-primary">
                          MWK {product.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 text-xs md:text-sm bg-accent/10 px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                          <span className="font-semibold text-accent">{product.rating}</span>
                          <span className="text-muted-foreground">({product.reviews})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-20 lg:py-28 overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />

          <div className="container relative text-center animate-slide-up px-4 md:px-6 max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-primary-foreground px-4">
              Ready to Start Selling?
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed px-4">
              Join our community of vendors and reach customers across Malawi and beyond. It's easy to get started!
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="gap-2 bg-white text-primary hover:bg-white/90 hover:scale-105 hover:shadow-2xl transition-all duration-300 text-base md:text-lg px-8 md:px-10 h-14 md:h-16 mx-auto"
            >
              <Link href="/register">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
                Become a Vendor Today
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
