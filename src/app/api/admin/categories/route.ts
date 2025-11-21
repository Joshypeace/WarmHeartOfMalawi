import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all active categories with product counts from managed categories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                inStock: true,
                shop: {
                  isApproved: true,
                  isRejected: false
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data to match what ShopPage expects
    const categoriesWithCount = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      productCount: category._count.products
    })).filter(cat => cat.productCount > 0) // Only show categories with products

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCount
      }
    })

  } catch (error) {
    console.error('Shop categories API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load categories"
      },
      { status: 500 }
    )
  }
}