import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        product: {
          include: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedItems = cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images[0] || '/placeholder.svg',
      quantity: item.quantity,
      vendorName: item.product.vendor.vendorShop?.name || `${item.product.vendor.firstName} ${item.product.vendor.lastName}`,
      inStock: item.product.inStock,
      stockCount: item.product.stockCount
    }))

    return NextResponse.json({ 
      success: true,
      items: formattedItems 
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json({ 
        success: false,
        error: 'Product ID is required' 
      }, { status: 400 })
    }

    if (quantity < 1) {
      return NextResponse.json({ 
        success: false,
        error: 'Quantity must be at least 1' 
      }, { status: 400 })
    }

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
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
    })

    if (!product) {
      return NextResponse.json({ 
        success: false,
        error: 'Product not found' 
      }, { status: 404 })
    }

    if (!product.inStock) {
      return NextResponse.json({ 
        success: false,
        error: 'Product is out of stock' 
      }, { status: 400 })
    }

    if (product.stockCount < quantity) {
      return NextResponse.json({ 
        success: false,
        error: `Only ${product.stockCount} items available in stock` 
      }, { status: 400 })
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    })

    let cartItem

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity
      
      // Check stock availability for updated quantity
      if (product.stockCount < newQuantity) {
        return NextResponse.json({ 
          success: false,
          error: `Cannot add more items. Only ${product.stockCount} available in stock. You already have ${existingCartItem.quantity} in cart.` 
        }, { status: 400 })
      }

      // Update existing item
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingCartItem.id
        },
        data: {
          quantity: newQuantity
        },
        include: {
          product: {
            include: {
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
      })
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId: productId,
          quantity: quantity
        },
        include: {
          product: {
            include: {
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
      })
    }

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: cartItem.product.name,
      price: cartItem.product.price,
      image: cartItem.product.images[0] || '/placeholder.svg',
      quantity: cartItem.quantity,
      vendorName: cartItem.product.vendor.vendorShop?.name || `${cartItem.product.vendor.firstName} ${cartItem.product.vendor.lastName}`,
      inStock: cartItem.product.inStock,
      stockCount: cartItem.product.stockCount
    }

    return NextResponse.json({ 
      success: true,
      item: responseItem 
    })
  } catch (error: any) {
    console.error('Cart add error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: false,
        error: 'Item already in cart' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}