"use client"

import Link from "next/link"
import { Package, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCategories } from "@/hooks/use-categories"

export default function CategoriesPage() {
  const { categories, loading, error } = useCategories()

  const categoryColors = [
    "from-primary to-accent",
    "from-secondary to-primary",
    "from-accent to-secondary",
    "from-primary/80 to-accent/80",
    "from-secondary/80 to-primary/80",
    "from-accent/80 to-secondary/80",
  ]

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-2 animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <Link
                  key={category.name}
                  href={`/shop?category=${encodeURIComponent(category.name)}`}
                  className="group"
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
                          <Package className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <Badge
                          className={`mb-3 bg-gradient-to-r ${categoryColors[index % categoryColors.length]} border-none shadow-lg`}
                        >
                          {category.count} Products
                        </Badge>
                        <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                        <p className="text-sm text-white/80 mb-4">{category.description}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-2 bg-white/90 hover:bg-white text-foreground transition-all duration-200"
                        >
                          Browse {category.name}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {categories.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No Categories Found</h3>
                <p className="text-muted-foreground mb-6">
                  No product categories are currently available.
                </p>
              </div>
            )}
          </>
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