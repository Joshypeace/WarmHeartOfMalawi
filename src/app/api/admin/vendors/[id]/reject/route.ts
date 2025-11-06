import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ✅ Await params for Next.js 14+
    const { id: vendorId } = await context.params

    // 🔐 Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 👑 Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // ❌ Reject vendor shop
    const updatedVendor = await prisma.vendorShop.update({
      where: { id: vendorId },
      data: {
        isApproved: false,
        isRejected: true,
        rejectedAt: new Date(),
        rejectedBy: adminUser.id
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
      message: `Vendor ${updatedVendor.vendor.firstName} ${updatedVendor.vendor.lastName} has been rejected.`,
      data: updatedVendor
    })

  } catch (error) {
    console.error("Reject vendor error:", error)

    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
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
