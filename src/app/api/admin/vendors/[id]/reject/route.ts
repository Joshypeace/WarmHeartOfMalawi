// src/app/api/admin/vendors/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    // ✅ Await params due to Next.js 14+ type enforcement
    const { id: vendorShopId } = await context.params

    // 🔐 Authentication and authorization check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // 👑 Verify admin role
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

    // 🏪 Find the vendor shop
    const vendorShop = await prisma.vendorShop.findUnique({
      where: { id: vendorShopId },
      include: {
        vendor: true
      }
    })

    if (!vendorShop) {
      return NextResponse.json(
        { error: "Vendor shop not found" },
        { status: 404 }
      )
    }

    // ❌ Reject the vendor shop by deleting it
    await prisma.vendorShop.delete({
      where: { id: vendorShopId }
    })

    return NextResponse.json({
      success: true,
      message: `${vendorShop.name} application has been rejected and removed from the system.`
    })

  } catch (error) {
    console.error("Vendor rejection error:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
