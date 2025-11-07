"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2, Truck, Package, ArrowLeft, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface OrderItem {
  id: string
  product: {
    name: string
    images: string[]
    vendor: {
      firstName: string
      lastName: string
      vendorShop: {
        name: string
      } | null
    }
  }
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  shippingCost: number
  shippingMethod: string
  paymentMethod: string
  shippingAddress: any
  createdAt: string
  items: OrderItem[]
}

const SHIPPING_METHODS = {
  'speed-courier': { name: 'Speed Courier', delivery: '2-3 business days' },
  'cts-courier': { name: 'CTS Courier', delivery: '3-4 business days' },
  'swift-courier': { name: 'SWIFT Courier', delivery: '1-2 business days' },
  'pickup': { name: 'Store Pickup', delivery: 'Ready in 24 hours' }
}

const PAYMENT_METHODS = {
  'mobile': 'Mobile Money',
  'card': 'Credit/Debit Card',
  'cod': 'Cash on Delivery'
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setOrder(data.order)
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber)
      toast({
        title: "Copied!",
        description: "Order number copied to clipboard",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/customer/orders')}>
            View All Orders
          </Button>
        </div>
      </div>
    )
  }

  const shippingMethod = SHIPPING_METHODS[order.shippingMethod as keyof typeof SHIPPING_METHODS] || 
                        { name: order.shippingMethod, delivery: 'Unknown' }
  const paymentMethod = PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS] || order.paymentMethod

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 md:py-8 px-4 md:px-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/customer/orders')} className="mb-6" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        {/* Order Confirmation Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for your purchase. Your order has been received.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Order #: {order.orderNumber}
            </Badge>
            <Button variant="outline" size="sm" onClick={copyOrderNumber}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded bg-muted flex-shrink-0">
                      <Image
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × MWK {item.price.toLocaleString()}
                      </p>
                      <p className="text-sm font-medium">
                        MWK {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>MWK {(order.totalAmount - order.shippingCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{order.shippingCost === 0 ? 'FREE' : `MWK ${order.shippingCost.toLocaleString()}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>MWK {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-sm">{order.shippingAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.email}</p>
                </div>
                <div>
                  <p className="text-sm">{order.shippingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.district}
                    {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shipping Method</p>
                  <p className="text-sm text-muted-foreground">
                    {shippingMethod.name} • {shippingMethod.delivery}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Payment & Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-sm">Payment Method</p>
                  <p className="text-sm text-muted-foreground">{paymentMethod}</p>
                </div>
                
                {order.paymentMethod === 'mobile' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-1">Mobile Money Payment</p>
                    <p className="text-xs text-blue-700">
                      You will receive a mobile money prompt shortly to complete your payment.
                    </p>
                  </div>
                )}

                {order.paymentMethod === 'cod' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium mb-1">Cash on Delivery</p>
                    <p className="text-xs text-amber-700">
                      Please have MWK {order.totalAmount.toLocaleString()} ready when your order is delivered.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-1">What's Next?</p>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Order confirmation email sent to {order.shippingAddress.email}</li>
                    <li>• Vendor will prepare your order</li>
                    <li>• You'll receive tracking information once shipped</li>
                    <li>• Expected delivery: {shippingMethod.delivery}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/shop')}
              >
                Continue Shopping
              </Button>
              <Button 
                className="flex-1"
                onClick={() => router.push('/customer/orders')}
              >
                View All Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}