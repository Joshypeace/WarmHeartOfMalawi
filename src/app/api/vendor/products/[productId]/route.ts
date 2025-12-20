// src/app/api/vendor/products/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ErrorResponse {
  error: string
  details?: string
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
): Promise<Response> {
  try {
    const { productId } = await context.params

    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "VENDOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const vendorId = session.user.id

    // Check if product exists and belongs to vendor
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found or you do not have permission to delete it",
        },
        { status: 404 }
      )
    }

    // Check if product has orders
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
      },
    })

    if (orderItem) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders" },
        { status: 400 }
      )
    }

    // Delete product
    await prisma.product.delete({
      where: {
        id: productId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Delete product error:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"

    return NextResponse.json(
      {
        error: "Failed to delete product",
        details:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : undefined,
      },
      { status: 500 }
    )
  }
}
