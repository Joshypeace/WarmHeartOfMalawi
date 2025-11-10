"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, Minus, Plus, ShoppingCart, Heart, Share2, ArrowLeft, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useProductDetail } from "@/hooks/use-product-detail"
import React from "react"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  // Properly unwrap the params Promise
  const resolvedParams = React.use(params)
  const { id } = resolvedParams

  const { product, relatedProducts, loading, error } = useProductDetail(id)

  // Helper functions to handle null ratings
  const getDisplayRating = (rating: number | null) => {
    return rating ? rating.toFixed(1) : "0.0"
  }

  const getDisplayReviews = (reviews: number | null) => {
    return reviews || 0
  }

  const renderRatingStars = (rating: number | null) => {
    const displayRating = rating || 0
    return (
      <div className="flex items-center gap-1">
        <Star className={`h-4 w-4 md:h-5 md:w-5 ${displayRating > 0 ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        <span className="font-medium text-sm md:text-base">{getDisplayRating(rating)}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 md:py-6 lg:py-8 px-4 md:px-6 max-w-7xl mx-auto">
          <Button variant="ghost" className="mb-4 md:mb-6" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 max-w-6xl mx-auto">
            {/* Image skeleton */}
            <div className="aspect-square rounded-lg bg-muted animate-pulse" />
            
            {/* Info skeleton */}
            <div className="flex flex-col">
              <div className="h-4 w-20 bg-muted rounded mb-4 animate-pulse" />
              <div className="h-8 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded mb-4 animate-pulse" />
              <Separator className="my-4" />
              <div className="h-8 bg-muted rounded mb-4 animate-pulse" />
              <div className="h-10 bg-muted rounded mb-6 animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4">
            {error || "Product not found"}
          </h1>
          <Button onClick={() => router.push("/shop")} size="lg">
            Back to Shop
          </Button>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(String(product.id))
    }
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 md:py-6 lg:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 md:mb-6" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 max-w-6xl mx-auto">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <Image 
                src={product.images[selectedImage] || "/placeholder.svg"} 
                alt={product.name} 
                fill 
                className="object-cover" 
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square w-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image 
                      src={image || "/placeholder.svg"} 
                      alt={`${product.name} ${index + 1}`} 
                      fill 
                      className="object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2 text-xs md:text-sm">
                {product.category}
              </Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 text-balance">{product.name}</h1>
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                {renderRatingStars(product.rating)}
                <span className="text-muted-foreground text-xs md:text-sm">
                  ({getDisplayReviews(product.reviews)} {getDisplayReviews(product.reviews) === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <Link
                href={`/vendors/${product.vendorId}`}
                className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Store className="h-3 w-3 md:h-4 md:w-4" />
                {product.vendorName}
                {product.vendorShop?.district && (
                  <span className="text-xs">• {product.vendorShop.district}</span>
                )}
              </Link>
            </div>

            <Separator className="my-3 md:my-4" />

            <div className="mb-4 md:mb-6">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
                MWK {product.price.toLocaleString()}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </p>
            </div>

            <div className="mb-4 md:mb-6">
              <label className="text-xs md:text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-9 w-9 md:h-10 md:w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 md:w-16 text-center font-medium text-sm md:text-base">{quantity}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="h-9 w-9 md:h-10 md:w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-11 md:h-12 text-sm md:text-base"
                disabled={!product.inStock || product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                {product.inStock && product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button variant="outline" size="icon" className="h-11 w-11 md:h-12 md:w-12 shrink-0 bg-transparent">
                <Heart className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-11 w-11 md:h-12 md:w-12 shrink-0 bg-transparent">
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <Tabs defaultValue="description" className="flex-1">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="description" className="text-xs md:text-sm">
                  Description
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs md:text-sm">
                  Vendor
                </TabsTrigger>
                <TabsTrigger value="shipping" className="text-xs md:text-sm">
                  Shipping
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-3 md:mt-4">
                <p className="text-muted-foreground text-sm md:text-base text-pretty leading-relaxed">
                  {product.description}
                </p>
              </TabsContent>
              <TabsContent value="vendor" className="mt-3 md:mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {product.vendorShop?.logo && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image 
                          src={product.vendorShop.logo} 
                          alt={product.vendorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{product.vendorName}</h4>
                      {product.vendorShop?.district && (
                        <p className="text-sm text-muted-foreground">{product.vendorShop.district}</p>
                      )}
                    </div>
                  </div>
                  {product.vendorShop?.description && (
                    <p className="text-sm text-muted-foreground">{product.vendorShop.description}</p>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/vendors/${product.vendorId}`}>
                      View Vendor Profile
                    </Link>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="mt-3 md:mt-4">
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Free shipping on orders over MWK 10,000. Standard delivery takes 3-5 business days within Malawi.
                  Express delivery available for an additional fee.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-center md:text-left">
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/shop/${relatedProduct.id}`}>
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Image
                        src={relatedProduct.images[0] || "/placeholder.svg"}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!relatedProduct.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-white text-black text-xs">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-3 md:p-4">
                    <Link href={`/shop/${relatedProduct.id}`}>
                      <h3 className="font-semibold text-xs md:text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-1 md:mb-2">
                      <Star className={`h-3 w-3 md:h-4 md:w-4 ${(relatedProduct.rating || 0) > 0 ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs md:text-sm font-medium">
                        {relatedProduct.rating ? relatedProduct.rating.toFixed(1) : "0.0"}
                      </span>
                    </div>
                    <p className="text-sm md:text-base lg:text-lg font-bold">
                      MWK {relatedProduct.price.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}