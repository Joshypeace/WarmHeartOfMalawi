import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: session.user.id // Ensure user can only access their own orders
      },
      include: {
        items: {
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
        }
      }
    })

    if (!order) {
      return NextResponse.json({ 
        success: false,
        error: 'Order not found' 
      }, { status: 404 })
    }

    // Parse shipping address from JSON string
    const orderWithParsedAddress = {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress)
    }

    return NextResponse.json({ 
      success: true,
      order: orderWithParsedAddress
    })

  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}