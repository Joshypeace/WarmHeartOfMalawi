// src/app/customer/wishlist/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingBag, Trash2, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    description: string
    price: number
    images: string[]
    stockCount: number
    inStock: boolean
    category: string
    vendor: {
      firstName: string
      lastName: string
    }
    shop: {
      name: string
    }
  }
  createdAt: string
}

function WishlistContent() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removingItem, setRemovingItem] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch wishlist items
  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/wishlist')
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setWishlistItems(result.data.wishlistItems)
      } else {
        throw new Error(result.error || 'Failed to fetch wishlist')
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to load your wishlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const removeFromWishlist = async (wishlistItemId: string) => {
    setRemovingItem(wishlistItemId)
    
    try {
      const response = await fetch(`/api/customer/wishlist/${wishlistItemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove item from wishlist')
      }

      const result = await response.json()
      
      if (result.success) {
        setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId))
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist",
        })
      } else {
        throw new Error(result.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      })
    } finally {
      setRemovingItem(null)
    }
  }

  const addToCart = async (productId: string, productName: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add item to cart')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Added to cart",
          description: `${productName} has been added to your cart`,
        })
      } else {
        throw new Error(result.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (stockCount: number) => {
    if (stockCount > 10) return { variant: "default" as const, text: "In Stock" }
    if (stockCount > 0) return { variant: "secondary" as const, text: "Low Stock" }
    return { variant: "destructive" as const, text: "Out of Stock" }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your wishlist...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">My Wishlist</h1>
          </div>
          <p className="text-muted-foreground">
            Your saved items ({wishlistItems.length})
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start exploring our products and add items you love to your wishlist!
              </p>
              <Button asChild size="lg">
                <Link href="/shop">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Start Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wishlistItems.map((item) => {
                    const stockStatus = getStockStatus(item.product.stockCount)
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded bg-muted flex-shrink-0">
                              {item.product.images.length > 0 ? (
                                <Image
                                  src={item.product.images[0] || "/placeholder.svg"}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10 rounded">
                                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/shop/${item.product.id}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.product.description}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {item.product.category}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          MWK {item.product.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{item.product.shop?.name}</p>
                            <p className="text-muted-foreground">
                              {item.product.vendor.firstName} {item.product.vendor.lastName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/shop/${item.product.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => addToCart(item.product.id, item.product.name)}
                              disabled={!item.product.inStock}
                            >
                              <ShoppingBag className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFromWishlist(item.id)}
                              disabled={removingItem === item.id}
                            >
                              {removingItem === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function WishlistPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <WishlistContent />
    </ProtectedRoute>
  )
}