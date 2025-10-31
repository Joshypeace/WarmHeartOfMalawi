import Link from "next/link"
import { Package, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockProducts } from "@/lib/mock-data"

export default function CategoriesPage() {
  const categories = Array.from(new Set(mockProducts.map((p) => p.category)))

  const categoryData = categories.map((category) => {
    const products = mockProducts.filter((p) => p.category === category)
    return {
      name: category,
      count: products.length,
      image: products[0]?.image || "/placeholder.svg",
      description: `Explore our collection of ${category.toLowerCase()} products`,
    }
  })

  const categoryColors = [
    "from-primary to-accent",
    "from-secondary to-primary",
    "from-accent to-secondary",
    "from-primary/80 to-accent/80",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-16 animate-slide-up">
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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover authentic Malawian products organized by category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoryData.map((category, index) => (
            <Link
              key={category.name}
              href={`/shop?category=${category.name.toLowerCase()}`}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="group overflow-hidden border-2 hover:border-primary/50 hover-lift bg-card/50 backdrop-blur-sm h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
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
                      className="gap-2 bg-white/90 hover:bg-white text-foreground group-hover:scale-105 transition-all duration-200"
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

        <div className="mt-16 text-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
            <CardContent className="py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Browse all products or use our search to find exactly what you need
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-lg">
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
