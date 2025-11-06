import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

interface AnalyticsResponse {
  success: boolean
  data: {
    totalRevenue: number
    platformFee: number
    totalOrders: number
    totalProducts: number
    activeVendors: number
    pendingVendors: number
    monthlyData: Array<{
      month: string
      revenue: number
      orders: number
      vendors: number
    }>
    topVendors: Array<{
      id: string
      name: string
      totalProducts: number
      totalSales: number
      email: string
    }>
    growthMetrics: {
      revenueGrowth: number
      ordersGrowth: number
      vendorsGrowth: number
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

    // Fetch all data in parallel for performance
    const [
      totalRevenueResult,
      totalOrdersResult,
      totalProductsResult,
      vendorStats,
      monthlyData,
      topVendorsData
    ] = await Promise.all([
      // Total Revenue
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          }
        }
      }),
      
      // Total Orders
      prisma.order.count({
        where: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          }
        }
      }),
      
      // Total Products
      prisma.product.count({
        where: {
          inStock: true
        }
      }),
      
      // Vendor Statistics
      prisma.vendorShop.aggregate({
        _count: {
          _all: true
        },
        where: {
          isApproved: true
        }
      }),
      
      // Monthly Data (last 6 months)
      getMonthlyData(),
      
      // Top Vendors
      getTopVendors()
    ])

    const totalRevenue = totalRevenueResult._sum.totalAmount || 0
    const totalOrders = totalOrdersResult
    const totalProducts = totalProductsResult
    const activeVendors = vendorStats._count._all
    const platformFee = totalRevenue * 0.1 // 10% platform fee

    // Get pending vendors count
    const pendingVendors = await prisma.vendorShop.count({
      where: {
        isApproved: false
      }
    })

    // Calculate growth metrics (simplified - in production, compare with previous period)
    const growthMetrics = await calculateGrowthMetrics(totalRevenue, totalOrders, activeVendors)

    const analyticsData = {
      totalRevenue,
      platformFee,
      totalOrders,
      totalProducts,
      activeVendors,
      pendingVendors,
      monthlyData,
      topVendors: topVendorsData,
      growthMetrics
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error("Admin analytics error:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to calculate monthly data for last 6 months
async function getMonthlyData() {
  const months = []
  const currentDate = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get orders for this month
    const monthlyOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        items: true
      },
    })

    // Get active vendors for this month
    const monthlyVendors = await prisma.vendorShop.count({
      where: {
        isApproved: true,
        OR: [
         
          {
            products: {
              some: {
                createdAt: {
                  lte: endOfMonth
                }
              }
            }
          }
        ]
      }
    })

    const revenue = monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const orders = monthlyOrders.length

    months.push({
      month: monthName,
      revenue,
      orders,
      vendors: monthlyVendors
    })
  }

  return months
}

// Helper function to get top performing vendors
async function getTopVendors() {
  const vendorShops = await prisma.vendorShop.findMany({
    where: {
      isApproved: true
    },
    include: {
      vendor: {
        select: {
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
    take: 5
  })

  // Calculate sales for each vendor
  const topVendors = await Promise.all(
    vendorShops.map(async (shop) => {
      const salesData = await prisma.orderItem.aggregate({
        where: {
          product: {
            vendorId: shop.vendorId
          },
          order: {
            status: {
              in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
            }
          }
        },
        _sum: {
          price: true
        }
      })

      return {
        id: shop.id,
        name: shop.name,
        totalProducts: shop._count.products,
        totalSales: salesData._sum.price || 0,
        email: shop.vendor.email
      }
    })
  )

  // Sort by total sales descending
  return topVendors.sort((a, b) => b.totalSales - a.totalSales)
}

// Helper function to calculate growth metrics
async function calculateGrowthMetrics(currentRevenue: number, currentOrders: number, currentVendors: number) {
  const currentDate = new Date()
  const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
  const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59, 999)

  // Get last month's data for comparison
  const [lastMonthRevenue, lastMonthOrders, lastMonthVendors] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        totalAmount: true
      }
    }),
    prisma.order.count({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      }
    }),
    prisma.vendorShop.count({
      where: {
        isApproved: true,
        
      }
    })
  ])

  const lastMonthRevenueValue = lastMonthRevenue._sum.totalAmount || 0
  const lastMonthOrdersValue = lastMonthOrders
  const lastMonthVendorsValue = lastMonthVendors

  // Calculate growth percentages
  const revenueGrowth = lastMonthRevenueValue > 0 
    ? ((currentRevenue - lastMonthRevenueValue) / lastMonthRevenueValue) * 100 
    : currentRevenue > 0 ? 100 : 0

  const ordersGrowth = lastMonthOrdersValue > 0 
    ? ((currentOrders - lastMonthOrdersValue) / lastMonthOrdersValue) * 100 
    : currentOrders > 0 ? 100 : 0

  const vendorsGrowth = lastMonthVendorsValue > 0 
    ? ((currentVendors - lastMonthVendorsValue) / lastMonthVendorsValue) * 100 
    : currentVendors > 0 ? 100 : 0

  return {
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    ordersGrowth: Math.round(ordersGrowth * 10) / 10,
    vendorsGrowth: Math.round(vendorsGrowth * 10) / 10
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