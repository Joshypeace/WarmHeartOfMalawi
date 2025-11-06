// src/app/api/admin/users/[id]/role/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// ✅ Zod schema for request validation
const UpdateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"])
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; message: string; data?: any } | { error: string }>> {
  try {
    // ✅ Await params (Next.js 14+ compatibility)
    const { id: userId } = await context.params

    // 🔐 Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // 👑 Verify admin privileges
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

    // 🧾 Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const validation = UpdateRoleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      )
    }

    const { role } = validation.data

    // 🔍 Find the target user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // 🚫 Prevent changing own role
    if (user.id === adminUser.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      )
    }

    // ✅ Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `${updatedUser.firstName} ${updatedUser.lastName}'s role has been updated to ${role}.`,
      data: updatedUser
    })

  } catch (error) {
    console.error("User role update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
