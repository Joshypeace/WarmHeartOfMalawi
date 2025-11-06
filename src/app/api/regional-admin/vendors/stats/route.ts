// app/api/regional-admin/vendors/stats/route.ts
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

    // Fetch vendor statistics for the district
    const [
      totalVendors,
      approvedVendors,
      pendingVendors,
      rejectedVendors,
      vendorsWithProducts,
      totalProducts
    ] = await Promise.all([
      // Total vendors in district
      prisma.vendorShop.count({
        where: {
          district: district
        }
      }),

      // Approved vendors
      prisma.vendorShop.count({
        where: {
          district: district,
          isApproved: true
        }
      }),

      // Pending vendors
      prisma.vendorShop.count({
        where: {
          district: district,
          isApproved: false,
          isRejected: false
        }
      }),

      // Rejected vendors
      prisma.vendorShop.count({
        where: {
          district: district,
          isRejected: true
        }
      }),

      // Vendors with products
      prisma.vendorShop.count({
        where: {
          district: district,
          products: {
            some: {}
          }
        }
      }),

      // Total products in district
      prisma.product.count({
        where: {
          vendor: {
            vendorShop: {
              district: district
            }
          }
        }
      })
    ])

    const stats = {
      totalVendors,
      approvedVendors,
      pendingVendors,
      rejectedVendors,
      vendorsWithProducts,
      totalProducts
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error("Regional admin vendors stats error:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch vendor statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}