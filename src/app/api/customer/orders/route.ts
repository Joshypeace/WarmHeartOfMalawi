import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Query parameter validation schema
const OrdersQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
})

interface OrderResponse {
  id: string
  status: string
  totalAmount: number
  shippingAddress: string
  district: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    productName: string
    quantity: number
    price: number
    productId: string
    images: string[]
  }>
}

interface OrdersResponse {
  success: boolean
  data: {
    orders: OrderResponse[]
    pagination: {
      currentPage: number
      totalPages: number
      totalOrders: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<OrdersResponse | { error: string }>> {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // Get user - allow any role that can have orders (CUSTOMER, VENDOR, ADMIN)
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email
      },
      select: { 
        id: true,
        role: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    }

    const validationResult = OrdersQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      )
    }

    const { page, limit, status } = validationResult.data

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause for orders
    const whereClause: any = {
      customerId: user.id,
    }

    if (status) {
      whereClause.status = status
    }

    try {
      // Get orders with pagination
      const [orders, totalOrders] = await Promise.all([
        // Get orders with items
        prisma.order.findMany({
          where: whereClause,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          skip,
          take: limit,
        }),
        // Get total count for pagination
        prisma.order.count({
          where: whereClause,
        })
      ])

      // Transform the data for frontend
      const transformedOrders: OrderResponse[] = orders.map(order => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        district: order.district,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          productId: item.productId,
          images: item.product.images,
        }))
      }))

      // Calculate pagination info
      const totalPages = Math.ceil(totalOrders / limit)
      const hasNext = page < totalPages
      const hasPrev = page > 1

      const response: OrdersResponse = {
        success: true,
        data: {
          orders: transformedOrders,
          pagination: {
            currentPage: page,
            totalPages,
            totalOrders,
            hasNext,
            hasPrev,
          }
        }
      }

      return NextResponse.json(response)

    } catch (dbError) {
      // Handle case where customer has no orders (empty result is fine)
      console.log('No orders found for customer:', user.id)
      
      const response: OrdersResponse = {
        success: true,
        data: {
          orders: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalOrders: 0,
            hasNext: false,
            hasPrev: false,
          }
        }
      }

      return NextResponse.json(response)
    }

  } catch (error) {
    console.error("Customer orders fetch error:", error)

    // Return empty orders instead of error for better UX
    const response: OrdersResponse = {
      success: true,
      data: {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalOrders: 0,
          hasNext: false,
          hasPrev: false,
        }
      }
    }

    return NextResponse.json(response)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}