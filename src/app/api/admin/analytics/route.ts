// app/api/admin/analytics/route.ts
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

    // Get current date and previous month for growth calculations
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const lastMonth = lastMonthDate.getMonth()
    const lastMonthYear = lastMonthDate.getFullYear()

    // Fetch all analytics data in parallel
    const [
      totalRevenueData,
      lastMonthRevenueData,
      totalOrdersData,
      lastMonthOrdersData,
      activeVendorsData,
      pendingVendorsData,
      totalProductsData,
      monthlyRevenueData,
      topVendorsData
    ] = await Promise.all([
      // Current month total revenue
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Last month total revenue for growth calculation
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(lastMonthYear, lastMonth, 1),
            lt: new Date(lastMonthYear, lastMonth + 1, 1)
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Current month total orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        }
      }),

      // Last month total orders for growth calculation
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(lastMonthYear, lastMonth, 1),
            lt: new Date(lastMonthYear, lastMonth + 1, 1)
          }
        }
      }),

      // Active vendors (approved vendors with at least one product)
      prisma.vendorShop.count({
        where: {
          isApproved: true,
          products: {
            some: {}
          }
        }
      }),

      // Pending vendors
      prisma.vendorShop.count({
        where: {
          isApproved: false,
          isRejected: false
        }
      }),

      // Total active products
      prisma.product.count(),

      // Monthly revenue data for the last 6 months
      getMonthlyRevenueData(),

      // Top performing vendors
      getTopVendorsData()
    ])

    // Calculate values
    const totalRevenue = totalRevenueData._sum.totalAmount || 0
    const lastMonthRevenue = lastMonthRevenueData._sum.totalAmount || 0
    const totalOrders = totalOrdersData
    const lastMonthOrders = lastMonthOrdersData
    const activeVendors = activeVendorsData
    const pendingVendors = pendingVendorsData
    const totalProducts = totalProductsData

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0

    const ordersGrowth = lastMonthOrders > 0 
      ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : totalOrders > 0 ? 100 : 0

    // Calculate platform fee (10% commission)
    const platformFee = totalRevenue * 0.1

    const analyticsData = {
      totalRevenue,
      platformFee,
      totalOrders,
      activeVendors,
      pendingVendors,
      totalProducts,
      growthMetrics: {
        revenueGrowth,
        ordersGrowth
      },
      monthlyData: monthlyRevenueData,
      topVendors: topVendorsData
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error("Admin analytics fetch error:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Helper function to get monthly revenue data
async function getMonthlyRevenueData() {
  const months = []
  const currentDate = new Date()
  
  // Get data for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    const year = date.getFullYear()
    
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)

    const [revenueData, ordersData, vendorsData] = await Promise.all([
      // Revenue for the month
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Orders count for the month
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      }),

      // Active vendors for the month (vendors with sales)
      prisma.vendorShop.count({
        where: {
          isApproved: true,
          products: {
            some: {
              orderItems: {
                some: {
                  order: {
                    createdAt: {
                      gte: startDate,
                      lt: endDate
                    }
                  }
                }
              }
            }
          }
        }
      })
    ])

    months.push({
      month: monthName,
      revenue: revenueData._sum.totalAmount || 0,
      orders: ordersData,
      vendors: vendorsData
    })
  }

  return months
}

// Helper function to get top performing vendors
async function getTopVendorsData(limit = 5) {
  const topVendors = await prisma.vendorShop.findMany({
    where: {
      isApproved: true
    },
    include: {
      vendor: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      products: {
        select: {
          id: true
        }
      },
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      products: {
        _count: 'desc'
      }
    },
    take: limit
  })

  // Calculate total sales for each vendor
  const vendorsWithSales = await Promise.all(
    topVendors.map(async (vendor) => {
      const salesData = await prisma.orderItem.aggregate({
        where: {
          product: {
            vendorId: vendor.vendorId
          }
        },
        _sum: {
          price: true
        }
      })

      return {
        id: vendor.id,
        name: vendor.name,
        email: vendor.vendor.email,
        totalProducts: vendor.products.length,
        totalSales: salesData._sum.price || 0
      }
    })
  )

  // Sort by total sales
  return vendorsWithSales.sort((a, b) => b.totalSales - a.totalSales)
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