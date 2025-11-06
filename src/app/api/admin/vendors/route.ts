// app/api/admin/vendors/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Query parameter validation schema
const VendorsQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  status: z.enum(["all", "pending", "approved", "rejected"]).optional().default("all"),
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

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
      }
    })

    if (!adminUser || adminUser.role !== "ADMIN") {
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
      status: searchParams.get("status"),
      search: searchParams.get("search"),
    }

    const validationResult = VendorsQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, status, search } = validationResult.data

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
      vendor: {
        // Ensure we only get vendor users
        role: "VENDOR"
      }
    }

    // Add status filter
    if (status === "pending") {
      whereClause.isApproved = false
    } else if (status === "approved") {
      whereClause.isApproved = true
    } else if (status === "rejected") {
      whereClause.isRejected = true
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { vendor: { email: { contains: search, mode: 'insensitive' } } },
        { vendor: { firstName: { contains: search, mode: 'insensitive' } } },
        { vendor: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get total count for pagination
    const totalVendors = await prisma.vendorShop.count({
      where: whereClause
    })

    // Get vendor shops with pagination
    const vendorShops = await prisma.vendorShop.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          }
        },
        products: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        vendor: {
          createdAt: 'desc'
        }
      },
      skip,
      take: limit
    })

    // Transform vendor data
    const vendors = await Promise.all(
      vendorShops.map(async (shop) => {
        // Calculate total sales from order items
        let totalSales = 0
        try {
          const salesData = await prisma.orderItem.aggregate({
            where: {
              product: {
                vendorId: shop.vendorId
              }
            },
            _sum: {
              price: true
            }
          })
          totalSales = salesData._sum.price || 0
        } catch (error) {
          console.error("Error calculating sales:", error)
          totalSales = 0
        }

        // Determine status
        let status: "pending" | "approved" | "rejected"
        if (shop.isRejected) {
          status = "rejected"
        } else if (shop.isApproved) {
          status = "approved"
        } else {
          status = "pending"
        }

        return {
          id: shop.id,
          vendorId: shop.vendorId,
          name: shop.name,
          email: shop.vendor.email,
          description: shop.description || "No description provided",
          joinedDate: shop.vendor.createdAt.toISOString(),
          totalProducts: shop.products.length,
          totalSales: totalSales,
          status: status,
          district: shop.district || "Not specified",
          logo: shop.logo
        }
      })
    )

    // Calculate pagination info
    const totalPages = Math.ceil(totalVendors / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        pagination: {
          currentPage: page,
          totalPages,
          totalVendors,
          hasNext,
          hasPrev,
        }
      }
    })

  } catch (error) {
    console.error("Admin vendors fetch error:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch vendors",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}