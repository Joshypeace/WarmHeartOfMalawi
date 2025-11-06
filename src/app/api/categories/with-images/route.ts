import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Step 1: Get distinct categories from approved vendor shops
    const categories = await prisma.product.findMany({
      where: {
        vendor: {
          vendorShop: {
            isApproved: true,
            isRejected: false,
          },
        },
        inStock: true,
        images: {
          isEmpty: false,
        },
      },
      select: {
        category: true,
        images: true,
      },
    })

    // Step 2: Group and count products by category manually
    const grouped = categories.reduce<Record<string, { count: number; image: string | null }>>(
      (acc, item) => {
        if (!item.category) return acc

        if (!acc[item.category]) {
          acc[item.category] = {
            count: 0,
            image: item.images?.[0] || null,
          }
        }

        acc[item.category].count += 1
        return acc
      },
      {}
    )

    // Step 3: Transform into an array
    const result = Object.entries(grouped).map(([name, data]) => ({
      name,
      count: data.count,
      image: data.image,
      description: `Explore our collection of ${name.toLowerCase()} products from local vendors`,
    }))

    // Step 4: Sort by product count (descending)
    const sortedCategories = result.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: sortedCategories,
    })
  } catch (error) {
    console.error("Error loading categories with images:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load categories with images",
      },
      { status: 500 }
    )
  }
}
