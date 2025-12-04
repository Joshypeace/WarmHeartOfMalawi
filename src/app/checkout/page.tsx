"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, User, ArrowLeft, CheckCircle2, Star, Info, MessageSquare, ThumbsUp, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  createdAt: string
  likes: number
  isVerifiedPurchase: boolean
  helpfulCount: number
}

interface CheckoutFormData {
  fullName: string
  email: string
  phone: string
  paymentMethod: string
  specialInstructions?: string
}

export default function CheckoutPage() {
  const { items, total, clearCart, itemCount } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    reviewType: "product" // "product" or "website"
  })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    phone: "",
    paymentMethod: "mobile",
    specialInstructions: ""
  })

  const finalTotal = total

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email || "",
      }))
    }
    setIsLoading(false)
  }, [user])

  // Fetch existing reviews
  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return "Full name is required"
    if (!formData.email.trim()) return "Email is required"
    if (!formData.phone.trim()) return "Phone number is required"
    if (!formData.paymentMethod) return "Payment method is required"

    // Validate phone number format (Malawi numbers)
    const phoneRegex = /^(\+265|265|0)(88|99|98|31)\d{7}$/
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return "Please enter a valid Malawi phone number (e.g., 0881234567)"
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address"
    }

    // Validate Cash on Delivery limit
    if (formData.paymentMethod === 'cod' && total > 50000) {
      return "Cash on Delivery is only available for orders under MWK 50,000"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast({
        title: "Please check your information",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    // Check if any items are out of stock
    const outOfStockItems = items.filter(item => !item.inStock)
    if (outOfStockItems.length > 0) {
      toast({
        title: "Cannot place order",
        description: "Some items in your cart are out of stock. Please update your cart.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        customerInfo: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
        },
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        subtotal: total,
        total: finalTotal,
        itemCount
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Order placed successfully!",
          description: `Your order #${result.order.orderNumber} has been confirmed.`,
        })

        // Redirect to order confirmation page
        router.push(`/customer/orders/${result.order.id}`)
      } else {
        throw new Error(result.error || 'Failed to place order')
      }
    } catch (error: any) {
      console.error('Order placement error:', error)
      toast({
        title: "Order failed",
        description: error.message || "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      toast({
        title: "Review required",
        description: "Please write a review comment",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReview(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newReview,
          productId: items[0]?.productId, // For product reviews
        }),
      })

      if (response.ok) {
        toast({
          title: "Review submitted!",
          description: "Thank you for your feedback.",
        })
        setNewReview({
          rating: 5,
          comment: "",
          reviewType: "product"
        })
        fetchReviews() // Refresh reviews
      } else {
        throw new Error('Failed to submit review')
      }
    } catch (error) {
      toast({
        title: "Review failed",
        description: "There was an error submitting your review.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleLikeReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? { ...review, helpfulCount: review.helpfulCount + 1 }
            : review
        ))
      }
    } catch (error) {
      console.error('Error liking review:', error)
    }
  }

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0

  // Redirect if cart is empty
  if (items.length === 0 && !isLoading) {
    router.push("/cart")
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/cart')} className="mb-4 md:mb-6" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center md:text-left">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="h-10 md:h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="e.g., 0881234567"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="h-10 md:h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-10 md:h-11"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <RadioGroup 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleSelectChange('paymentMethod', value)} 
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 md:p-4 border rounded-lg">
                      <RadioGroupItem value="mobile" id="mobile" />
                      <Label htmlFor="mobile" className="flex-1 cursor-pointer text-sm md:text-base">
                        Mobile Money (Airtel Money / TNM Mpamba)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 md:p-4 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer text-sm md:text-base">
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 md:p-4 border rounded-lg">
                      <RadioGroupItem 
                        value="cod" 
                        id="cod" 
                        disabled={total > 50000}
                      />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer text-sm md:text-base">
                        Cash on Delivery
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 ml-2 inline text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Available for orders under MWK 50,000</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {total > 50000 && (
                          <span className="ml-2 text-xs text-amber-600">
                            (Not available for orders over MWK 50,000)
                          </span>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Payment method specific instructions */}
                  {formData.paymentMethod === 'mobile' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 You will receive a mobile money prompt after placing your order.
                      </p>
                    </div>
                  )}
                  {formData.paymentMethod === 'cod' && total >= 50000 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        ⚠️ Cash on Delivery is only available for orders under MWK 50,000.
                        Please select a different payment method.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                    Share Your Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 space-y-6">
                  {/* Leave a Review Form */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Leave a Review</h3>
                      <div className="flex items-center">
                        <Select 
                          value={newReview.reviewType} 
                          onValueChange={(value: "product" | "website") => 
                            setNewReview({...newReview, reviewType: value})
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({...newReview, rating: star})}
                              className="p-1"
                            >
                              <Star
                                className={`h-5 w-5 ${
                                  star <= newReview.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <Textarea
                        placeholder={`Share your thoughts about this ${
                          newReview.reviewType === 'product' ? 'product' : 'website experience'
                        }...`}
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                        className="min-h-[100px]"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          {newReview.comment.length}/500 characters
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSubmitReview}
                          disabled={isSubmittingReview || !newReview.comment.trim()}
                        >
                          {isSubmittingReview ? "Submitting..." : "Submit Review"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Reviews Tabs */}
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="all">All Reviews ({reviews.length})</TabsTrigger>
                      <TabsTrigger value="product">Product Reviews</TabsTrigger>
                      <TabsTrigger value="website">Website Reviews</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="space-y-4 mt-4">
                      {/* Overall Rating Summary */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                          <div className="flex items-center justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(averageRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on {reviews.length} reviews
                          </p>
                        </div>
                        <div className="space-y-1">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviews.filter(r => r.rating === rating).length
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                            return (
                              <div key={rating} className="flex items-center gap-2 text-sm">
                                <span className="w-8">{rating} stars</span>
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-400 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Reviews List */}
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {reviews.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
                          </div>
                        ) : (
                          reviews.map((review) => (
                            <div key={review.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={review.userAvatar} />
                                    <AvatarFallback>
                                      {review.userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{review.userName}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-3 w-3 ${
                                              star <= review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      {review.isVerifiedPurchase && (
                                        <Badge variant="secondary" className="text-xs">
                                          Verified Purchase
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm mb-3">{review.comment}</p>
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLikeReview(review.id)}
                                  className="h-8 px-2"
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Helpful ({review.helpfulCount})
                                </Button>
                                <Badge variant="outline" className="text-xs">
                                  {review.id.startsWith('prod') ? 'Product' : 'Website'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="product" className="mt-4">
                      <div className="space-y-4">
                        {reviews
                          .filter(review => review.id.startsWith('prod'))
                          .map((review) => (
                            <div key={review.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={review.userAvatar} />
                                    <AvatarFallback>
                                      {review.userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{review.userName}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-3 w-3 ${
                                              star <= review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      {review.isVerifiedPurchase && (
                                        <Badge variant="secondary" className="text-xs">
                                          Verified Purchase
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm">{review.comment}</p>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="website" className="mt-4">
                      <div className="space-y-4">
                        {reviews
                          .filter(review => review.id.startsWith('web'))
                          .map((review) => (
                            <div key={review.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={review.userAvatar} />
                                    <AvatarFallback>
                                      {review.userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{review.userName}</p>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-3 w-3 ${
                                            star <= review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-sm">{review.comment}</p>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-lg md:text-xl">Special Instructions (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    placeholder="Any special notes for the vendor..."
                    className="w-full h-20 p-3 border rounded-lg resize-none text-sm"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.specialInstructions?.length}/500 characters
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-20">
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded bg-muted flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                          {!item.inStock && (
                            <div className="absolute inset-0 bg-red-500/20 rounded flex items-center justify-center">
                              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium">
                            MWK {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                      <span>MWK {total.toLocaleString()}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>MWK {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={
                      isProcessing || 
                      items.some(item => !item.inStock) ||
                      (formData.paymentMethod === 'cod' && total > 50000)
                    }
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : items.some(item => !item.inStock) ? (
                      "Cannot Checkout - Out of Stock Items"
                    ) : formData.paymentMethod === 'cod' && total > 50000 ? (
                      "COD Not Available"
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Place Order - MWK {finalTotal.toLocaleString()}
                      </>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      🔒 Your payment information is secure and encrypted
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}