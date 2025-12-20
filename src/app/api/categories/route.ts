// app/api/categories/route.ts 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all active MAIN categories with their SUB categories
    const mainCategories = await prisma.category.findMany({
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
        },
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
            },
            children: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data into hierarchical structure
    const result = mainCategories
      .map(mainCategory => {
        // Filter subcategories that have products
        const activeSubCategories = mainCategory.children
          .map(subCategory => ({
            id: subCategory.id,
            name: subCategory.name,
            description: subCategory.description || `${mainCategory.name} - ${subCategory.name}`,
            image: subCategory.image || mainCategory.image,
            count: subCategory._count.products
          }))
          .filter(subCat => subCat.count > 0)
          .sort((a, b) => b.count - a.count) // Sort by product count (descending)

        // Calculate total products in this main category (including subcategories)
        const totalProducts = mainCategory._count.products + 
          activeSubCategories.reduce((sum, sub) => sum + sub.count, 0)

        return {
          id: mainCategory.id,
          name: mainCategory.name,
          description: mainCategory.description || `Explore our ${mainCategory.name.toLowerCase()} collection from local Malawian vendors`,
          image: mainCategory.image,
          type: 'MAIN',
          level: 1,
          count: mainCategory._count.products,
          subCategories: activeSubCategories,
          totalProducts: totalProducts,
          hasSubCategories: activeSubCategories.length > 0
        }
      })
      .filter(mainCat => mainCat.count > 0 || mainCat.hasSubCategories) // Only show categories with products or active subcategories
      .sort((a, b) => b.totalProducts - a.totalProducts) // Sort by total product count (descending)

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        totalMainCategories: result.length,
        totalSubCategories: result.reduce((sum, cat) => sum + cat.subCategories.length, 0),
        totalProducts: result.reduce((sum, cat) => sum + cat.totalProducts, 0)
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