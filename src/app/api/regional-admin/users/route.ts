// app/api/regional-admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Query parameter validation schema
const UsersQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  role: z.enum(["all", "CUSTOMER", "VENDOR"]).optional().default("all"),
  search: z.string().optional().default(""),
})

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

    // Verify regional admin role and get district
    const regionalAdmin = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
      },
      select: {
        id: true,
        role: true,
        district: true
      }
    })

    if (!regionalAdmin || regionalAdmin.role !== "REGIONAL_ADMIN") {
      return NextResponse.json(
        { error: "Regional admin access required" },
        { status: 403 }
      )
    }

    if (!regionalAdmin.district) {
      return NextResponse.json(
        { error: "No district assigned to regional admin" },
        { status: 400 }
      )
    }

    const district = regionalAdmin.district

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
        { error: "Invalid query parameters", details: validationResult.error.errors },
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

    // Build where clause for database query
    const whereClause: any = {
      district: district,
      role: {
        in: ['CUSTOMER', 'VENDOR'] // Regional admin can only manage customers and vendors
      }
    }

    // Add role filter
    if (role !== "all") {
      whereClause.role = role
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: whereClause
    })

    // Get users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        district: true,
        createdAt: true,
        // Include order count for customers
        userOrders: {
          select: {
            id: true
          }
        },
        // Include vendor shop info if vendor
        vendorShop: {
          select: {
            id: true,
            name: true,
            isApproved: true,
            isRejected: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Transform user data for frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role.toLowerCase() as 'customer' | 'vendor',
      district: user.district,
      joinedDate: user.createdAt.toISOString(),
      orders: user.userOrders.length,
      vendorShop: user.vendorShop ? {
        id: user.vendorShop.id,
        name: user.vendorShop.name,
        isApproved: user.vendorShop.isApproved,
        isRejected: user.vendorShop.isRejected
      } : null
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNext,
          hasPrev,
        }
      }
    })

  } catch (error) {
    console.error("Regional admin users fetch error:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error"
      },
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