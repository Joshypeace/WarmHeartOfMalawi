"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    total, 
    clearCart, 
    loading, 
    syncing, 
    error,
    itemCount,
    isEmpty 
  } = useCart()
  
  const { toast } = useToast()
  const [isClearing, setIsClearing] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const shippingCost = total > 10000 ? 0 : 1000
  const finalTotal = total + shippingCost

  const handleClearCart = async () => {
    setIsClearing(true)
    try {
      const result = await clearCart()
      if (result.success) {
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to clear cart",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to clear cart:', error)
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(id))
    try {
      const result = await updateQuantity(id, newQuantity)
      if (!result.success && result.error) {
        toast({
          title: "Cannot update quantity",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (id: string, itemName: string) => {
    setUpdatingItems(prev => new Set(prev).add(id))
    try {
      const result = await removeItem(id)
      if (result.success) {
        toast({
          title: "Item removed",
          description: `${itemName} has been removed from your cart.`,
        })
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto p-6 md:p-8">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <h1 className="text-xl md:text-2xl font-bold mb-2">Loading Cart...</h1>
          <p className="text-sm md:text-base text-muted-foreground">Please wait while we load your cart items</p>
        </div>
      </div>
    )
  }

  if (isEmpty && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto p-6 md:p-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">Add some products to get started!</p>
          <Button asChild size="lg" className="w-full sm:w-auto mx-auto">
            <Link href="/shop">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Error loading cart</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
              {syncing && <span className="ml-2 text-xs text-muted-foreground">(Updating...)</span>}
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearCart}
              disabled={isClearing || syncing}
              size="sm"
              className="w-full sm:w-auto bg-transparent"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isClearing ? 'Clearing...' : 'Clear Cart'}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {items.map((item) => {
              const isUpdating = updatingItems.has(item.id)
              const isOutOfStock = !item.inStock || item.stockCount === 0
              const maxAvailable = Math.min(item.quantity, item.stockCount)
              
              return (
                <Card key={item.id} className={isUpdating ? "opacity-50" : ""}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex gap-3 md:gap-4">
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image 
                          src={item.image || "/placeholder.svg"} 
                          alt={item.name} 
                          fill 
                          className="object-cover" 
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="secondary" className="bg-white text-black text-xs">
                              Out of Stock
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base line-clamp-1">{item.name}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground">MWK {item.price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Sold by: {item.vendorName}</p>
                            {isOutOfStock && (
                              <p className="text-xs text-destructive font-medium mt-1">
                                This item is out of stock
                              </p>
                            )}
                            {!isOutOfStock && item.stockCount < item.quantity && (
                              <p className="text-xs text-amber-600 font-medium mt-1">
                                Only {item.stockCount} available
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            disabled={isUpdating || syncing}
                            className="h-8 w-8 shrink-0"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8 bg-transparent"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating || syncing || isOutOfStock}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 md:w-12 text-center font-medium text-sm md:text-base">
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8 bg-transparent"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isUpdating || syncing || isOutOfStock || item.quantity >= item.stockCount}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-bold text-sm md:text-base">
                            MWK {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-20">
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium">MWK {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? "FREE" : `MWK ${shippingCost.toLocaleString()}`}
                  </span>
                </div>
                {total < 10000 && (
                  <p className="text-xs text-muted-foreground">
                    Add MWK {(10000 - total).toLocaleString()} more for free shipping!
                  </p>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold text-sm md:text-base">Total</span>
                  <span className="text-xl md:text-2xl font-bold">MWK {finalTotal.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 md:gap-3 px-4 md:px-6 pb-4 md:pb-6">
                <Button 
                  asChild 
                  className="w-full" 
                  size="lg"
                  disabled={syncing || items.some(item => !item.inStock)}
                >
                  <Link href="/checkout">
                    {syncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : items.some(item => !item.inStock) ? (
                      "Cannot Checkout - Out of Stock Items"
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent" disabled={syncing}>
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}