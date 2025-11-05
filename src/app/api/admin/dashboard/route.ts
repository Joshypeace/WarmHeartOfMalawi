import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

interface DashboardStats {
  totalVendors: number
  pendingVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  platformFee: number
  vendorDistribution: {
    approved: number
    pending: number
    rejected: number
  }
  orderStatus: {
    delivered: number
    inProgress: number
    cancelled: number
  }
  topCategories: Array<{
    category: string
    count: number
  }>
  recentActivity: Array<{
    type: string
    title: string
    description: string
    status: string
    createdAt: string
  }>
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
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        role: "ADMIN"
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Fetch all data in parallel for better performance
    const [
      vendors,
      products,
      orders,
      vendorShops,
      recentVendors,
      recentOrders,
      recentProducts
    ] = await Promise.all([
      // All vendors
      prisma.user.findMany({
        where: { role: "VENDOR" },
        include: { vendorShop: true }
      }),
      
      // All products
      prisma.product.findMany({
        where: { inStock: true }
      }),
      
      // All orders
      prisma.order.findMany({
        include: { items: true }
      }),
      
      // Vendor shops for distribution
      prisma.vendorShop.findMany(),
      
      // Recent vendors for activity
      prisma.user.findMany({
        where: { role: "VENDOR" },
        include: { vendorShop: true },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      
      // Recent orders for activity
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      
      // Recent products for activity
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          vendor: {
            select: { firstName: true, lastName: true }
          }
        }
      })
    ])

    // Calculate basic statistics
    const totalVendors = vendors.length
    const pendingVendors = vendorShops.filter(shop => !shop.isApproved).length
    const totalProducts = products.length
    const totalOrders = orders.length
    
    // Calculate total revenue (sum of all order totals)
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const platformFee = totalRevenue * 0.1 // 10% platform fee

    // Vendor distribution
    const vendorDistribution = {
      approved: vendorShops.filter(shop => shop.isApproved).length,
      pending: vendorShops.filter(shop => !shop.isApproved).length,
      rejected: 0 // You might want to add a rejected field to VendorShop model
    }

    // Order status distribution
    const orderStatus = {
      delivered: orders.filter(order => order.status === "DELIVERED").length,
      inProgress: orders.filter(order => 
        ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)
      ).length,
      cancelled: orders.filter(order => order.status === "CANCELLED").length
    }

    // Top categories
    const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Recent activity
    const recentActivity = [
      // Recent vendor registrations
      ...recentVendors.map(vendor => ({
        type: "vendor_registration",
        title: "New vendor registration",
        description: vendor.vendorShop?.name || `${vendor.firstName} ${vendor.lastName}`,
        status: vendor.vendorShop?.isApproved ? "approved" : "pending",
        createdAt: vendor.createdAt.toISOString()
      })),
      
      // Recent orders
      ...recentOrders.map(order => ({
        type: "order_completed",
        title: "Order completed",
        description: `ORD-${order.id.slice(-8).toUpperCase()}`,
        status: order.status.toLowerCase(),
        createdAt: order.createdAt.toISOString()
      })),
      
      // Recent products
      ...recentProducts.map(product => ({
        type: "product_listed",
        title: "New product listed",
        description: product.name,
        status: "active",
        createdAt: product.createdAt.toISOString()
      }))
    ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) // Get top 5 most recent activities

    const dashboardStats: DashboardStats = {
      totalVendors,
      pendingVendors,
      totalProducts,
      totalOrders,
      totalRevenue,
      platformFee,
      vendorDistribution,
      orderStatus,
      topCategories,
      recentActivity
    }

    return NextResponse.json({
      success: true,
      data: dashboardStats
    })

  } catch (error) {
    console.error("Admin dashboard error:", error)
    
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