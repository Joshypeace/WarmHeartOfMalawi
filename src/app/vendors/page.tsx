"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Store, MapPin, Star, Package, Search, ArrowRight, Sparkles, TrendingUp, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVendors } from "@/hooks/use-vendors"

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [districts, setDistricts] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const { vendors, loading, error } = useVendors(
    searchQuery, 
    selectedDistrict === "all" ? "" : selectedDistrict,
    selectedCategory === "all" ? "" : selectedCategory
  )

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [districtsRes, categoriesRes] = await Promise.all([
          fetch('/api/vendors/districts'),
          fetch('/api/vendors/categories')
        ])

        const districtsData = await districtsRes.json()
        const categoriesData = await categoriesRes.json()

        if (districtsData.success) setDistricts(districtsData.data || [])
        if (categoriesData.success) setCategories(categoriesData.data || [])
      } catch {
        // Silent fail for filters
      }
    }

    fetchFilters()
  }, [])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedDistrict("all")
    setSelectedCategory("all")
  }

  const hasActiveFilters = searchQuery || selectedDistrict !== "all" || selectedCategory !== "all"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-primary/10 border border-primary/20">
            <Store className="h-3 w-3 mr-1" />
            Meet Our Vendors
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Talented Artisans & Vendors
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with local vendors and discover their unique handcrafted products
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg border-2"
              />
            </div>
            
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="h-14 text-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <SelectValue placeholder="All Districts" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-14 text-lg">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="text-center py-12">
            <h3 className="text-2xl font-bold mb-2">Error Loading Vendors</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-2 animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="group overflow-hidden border-2 hover:border-primary/50 transition-all">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {vendor.logo ? (
                      <img 
                        src={vendor.logo} 
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Store className="h-24 w-24 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary border-none">
                        Verified
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{vendor.description}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{vendor.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-accent" />
                        <span>{vendor.totalProducts} Products</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                        <span className="font-semibold">{vendor.rating}</span>
                        <span className="text-muted-foreground">({vendor.totalSales} sales)</span>
                      </div>
                      {vendor.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {vendor.categories.slice(0, 2).map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {vendor.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.categories.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <Button asChild className="w-full">
                      <Link href={`/shop?vendor=${vendor.id}`}>
                        View Products
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {vendors.length === 0 && (
              <div className="text-center py-12">
                <Store className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No Vendors Found</h3>
                <p className="text-muted-foreground mb-6">
                  {hasActiveFilters 
                    ? "Try adjusting your search criteria or filters."
                    : "No vendors are currently available."}
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-16">
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Become a Vendor</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                Join our community of talented vendors and reach customers across Malawi. Start selling your products today!
              </p>
              <Button asChild size="lg">
                <Link href="/register?role=vendor">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Selling Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}