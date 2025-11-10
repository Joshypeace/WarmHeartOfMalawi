// app/api/categories/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get all active categories with product counts
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
                vendor: {
                  vendorShop: {
                    isApproved: true,
                    isRejected: false
                  }
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

    // Transform the data
    const result = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || `Explore our ${category.name.toLowerCase()} collection`,
      image: category.image,
      count: category._count.products
    })).filter(cat => cat.count > 0) // Only show categories with products

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Error loading categories:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load categories"
      },
      { status: 500 }
    )
  }
}