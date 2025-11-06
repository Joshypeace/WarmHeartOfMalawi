// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get all unique categories from products of approved vendors
    const categories = await prisma.product.findMany({
      where: {
        vendor: {
          vendorShop: {
            isApproved: true,
            isRejected: false
          }
        },
        inStock: true
      },
      select: {
        category: true,
        images: true,
        id: true
      },
      distinct: ['category']
    })

    // Get product counts for each category
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.product.count({
          where: {
            category: category.category,
            vendor: {
              vendorShop: {
                isApproved: true,
                isRejected: false
              }
            },
            inStock: true
          }
        })

        return {
          name: category.category,
          count,
          image: category.images?.[0] || null,
          productId: category.id
        }
      })
    )

    // Filter out categories with no products and sort by count (descending)
    const sortedCategories = categoryCounts
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: sortedCategories
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