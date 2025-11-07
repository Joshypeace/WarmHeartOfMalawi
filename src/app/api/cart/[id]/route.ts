import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Fix for Next.js 14.2+
) {
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

    const { id: cartItemId } = await context.params
    const body = await request.json()
    const { quantity } = body

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid quantity" },
        { status: 400 }
      )
    }

    // If quantity is 0 → delete item
    if (quantity === 0) {
      const deleted = await prisma.cartItem.deleteMany({
        where: { id: cartItemId, userId: user.id } // ✅ deleteMany instead of delete
      })

      if (deleted.count === 0) {
        return NextResponse.json(
          { success: false, error: "Cart item not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Item removed from cart"
      })
    }

    // Check stock
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId: user.id },
      include: {
        product: {
          select: { stockCount: true }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      )
    }

    const validQuantity = Math.min(quantity, cartItem.product.stockCount)

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId }, // ✅ only id is unique
      data: { quantity: validQuantity },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            images: true,
            vendorId: true,
            shop: { select: { name: true } }
          }
        }
      }
    })

    const transformedItem = {
      id: updatedItem.id,
      productId: updatedItem.productId,
      name: updatedItem.product.name,
      price: updatedItem.product.price,
      image: updatedItem.product.images?.[0] || "/placeholder.svg",
      vendorId: updatedItem.product.vendorId,
      vendorName: updatedItem.product.shop?.name || "Vendor",
      quantity: updatedItem.quantity
    }

    return NextResponse.json({
      success: true,
      data: { item: transformedItem },
      message: "Cart updated successfully"
    })
  } catch (error) {
    console.error("Cart update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Fix for Next.js 14.2+
) {
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

    const { id: cartItemId } = await context.params

    const deleted = await prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId: user.id } // ✅ deleteMany fixes “invalid where” error
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from cart"
    })
  } catch (error) {
    console.error("Cart delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove item from cart" },
      { status: 500 }
    )
  }
}
