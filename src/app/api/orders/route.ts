import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const orderData = await request.json()

    // Validate required fields
    if (!orderData.items || !orderData.items.length) {
      return NextResponse.json({ 
        success: false,
        error: 'No items in order' 
      }, { status: 400 })
    }

    // Validate payment method for COD
    if (orderData.paymentMethod === 'cod' && orderData.total > 50000) {
      return NextResponse.json({ 
        success: false,
        error: 'Cash on Delivery is only available for orders under MWK 50,000' 
      }, { status: 400 })
    }

    // Check product availability and prices
    for (const item of orderData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { 
          id: true,
          inStock: true, 
          stockCount: true, 
          price: true, 
          name: true,
          vendorId: true 
        }
      })

      if (!product) {
        return NextResponse.json({ 
          success: false,
          error: `Product not found: ${item.name || item.productId}` 
        }, { status: 400 })
      }

      if (!product.inStock) {
        return NextResponse.json({ 
          success: false,
          error: `Product out of stock: ${product.name}` 
        }, { status: 400 })
      }

      if (product.stockCount < item.quantity) {
        return NextResponse.json({ 
          success: false,
          error: `Insufficient stock for: ${product.name}. Only ${product.stockCount} available.` 
        }, { status: 400 })
      }

      // Validate price hasn't changed
      if (product.price !== item.price) {
        return NextResponse.json({ 
          success: false,
          error: `Price has changed for: ${product.name}. Please refresh your cart.` 
        }, { status: 400 })
      }
    }

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `WH${String(orderCount + 1).padStart(6, '0')}`

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          customerId: session.user.id,
          status: 'PENDING',
          totalAmount: orderData.total,
          subtotal: orderData.subtotal,
          shippingCost: orderData.shippingCost,
          shippingAddress: JSON.stringify(orderData.shippingAddress),
          district: orderData.shippingAddress.district,
          shippingMethod: orderData.shippingMethod,
          paymentMethod: orderData.paymentMethod,
          specialInstructions: orderData.specialInstructions,
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Create order items and update product stock
      for (const item of orderData.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          },
        })

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockCount: {
              decrement: item.quantity
            },
            // Update inStock status if stock reaches 0
            ...(await tx.product.findUnique({
              where: { id: item.productId }
            }).then(p => ({
              inStock: (p?.stockCount || 0) - item.quantity > 0
            })))
          },
        })
      }

      // Clear user's cart
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id }
      })

      return newOrder
    })

    // TODO: Send order confirmation email
    // TODO: Initiate payment processing based on payment method
    // TODO: Send notification to vendors

    return NextResponse.json({ 
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.totalAmount,
        shippingCost: order.shippingCost,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.items
      }
    })

  } catch (error: any) {
    console.error('Order creation error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false,
        error: 'Order number conflict. Please try again.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error. Please try again.' 
    }, { status: 500 })
  }
}

// Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                vendor: {
                  select: {
                    firstName: true,
                    lastName: true,
                    vendorShop: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit
    })

    const totalOrders = await prisma.order.count({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json({ 
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    })

  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}