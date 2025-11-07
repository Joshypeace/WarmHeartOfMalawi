"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, MapPin, User, ArrowLeft, CheckCircle2, Truck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const MALAWI_DISTRICTS = [
  "Balaka", "Blantyre", "Chikwawa", "Chiradzulu", "Chitipa", "Dedza", "Dowa", 
  "Karonga", "Kasungu", "Likoma", "Lilongwe", "Machinga", "Mangochi", "Mchinji", 
  "Mulanje", "Mwanza", "Mzimba", "Neno", "Nkhata Bay", "Nkhotakota", "Nsanje", 
  "Ntcheu", "Ntchisi", "Phalombe", "Rumphi", "Salima", "Thyolo", "Zomba",
]

// Courier services with pricing and delivery times
const COURIER_SERVICES = [
  {
    id: "speed-courier",
    name: "Speed Courier",
    description: "Fast and reliable delivery across Malawi",
    baseCost: 1200,
    deliveryTime: "2-3 business days",
    coverage: "Nationwide",
    icon: "🚚"
  },
  {
    id: "cts-courier",
    name: "CTS Courier",
    description: "Secure and tracked delivery service",
    baseCost: 1100,
    deliveryTime: "3-4 business days",
    coverage: "Major cities and towns",
    icon: "📦"
  },
  {
    id: "swift-courier",
    name: "SWIFT Courier",
    description: "Express delivery for urgent packages",
    baseCost: 1500,
    deliveryTime: "1-2 business days",
    coverage: "Lilongwe & Blantyre express",
    icon: "⚡"
  },
  {
    id: "pickup",
    name: "Store Pickup",
    description: "Pick up your order from the vendor's location",
    baseCost: 0,
    deliveryTime: "Ready in 24 hours",
    coverage: "Vendor location",
    icon: "🏪"
  }
]

// Calculate shipping cost based on district and courier
const calculateShippingCost = (district: string, courierId: string, orderTotal: number) => {
  // Free shipping for orders over MWK 10,000 (except pickup)
  if (orderTotal > 10000 && courierId !== 'pickup') return 0

  const courier = COURIER_SERVICES.find(c => c.id === courierId)
  if (!courier) return 0

  let cost = courier.baseCost

  // Add surcharge for remote districts
  const remoteDistricts = ["Chitipa", "Karonga", "Likoma", "Nkhata Bay", "Rumphi"]
  if (remoteDistricts.includes(district) && courierId !== 'pickup') {
    cost += 500
  }

  return cost
}

interface CheckoutFormData {
  fullName: string
  email: string
  phone: string
  address: string
  district: string
  postalCode: string
  shippingMethod: string
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

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    postalCode: "",
    shippingMethod: "speed-courier",
    paymentMethod: "mobile",
    specialInstructions: ""
  })

  const [shippingCost, setShippingCost] = useState(0)

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email || "",
        district: user.district || ""
      }))
    }
    setIsLoading(false)
  }, [user])

  // Recalculate shipping cost when district, shipping method, or total changes
  useEffect(() => {
    const cost = calculateShippingCost(formData.district, formData.shippingMethod, total)
    setShippingCost(cost)
  }, [formData.district, formData.shippingMethod, total])

  const finalTotal = total + shippingCost
  const selectedCourier = COURIER_SERVICES.find(c => c.id === formData.shippingMethod)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: keyof CheckoutFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Recalculate shipping cost immediately when shipping method or district changes
      if (name === 'shippingMethod' || name === 'district') {
        const newShippingCost = calculateShippingCost(
          name === 'district' ? value : newData.district,
          name === 'shippingMethod' ? value : newData.shippingMethod,
          total
        )
        setShippingCost(newShippingCost)
      }
      
      return newData
    })
  }

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return "Full name is required"
    if (!formData.email.trim()) return "Email is required"
    if (!formData.phone.trim()) return "Phone number is required"
    if (!formData.address.trim()) return "Address is required"
    if (!formData.district) return "District is required"
    if (!formData.shippingMethod) return "Shipping method is required"
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
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          district: formData.district,
          postalCode: formData.postalCode,
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        specialInstructions: formData.specialInstructions,
        subtotal: total,
        shippingCost,
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

              {/* Shipping Address */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm">
                      Street Address *
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="House number, street name, area"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="h-10 md:h-11"
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-sm">
                        District *
                      </Label>
                      <Select 
                        value={formData.district} 
                        onValueChange={(value) => handleSelectChange('district', value)} 
                        required
                      >
                        <SelectTrigger className="h-10 md:h-11">
                          <SelectValue placeholder="Select your district" />
                        </SelectTrigger>
                        <SelectContent>
                          {MALAWI_DISTRICTS.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm">
                        Postal Code (Optional)
                      </Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="h-10 md:h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Truck className="h-4 w-4 md:h-5 md:w-5" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <RadioGroup 
                    value={formData.shippingMethod} 
                    onValueChange={(value) => handleSelectChange('shippingMethod', value)} 
                    className="space-y-3"
                  >
                    {COURIER_SERVICES.map((courier) => {
                      const cost = calculateShippingCost(formData.district, courier.id, total)
                      return (
                        <div key={courier.id} className="flex items-start space-x-3 p-3 md:p-4 border rounded-lg hover:border-primary transition-colors">
                          <RadioGroupItem value={courier.id} id={courier.id} />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={courier.id} className="flex items-center gap-2 cursor-pointer text-sm md:text-base font-medium">
                              <span className="text-lg">{courier.icon}</span>
                              {courier.name}
                              {total > 10000 && courier.id !== 'pickup' && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  FREE
                                </Badge>
                              )}
                            </Label>
                            <div className="mt-1 text-xs md:text-sm text-muted-foreground">
                              <p>{courier.description}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span>📅 {courier.deliveryTime}</span>
                                <span>📍 {courier.coverage}</span>
                                <span className={`font-medium ${
                                  cost === 0 ? 'text-green-600' : ''
                                }`}>
                                  {cost === 0 ? "FREE" : `MWK ${cost.toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </RadioGroup>
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
                    placeholder="Any special delivery instructions or notes for the vendor..."
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
                    
                    {/* Shipping Details */}
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Shipping</span>
                        {selectedCourier && (
                          <p className="text-xs text-muted-foreground">
                            {selectedCourier.name}
                          </p>
                        )}
                      </div>
                      <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>
                        {shippingCost === 0 ? "FREE" : `MWK ${shippingCost.toLocaleString()}`}
                      </span>
                    </div>

                    {total < 10000 && shippingCost > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Add MWK {(10000 - total).toLocaleString()} more for free shipping!
                      </p>
                    )}

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