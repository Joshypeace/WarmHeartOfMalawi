// app/api/vendors/categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get categories from products of approved vendors
    const categories = await prisma.product.findMany({
      where: {
        vendor: {
          vendorShop: {
            isApproved: true,
            isRejected: false
          }
        }
      },
      select: {
        category: true
      },
      distinct: ['category']
    })

    // Extract and filter categories
    const uniqueCategories = categories
      .map(c => c.category)
      .filter((c): c is string => !!c && c.trim() !== '')
      .sort()

    return NextResponse.json({
      success: true,
      data: uniqueCategories
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