// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Get cart items from database
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            inStock: true,
            stockCount: true,
            vendorId: true,
            shop: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Transform cart items
    const items = cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images[0] || '/placeholder.svg',
      vendorId: item.product.vendorId,
      vendorName: item.product.shop?.name || 'Vendor',
      quantity: item.quantity,
      inStock: item.product.inStock,
      maxStock: item.product.stockCount
    }))

    return NextResponse.json({
      success: true,
      data: { items }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load cart"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      )
    }

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        inStock: true,
        shop: {
          isApproved: true
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not available" },
        { status: 404 }
      )
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId: productId
      }
    })

    let cartItem
    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: Math.min(existingItem.quantity + quantity, product.stockCount)
        },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              images: true,
              vendorId: true,
              shop: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: productId,
          quantity: Math.min(quantity, product.stockCount)
        },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              images: true,
              vendorId: true,
              shop: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    }

    const transformedItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: cartItem.product.name,
      price: cartItem.product.price,
      image: cartItem.product.images[0] || '/placeholder.svg',
      vendorId: cartItem.product.vendorId,
      vendorName: cartItem.product.shop?.name || 'Vendor',
      quantity: cartItem.quantity
    }

    return NextResponse.json({
      success: true,
      data: { item: transformedItem },
      message: "Item added to cart"
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to add item to cart"
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Clear user's cart
    await prisma.cartItem.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      message: "Cart cleared successfully"
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to clear cart"
      },
      { status: 500 }
    )
  }
}