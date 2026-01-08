import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Add the GET method for fetching product details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    // In your GET method, update the product query:
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            vendorShop: {
              select: {
                id: true,
                name: true,
                description: true,
                district: true,
                logo: true
              }
            }
          }
        },
        shop: {
          select: {
            id: true,
            name: true,
            description: true,
            district: true,
            logo: true
          }
        },
        categoryRef: {
          select: {
            id: true,
            name: true
          }
        },
        // Add reviews to the include
        reviews: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Limit to recent reviews
        }
      }
    })

    // Check if product exists
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get related products (products from same category, excluding current product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: id },
        inStock: true
      },
      take: 4,
      include: {
        vendor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        shop: {
          select: {
            name: true,
            district: true
          }
        },
        categoryRef: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    // ✅ FIXED: Use stockCount not stock
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images,
      category: product.categoryRef?.name || product.category, // Use categoryRef name if available
      categoryId: product.categoryId,
      inStock: product.inStock,
      stockCount: product.stockCount, // ✅ CHANGED FROM stock TO stockCount
      featured: product.featured,
      rating: product.rating,
      reviews: product.reviews,
      brand: product.brand,
      size: product.size,
      color: product.color,
      material: product.material,
      vendorId: product.vendorId,
      vendorName: product.vendor.vendorShop?.name || `${product.vendor.firstName} ${product.vendor.lastName}`,
      vendorShop: product.shop ? {
        id: product.shop.id,
        name: product.shop.name,
        description: product.shop.description || '',
        district: product.shop.district,
        logo: product.shop.logo || ''
      } : undefined,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }

    // ✅ FIXED: Use stockCount not stock
    const transformedRelatedProducts = relatedProducts.map(rp => ({
      id: rp.id,
      name: rp.name,
      description: rp.description,
      price: rp.price,
      images: rp.images,
      category: rp.categoryRef?.name || rp.category,
      categoryId: rp.categoryId,
      inStock: rp.inStock,
      stockCount: rp.stockCount, // ✅ CHANGED FROM stock TO stockCount
      featured: rp.featured,
      rating: rp.rating,
      reviews: rp.reviews,
      brand: rp.brand,
      size: rp.size,
      color: rp.color,
      material: rp.material,
      vendorId: rp.vendorId,
      vendorName: rp.shop?.name || `${rp.vendor.firstName} ${rp.vendor.lastName}`
    }))

    return NextResponse.json({
      success: true,
      data: {
        product: transformedProduct,
        relatedProducts: transformedRelatedProducts
      }
    })

  } catch (error: any) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Your existing PUT method (keep as is)
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

// Your existing DELETE method (keep as is)
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