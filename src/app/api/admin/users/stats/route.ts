// app/api/admin/users/stats/route.ts
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

    // Get user statistics
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalAdmins,
      recentUsers
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Total customers count
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      
      // Total vendors count
      prisma.user.count({
        where: { role: 'VENDOR' }
      }),
      
      // Total admins count
      prisma.user.count({
        where: { role: 'ADMIN' }
      }),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Get vendor approval stats
    // isApproved is a boolean, so use count queries instead of numeric aggregation
    const approvedVendors = await prisma.vendorShop.count({
      where: { isApproved: true }
    })
    
    // Count pending vendors where isApproved is explicitly false (field is non-nullable)
    const pendingVendors = await prisma.vendorShop.count({
      where: { isApproved: false }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalVendors,
        totalAdmins,
        recentUsers,
        vendorStats: {
          approved: approvedVendors,
          pending: pendingVendors
        }
      }
    })

  } catch (error) {
    console.error("Admin users stats error:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch user statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}