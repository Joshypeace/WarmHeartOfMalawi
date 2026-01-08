"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, Minus, Plus, ShoppingCart, Heart, MapPin, Share2, ArrowLeft, Store, Tag, Ruler, Palette, Package2, MessageSquare, ThumbsUp, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useProductDetail } from "@/hooks/use-product-detail"
import { Textarea } from "@/components/ui/textarea"
import React from "react"

interface ManagedCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
  productCount: number
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  customer: {
    firstName: string
    lastName: string
  }
}

// Wishlist Button Component
function ProductWishlistButton({ productId, productName }: { productId: string, productName: string }) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const response = await fetch('/api/customer/wishlist')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const inWishlist = result.data.wishlistItems.some(
              (item: any) => item.product.id === productId
            )
            setIsInWishlist(inWishlist)
          }
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error)
      }
    }

    checkWishlistStatus()
  }, [productId])

  const toggleWishlist = async () => {
    setLoading(true)
    
    try {
      if (isInWishlist) {
        // Remove from wishlist - we need to get the wishlist item ID first
        const wishlistResponse = await fetch('/api/customer/wishlist')
        if (wishlistResponse.ok) {
          const wishlistResult = await wishlistResponse.json()
          if (wishlistResult.success) {
            const wishlistItem = wishlistResult.data.wishlistItems.find(
              (item: any) => item.product.id === productId
            )
            
            if (wishlistItem) {
              await fetch(`/api/customer/wishlist/${wishlistItem.id}`, {
                method: 'DELETE'
              })
              setIsInWishlist(false)
              toast({
                title: "Removed from wishlist",
                description: `${productName} removed from your wishlist`,
              })
            }
          }
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/customer/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          setIsInWishlist(true)
          toast({
            title: "Added to wishlist",
            description: `${productName} added to your wishlist`,
          })
        } else {
          throw new Error(result.error || 'Failed to add to wishlist')
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleWishlist}
      disabled={loading}
      className={`h-11 w-11 md:h-12 md:w-12 shrink-0 ${
        isInWishlist 
          ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600" 
          : "bg-transparent"
      }`}
    >
      <Heart 
        className={`h-4 w-4 md:h-5 md:w-5 ${isInWishlist ? "fill-current" : ""}`} 
      />
    </Button>
  )
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  // Properly unwrap the params Promise
  const resolvedParams = React.use(params)
  const { id } = resolvedParams

  const { product, relatedProducts, loading, error } = useProductDetail(id)

  // Fetch managed categories
  useEffect(() => {
    const fetchManagedCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        const result = await response.json()
        
        if (result.success) {
          setManagedCategories(result.data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchManagedCategories()
  }, [])

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return
      
      try {
        setLoadingReviews(true)
        const response = await fetch(`/api/products/${id}/reviews`)
        const result = await response.json()
        
        if (result.success) {
          setReviews(result.data.reviews || [])
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoadingReviews(false)
      }
    }

    if (product) {
      fetchReviews()
    }
  }, [id, product])

  // Helper function to get category name
  const getCategoryName = (categoryId: string | null, categoryName: string) => {
    if (categoryId) {
      const category = managedCategories.find(cat => cat.id === categoryId)
      return category ? category.name : categoryName
    }
    return categoryName
  }

  // Helper functions to handle null ratings
  const getDisplayRating = (rating: number | null) => {
    return rating ? rating.toFixed(1) : "0.0"
  }

  const getDisplayReviews = (reviews: number | null) => {
    return reviews || 0
  }

  const renderRatingStars = (rating: number | null, size: 'sm' | 'md' | 'lg' = 'md') => {
    const displayRating = rating || 0
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4 md:h-5 md:w-5',
      lg: 'h-5 w-5 md:h-6 md:w-6'
    }
    
    return (
      <div className="flex items-center gap-1">
        <Star className={`${sizeClasses[size]} ${displayRating > 0 ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        <span className={`font-medium ${size === 'lg' ? 'text-lg' : 'text-sm md:text-base'}`}>
          {getDisplayRating(rating)}
        </span>
      </div>
    )
  }

  // Parse sizes and colors from comma-separated strings
  const parseDetails = (detailString: string | null) => {
    if (!detailString) return []
    return detailString.split(',').map(item => item.trim()).filter(item => item)
  }

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!userRating) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      })
      return
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review required",
        description: "Please write your review before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReview(true)

    try {
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: userRating,
          comment: reviewText.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review')
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      })

      // Reset form
      setUserRating(0)
      setReviewText("")

      // Refresh reviews
      const reviewsResponse = await fetch(`/api/products/${id}/reviews`)
      const reviewsResult = await reviewsResponse.json()
      
      if (reviewsResult.success) {
        setReviews(reviewsResult.data.reviews || [])
      }

    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast({
        title: "Failed to submit review",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
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

  // ✅ FIXED: Use stockCount > 0 as the availability check (consistent with shop page)
  const isProductAvailable = product.stockCount > 0
  const availableStock = product.stockCount

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(String(product.id))
    }
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    })
  }

  // Get the proper category name
  const displayCategory = getCategoryName(product.categoryId, product.category)
  
  // Parse product details
  const sizes = parseDetails(product.size)
  const colors = parseDetails(product.color)

  // Share product function
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
        toast({
          title: "Shared successfully",
          description: "Product link has been shared",
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "Today"
    if (diffDays <= 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date().getFullYear() !== date.getFullYear() ? 'numeric' : undefined
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
                priority
              />
              {product.featured && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
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

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2 text-xs md:text-sm">
                {displayCategory}
              </Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 text-balance">{product.name}</h1>
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                {renderRatingStars(product.rating, 'lg')}
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

            {/* Product Details Section */}
            <div className="mb-4 md:mb-6 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-3 text-sm md:text-base">Product Details</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Brand */}
                {product.brand && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      <span>Brand</span>
                    </div>
                    <p className="text-sm font-medium">{product.brand}</p>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Ruler className="h-3 w-3" />
                      <span>Sizes</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sizes.map((size, index) => (
                        <Badge key={index} variant="secondary" className="text-xs py-0.5 px-2">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {colors.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Palette className="h-3 w-3" />
                      <span>Colors</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {colors.map((color, index) => (
                        <Badge key={index} variant="secondary" className="text-xs py-0.5 px-2">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Material */}
                {product.material && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Package2 className="h-3 w-3" />
                      <span>Material</span>
                    </div>
                    <p className="text-sm font-medium">{product.material}</p>
                  </div>
                )}

                {/* Stock Count */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Stock Available</div>
                  <p className={`text-sm font-medium ${isProductAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProductAvailable ? `${availableStock} units` : 'Out of stock'}
                  </p>
                </div>

                {/* Listed Date */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Listed</div>
                  <p className="text-sm font-medium">{formatDate(product.createdAt)}</p>
                </div>
              </div>
            </div>

            <Separator className="my-3 md:my-4" />

            <div className="mb-4 md:mb-6">
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
                MWK {product.price.toLocaleString()}
              </p>
              <p className={`text-xs md:text-sm ${isProductAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {isProductAvailable ? `${availableStock} units available` : "Currently unavailable"}
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
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={!isProductAvailable || quantity >= availableStock}
                  className="h-9 w-9 md:h-10 md:w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 mb-6 md:mb-8">
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-11 md:h-12 text-sm md:text-base"
                disabled={!isProductAvailable}
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                {isProductAvailable ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              
              {/* Wishlist Button */}
              <ProductWishlistButton 
                productId={product.id} 
                productName={product.name}
              />
              
              {/* Share Button */}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-11 w-11 md:h-12 md:w-12 shrink-0 bg-transparent"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Product Description */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Product Description
              </h3>
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-sm md:text-base text-pretty leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Vendor Information
              </h3>
              <Card className="border bg-card">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {product.vendorShop?.logo && (
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border">
                        <Image 
                          src={product.vendorShop.logo} 
                          alt={product.vendorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-lg md:text-xl font-semibold">{product.vendorName}</h4>
                          {product.vendorShop?.district && (
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {product.vendorShop.district}
                            </p>
                          )}
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/vendors/${product.vendorId}`}>
                            View Shop
                          </Link>
                        </Button>
                      </div>
                      {product.vendorShop?.description && (
                        <p className="text-sm text-muted-foreground">{product.vendorShop.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Reviews & Rating Section */}
        <div className="max-w-6xl mx-auto mb-8 md:mb-12">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Leave a Review */}
            <div className="lg:w-1/2">
              <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-primary" />
                Leave a Review
              </h3>
              <Card className="border bg-card">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= userRating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-muted-foreground'
                              } hover:text-yellow-500 transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Review</label>
                      <Textarea
                        placeholder="Share your experience with this product..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    
                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || !userRating || !reviewText.trim()}
                      className="w-full"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Reviews */}
            <div className="lg:w-1/2">
              <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Customer Reviews ({reviews.length})
              </h3>
              
              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                        <div className="h-4 bg-muted rounded mb-1" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <Card className="border">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {review.customer.firstName} {review.customer.lastName}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(review.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-center md:text-left">
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => {
                const isRelatedAvailable = relatedProduct.stockCount > 0
                
                return (
                  <Card key={relatedProduct.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/shop/${relatedProduct.id}`}>
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image
                          src={relatedProduct.images[0] || "/placeholder.svg"}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!isRelatedAvailable && (
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
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}