import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quantity } = await request.json()

    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: user.id },
      include: { product: true },
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    })

    return NextResponse.json({
      item: {
        id: updatedCartItem.id,
        productId: updatedCartItem.productId,
        name: updatedCartItem.product.name,
        price: updatedCartItem.product.price,
        image: updatedCartItem.product.images[0] || '/placeholder.svg',
        quantity: updatedCartItem.quantity,
      },
    })
  } catch (error: any) {
    console.error('Cart update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: user.id },
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    await prisma.cartItem.delete({ where: { id } })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error: any) {
    console.error('Cart delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
