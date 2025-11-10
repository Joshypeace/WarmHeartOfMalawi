// app/api/categories/route.ts - FINAL VERSION
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
    const result = categories
      .map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || `Explore our ${category.name.toLowerCase()} collection from local Malawian vendors`,
        image: category.image,
        count: category._count.products
      }))
      .filter(cat => cat.count > 0) // Only show categories with products
      .sort((a, b) => b.count - a.count) // Sort by product count (descending)

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        totalCategories: result.length,
        totalProducts: result.reduce((sum, cat) => sum + cat.count, 0)
      }
    })

  } catch (error) {
    console.error("Error loading categories:", error)
    
    // Provide more specific error messages
    let errorMessage = "Failed to load categories"
    if (error instanceof Error) {
      errorMessage = error.message.includes('prisma') 
        ? "Database error while loading categories"
        : error.message
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

// Optional: Add caching headers for better performance
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    },
  })
}