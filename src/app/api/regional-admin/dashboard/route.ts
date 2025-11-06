// app/api/regional-admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

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

    // Fetch all dashboard data in parallel
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      pendingVendors,
      recentVendors,
      districtStats
    ] = await Promise.all([
      // Total users in district
      prisma.user.count({
        where: {
          district: district,
          role: {
            in: ['CUSTOMER', 'VENDOR']
          }
        }
      }),

      // Total customers in district
      prisma.user.count({
        where: {
          district: district,
          role: 'CUSTOMER'
        }
      }),

      // Total vendors in district
      prisma.vendorShop.count({
        where: {
          district: district
        }
      }),

      // Pending vendors in district
      prisma.vendorShop.count({
        where: {
          district: district,
          isApproved: false,
          isRejected: false
        }
      }),

      // Recent vendors for overview
      prisma.vendorShop.findMany({
        where: {
          district: district
        },
        include: {
          vendor: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Additional district statistics
      getDistrictStatistics(district)
    ])

    // Transform recent vendors data
    const transformedVendors = recentVendors.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      email: vendor.vendor.email,
      status: vendor.isRejected ? 'rejected' : vendor.isApproved ? 'approved' : 'pending',
      createdAt: vendor.createdAt
    }))

    const dashboardData = {
      district: district,
      stats: {
        totalUsers,
        totalCustomers,
        totalVendors,
        pendingVendors,
        approvedVendors: totalVendors - pendingVendors
      },
      recentVendors: transformedVendors,
      districtStats
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error("Regional admin dashboard fetch error:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Helper function to get district statistics
async function getDistrictStatistics(district: string) {
  const [
    totalOrders,
    totalRevenue,
    activeVendors,
    recentActivity
  ] = await Promise.all([
    // Total orders from district
    prisma.order.count({
      where: {
        user: {
          district: district
        }
      }
    }),

    // Total revenue from district
    prisma.order.aggregate({
      where: {
        user: {
          district: district
        },
        status: 'DELIVERED'
      },
      _sum: {
        totalAmount: true
      }
    }),

    // Active vendors (with sales)
    prisma.vendorShop.count({
      where: {
        district: district,
        isApproved: true,
        products: {
          some: {
            orderItems: {
              some: {}
            }
          }
        }
      }
    }),

    // Recent user registrations (last 7 days)
    prisma.user.count({
      where: {
        district: district,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  return {
    totalOrders,
    totalRevenue: totalRevenue?._sum?.totalAmount || 0,
    activeVendors,
    recentActivity
  }
}