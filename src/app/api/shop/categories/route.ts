import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get active main categories with their subcategories
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          {
            // Main categories
            type: 'MAIN',
            level: 1
          },
          {
            // Subcategories that might have products directly
            type: 'SUB',
            parent: {
              isActive: false
            }
          }
        ]
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
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // Separate main categories and subcategories
    const mainCategories = categories.filter(cat => cat.type === 'MAIN' && cat.level === 1)
    const standaloneSubCategories = categories.filter(cat => cat.type === 'SUB' && (!cat.parent))

    // Format main categories with counts
    const formattedMainCategories = mainCategories
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
          slug: category.slug,
          description: category.description,
          image: category.image,
          count: totalProducts,
          type: 'MAIN' as const,
          level: category.level,
          subCategories: category.children
            .filter(child => child._count.products > 0)
            .map(child => ({
              id: child.id,
              name: child.name,
              slug: child.slug,
              description: child.description,
              image: child.image,
              count: child._count.products,
              type: 'SUB' as const,
              level: child.level
            }))
            .sort((a, b) => b.count - a.count)
        }
      })
      .filter(cat => cat.count > 0 || cat.subCategories.length > 0)
      .sort((a, b) => b.count - a.count)

    // Format standalone subcategories (categories without active parents)
    const formattedStandaloneSubCategories = standaloneSubCategories
      .map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        count: category._count.products,
        type: 'SUB' as const,
        level: category.level
      }))
      .filter(cat => cat.count > 0)

    // Combine all categories
    const allCategories = [
      ...formattedMainCategories,
      ...formattedStandaloneSubCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat.count,
        type: 'MAIN' as const,
        subCategories: [] // Standalone categories have no subcategories
      }))
    ]

    return NextResponse.json({
      success: true,
      data: allCategories
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