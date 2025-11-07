import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quantity } = await request.json()

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a number and at least 1' },
        { status: 400 }
      )
    }

    // Get the cart item with product info to check stock
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                firstName: true,
                lastName: true,
                vendorShop: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existingCartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Check stock availability
    if (existingCartItem.product.stockCount < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${existingCartItem.product.stockCount} items available in stock`,
        },
        { status: 400 }
      )
    }

    // Update the cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                firstName: true,
                lastName: true,
                vendorShop: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    const responseItem = {
      id: updatedCartItem.id,
      productId: updatedCartItem.productId,
      name: updatedCartItem.product.name,
      price: updatedCartItem.product.price,
      image: updatedCartItem.product.images[0] || '/placeholder.svg',
      quantity: updatedCartItem.quantity,
      vendorName:
        updatedCartItem.product.vendor.vendorShop?.name ||
        `${updatedCartItem.product.vendor.firstName} ${updatedCartItem.product.vendor.lastName}`,
      inStock: updatedCartItem.product.inStock,
      stockCount: updatedCartItem.product.stockCount,
    }

    return NextResponse.json({ success: true, item: responseItem })
  } catch (error: any) {
    console.error('Cart update error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the cart item belongs to the user before deleting
    await prisma.cartItem.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    })
  } catch (error: any) {
    console.error('Cart delete error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
