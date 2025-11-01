"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, MapPin, User, ArrowLeft, CheckCircle2 } from "lucide-react"
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

const MALAWI_DISTRICTS = [
  "Balaka",
  "Blantyre",
  "Chikwawa",
  "Chiradzulu",
  "Chitipa",
  "Dedza",
  "Dowa",
  "Karonga",
  "Kasungu",
  "Likoma",
  "Lilongwe",
  "Machinga",
  "Mangochi",
  "Mchinji",
  "Mulanje",
  "Mwanza",
  "Mzimba",
  "Neno",
  "Nkhata Bay",
  "Nkhotakota",
  "Nsanje",
  "Ntcheu",
  "Ntchisi",
  "Phalombe",
  "Rumphi",
  "Salima",
  "Thyolo",
  "Zomba",
]

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")

  const shippingCost = total > 10000 ? 0 : 1000
  const finalTotal = total + shippingCost

  const [formData, setFormData] = useState({
    fullName: user?.firstName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    district: "", // Added district field
    postalCode: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDistrictChange = (value: string) => {
    setFormData({ ...formData, district: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Mock order processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    clearCart()
    toast({
      title: "Order placed successfully!",
      description: "You will receive a confirmation email shortly.",
    })

    router.push("/customer/orders")
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 md:mb-6" size="sm">
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
                        Full Name
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
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="h-10 md:h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email
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
                      Street Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="h-10 md:h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-sm">
                      District
                    </Label>
                    <Select value={formData.district} onValueChange={handleDistrictChange} required>
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
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm">
                        City/Town
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="h-10 md:h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm">
                        Postal Code
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

              {/* Payment Method */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2 md:space-y-3">
                    <div className="flex items-center space-x-2 p-3 md:p-4 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer text-sm md:text-base">
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 md:p-4 border rounded-lg">
                      <RadioGroupItem value="mobile" id="mobile" />
                      <Label htmlFor="mobile" className="flex-1 cursor-pointer text-sm md:text-base">
                        Mobile Money (Airtel/TNM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 md:p-4 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer text-sm md:text-base">
                        Cash on Delivery
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-20">
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
                  <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-2 md:gap-3">
                        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded bg-muted flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-xs md:text-sm font-medium">
                            MWK {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>MWK {total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shippingCost === 0 ? "FREE" : `MWK ${shippingCost.toLocaleString()}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold text-sm md:text-base">Total</span>
                      <span className="text-xl md:text-2xl font-bold">MWK {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Place Order
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
