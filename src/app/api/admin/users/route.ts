import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Query parameter validation schema
const UsersQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  role: z.enum(["all", "CUSTOMER", "VENDOR", "ADMIN"]).optional().default("all"),
  search: z.string().optional().default(""),
})

interface UserResponse {
  id: string
  name: string
  email: string
  role: string
  joinedDate: string
  orders: number
  district?: string | null
  phone?: string | null
  vendorShop?: {
    id: string
    name: string
    isApproved: boolean
  } | null
}

interface UsersResponse {
  success: boolean
  data: {
    users: UserResponse[]
    stats: {
      totalUsers: number
      totalCustomers: number
      totalVendors: number
      totalAdmins: number
    }
    pagination: {
      currentPage: number
      totalPages: number
      totalUsers: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication and authorization check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        role: "ADMIN"
      }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      role: searchParams.get("role"),
      search: searchParams.get("search"),
    }

    const validationResult = UsersQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      )
    }

    const { page, limit, role, search } = validationResult.data

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause for users
    let whereClause: any = {}

    // Filter by role
    if (role !== "all") {
      whereClause.role = role
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      ]
    }

    // Get users with pagination and related data
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          vendorShop: {
            select: {
              id: true,
              name: true,
              isApproved: true
            }
          },
          orders: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: whereClause,
      })
    ])

    // Get user statistics
    const [totalCustomers, totalVendors, totalAdmins] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "VENDOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } })
    ])

    // Transform user data
    const transformedUsers: UserResponse[] = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      joinedDate: user.createdAt.toISOString(),
      orders: user.orders.length,
      district: user.district,
      phone: user.phone,
      vendorShop: user.vendorShop
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: UsersResponse = {
      success: true,
      data: {
        users: transformedUsers,
        stats: {
          totalUsers,
          totalCustomers,
          totalVendors,
          totalAdmins
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNext,
          hasPrev,
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Admin users fetch error:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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