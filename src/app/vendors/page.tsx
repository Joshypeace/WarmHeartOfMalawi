"use client"

import { useState } from "react"
import Link from "next/link"
import { Store, MapPin, Star, Package, Search, ArrowRight, Sparkles, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockVendors, mockProducts } from "@/lib/mock-data"

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredVendors = mockVendors.filter((vendor) => vendor.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getVendorProducts = (vendorId: string) => {
    return mockProducts.filter((p) => p.vendorId === vendorId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12 animate-slide-up">
          <Badge
            variant="secondary"
            className="mb-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
          >
            <Store className="h-3 w-3 mr-1" />
            Meet Our Vendors
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Talented Artisans & Vendors
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Connect with local vendors and discover their unique handcrafted products
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/50 backdrop-blur-sm border-2 focus:border-primary/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVendors.map((vendor, index) => {
            const products = getVendorProducts(vendor.id)
            return (
              <Card
                key={vendor.id}
                className="group overflow-hidden border-2 hover:border-primary/50 hover-lift bg-card/50 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="h-24 w-24 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-primary to-accent border-none shadow-lg">
                      {vendor.status === "approved" ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{vendor.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{vendor.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{vendor.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground">{products.length} Products</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      <span className="font-semibold">{vendor.rating}</span>
                      <span className="text-muted-foreground">({vendor.totalSales} sales)</span>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                  >
                    <Link href={`/shop?vendor=${vendor.id}`}>
                      View Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No vendors found matching your search.</p>
          </div>
        )}

        <div className="mt-16 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <Card className="border-2 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Become a Vendor</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                Join our community of talented vendors and reach customers across Malawi. Start selling your products
                today!
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-xl">
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
