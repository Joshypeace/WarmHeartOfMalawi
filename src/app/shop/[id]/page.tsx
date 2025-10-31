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
import { mockProducts } from "@/lib/mock-data"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  const product = mockProducts.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => router.push("/shop")} size="lg">
            Back to Shop
          </Button>
        </div>
      </div>
    )
  }

  const relatedProducts = mockProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendorId: product.vendorId,
      })
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
          {/* Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2 text-xs md:text-sm">
                {product.category}
              </Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 text-balance">{product.name}</h1>
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 md:h-5 md:w-5 fill-primary text-primary" />
                  <span className="font-medium text-sm md:text-base">{product.rating}</span>
                  <span className="text-muted-foreground text-xs md:text-sm">({product.reviews} reviews)</span>
                </div>
              </div>
              <Link
                href={`/vendors/${product.vendorId}`}
                className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Store className="h-3 w-3 md:h-4 md:w-4" />
                {product.vendorName}
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
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Add to Cart
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
                <TabsTrigger value="shipping" className="text-xs md:text-sm">
                  Shipping
                </TabsTrigger>
                <TabsTrigger value="returns" className="text-xs md:text-sm">
                  Returns
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-3 md:mt-4">
                <p className="text-muted-foreground text-sm md:text-base text-pretty leading-relaxed">
                  {product.description}
                </p>
              </TabsContent>
              <TabsContent value="shipping" className="mt-3 md:mt-4">
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Free shipping on orders over MWK 10,000. Standard delivery takes 3-5 business days within Malawi.
                </p>
              </TabsContent>
              <TabsContent value="returns" className="mt-3 md:mt-4">
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  30-day return policy. Items must be unused and in original packaging. Contact the vendor for return
                  instructions.
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
                        src={relatedProduct.image || "/placeholder.svg"}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <CardContent className="p-3 md:p-4">
                    <Link href={`/shop/${relatedProduct.id}`}>
                      <h3 className="font-semibold text-xs md:text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-1 md:mb-2">
                      <Star className="h-3 w-3 md:h-4 md:w-4 fill-primary text-primary" />
                      <span className="text-xs md:text-sm font-medium">{relatedProduct.rating}</span>
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
