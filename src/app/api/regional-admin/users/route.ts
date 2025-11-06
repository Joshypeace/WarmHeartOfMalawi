// app/api/regional-admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const UsersQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  role: z.enum(["all", "CUSTOMER", "VENDOR"]).optional().default("all"),
  search: z.string().optional().default(""),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

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
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    if (!regionalAdmin.district) {
      return NextResponse.json(
        { success: false, error: "No district assigned" },
        { status: 400 }
      )
    }

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
        { 
          success: false, 
          error: "Invalid query parameters"
        },
        { status: 400 }
      )
    }

    const { page, limit, role, search } = validationResult.data

    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, error: "Invalid pagination" },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const whereClause: any = {
      district: regionalAdmin.district,
      role: {
        in: ['CUSTOMER', 'VENDOR']
      }
    }

    if (role !== "all") {
      whereClause.role = role
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [totalUsers, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          district: true,
          phone: true,
          createdAt: true,
          customerOrders: { 
            select: { id: true } 
          },
          vendorShop: {
            select: {
              id: true,
              name: true,
              isApproved: true,
              isRejected: true,
              products: {
                select: { id: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ])

    const transformedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone || "Not provided",
      role: user.role.toLowerCase() as 'customer' | 'vendor',
      district: user.district || "Not assigned",
      joinedDate: user.createdAt.toISOString(),
      orders: user.customerOrders.length,
      vendorShop: user.vendorShop ? {
        id: user.vendorShop.id,
        name: user.vendorShop.name,
        isApproved: user.vendorShop.isApproved,
        isRejected: user.vendorShop.isRejected,
        totalProducts: user.vendorShop.products.length
      } : null
    }))

    const totalPages = Math.ceil(totalUsers / limit)

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    )
  }
}