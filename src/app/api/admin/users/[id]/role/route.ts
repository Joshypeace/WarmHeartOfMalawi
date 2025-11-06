import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// ✅ Schema validation for role update
const RoleUpdateSchema = z.object({
  role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"])
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ✅ Await params (Next.js 14+ requires this)
    const { id: userId } = await context.params

    // 🔐 Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 👑 Verify admin access
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // 📦 Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      )
    }

    const validation = RoleUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { role } = validation.data

    // 🚫 Prevent admin from changing their own role
    if (userId === adminUser.id) {
      return NextResponse.json(
        { success: false, error: "Cannot modify your own role" },
        { status: 400 }
      )
    }

    // 🔍 Fetch target user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        vendorShop: { select: { id: true } }
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // 🧹 Handle vendor shop removal if switching *from* VENDOR
    if (currentUser.role === "VENDOR" && role !== "VENDOR") {
      await prisma.vendorShop.deleteMany({
        where: { vendorId: userId }
      })
    }

    // 🏪 Create vendor shop if switching *to* VENDOR
    if (role === "VENDOR" && currentUser.role !== "VENDOR") {
      const existingShop = await prisma.vendorShop.findUnique({
        where: { vendorId: userId }
      })

      if (!existingShop) {
        await prisma.vendorShop.create({
          data: {
            name: `${currentUser.firstName}'s Shop`,
            description: `Shop for ${currentUser.firstName} ${currentUser.lastName}`,
            district: "Not specified",
            vendorId: userId
          }
        })
      }
    }

    // ✏️ Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.firstName} ${updatedUser.lastName}'s role has been updated to ${role}`,
      data: updatedUser
    })
  } catch (error) {
    console.error("Update user role error:", error)

    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user role",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
