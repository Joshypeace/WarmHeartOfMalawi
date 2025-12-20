// app/api/shop/categories/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get active main categories with their subcategories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        type: 'MAIN',
        level: 1
      },
      include: {
        children: {
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
        },
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

    // Format categories with counts
    const categoriesWithCount = categories
      .map(category => {
        // Calculate total products including subcategories
        const subCategoryProducts = category.children.reduce(
          (sum, child) => sum + child._count.products,
          0
        )
        const totalProducts = category._count.products + subCategoryProducts

        return {
          id: category.id,
          name: category.name,
          count: totalProducts,
          type: 'MAIN',
          subCategories: category.children
            .filter(child => child._count.products > 0)
            .map(child => ({
              id: child.id,
              name: child.name,
              count: child._count.products
            }))
            .sort((a, b) => b.count - a.count)
        }
      })
      .filter(cat => cat.count > 0 || cat.subCategories.length > 0)
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: categoriesWithCount
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