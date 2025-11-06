// app/api/regional-admin/vendors/[id]/reject/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorShopId } = await context.params

    const session = await getServerSession(authOptions)

    // Ensure user is logged in
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get regional admin info and verify role
    const regionalAdmin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        district: true
      }
    })

    if (!regionalAdmin || regionalAdmin.role !== "REGIONAL_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Regional admin access required" },
        { status: 403 }
      )
    }

    // Validate vendor shop belongs to same district
    const vendorShop = await prisma.vendorShop.findFirst({
      where: {
        id: vendorShopId,
        district: regionalAdmin.district ?? undefined
      },
      include: {
        vendor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!vendorShop) {
      return NextResponse.json(
        { success: false, error: "Vendor not found in your district" },
        { status: 404 }
      )
    }

    // Prevent re-rejecting already rejected vendors
    if (vendorShop.isRejected) {
      return NextResponse.json(
        { success: false, error: "This vendor has already been rejected" },
        { status: 400 }
      )
    }

    // Update vendor shop rejection status
    const updatedVendor = await prisma.vendorShop.update({
      where: { id: vendorShopId },
      data: {
        isApproved: false,
        isRejected: true,
        rejectedAt: new Date(),
        rejectedBy: regionalAdmin.id
      },
      include: {
        vendor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Vendor ${vendorShop.vendor.firstName} ${vendorShop.vendor.lastName}'s shop "${vendorShop.name}" has been rejected in ${regionalAdmin.district}`,
      data: updatedVendor
    })

  } catch (error) {
    console.error("Regional admin reject vendor error:", error)

    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject vendor",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
