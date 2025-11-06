// app/api/regional-admin/users/stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

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

    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      activeVendors,
      pendingVendors,
      recentUsers
    ] = await Promise.all([
      prisma.user.count({
        where: {
          district: regionalAdmin.district,
          role: { in: ['CUSTOMER', 'VENDOR'] }
        }
      }),
      prisma.user.count({
        where: {
          district: regionalAdmin.district,
          role: 'CUSTOMER'
        }
      }),
      prisma.user.count({
        where: {
          district: regionalAdmin.district,
          role: 'VENDOR'
        }
      }),
      prisma.vendorShop.count({
        where: {
          district: regionalAdmin.district,
          isApproved: true,
          products: { some: {} }
        }
      }),
      prisma.vendorShop.count({
        where: {
          district: regionalAdmin.district,
          isApproved: false,
          isRejected: false
        }
      }),
      prisma.user.count({
        where: {
          district: regionalAdmin.district,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          role: { in: ['CUSTOMER', 'VENDOR'] }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalVendors,
        activeVendors,
        pendingVendors,
        recentUsers
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