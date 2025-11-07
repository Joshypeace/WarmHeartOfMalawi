// app/api/shop/categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        inStock: true,
        shop: {
          isApproved: true,
          isRejected: false
        }
      },
      _count: {
        id: true
      }
    })

    const categoriesWithCount = categories.map(cat => ({
      name: cat.category,
      count: cat._count.id
    })).sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: categoriesWithCount
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load categories"
      },
      { status: 500 }
    )
  }
}