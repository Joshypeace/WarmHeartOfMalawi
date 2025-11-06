// app/api/vendors/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12')))
    const search = searchParams.get('search') || ''
    const district = searchParams.get('district') || ''
    const category = searchParams.get('category') || ''

    const skip = (page - 1) * limit

    // Build where clause for approved vendors
    const whereClause: any = {
      isApproved: true,
      isRejected: false
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Add district filter
    if (district) {
      whereClause.district = district
    }

    // Add category filter through products
    if (category) {
      whereClause.products = {
        some: {
          category: {
            equals: category,
            mode: 'insensitive'
          }
        }
      }
    }

    // Get total count and vendor shops
    const [totalVendors, vendorShops] = await Promise.all([
      prisma.vendorShop.count({ where: whereClause }),
      prisma.vendorShop.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            }
          },
          products: {
            select: {
              id: true,
              category: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })
    ])

    // Transform vendor data
    const vendors = await Promise.all(
      vendorShops.map(async (vendor) => {
        // Calculate sales data
        let totalSales = 0
        let totalRevenue = 0
        
        try {
          const salesData = await prisma.orderItem.aggregate({
            where: {
              product: {
                vendorId: vendor.vendorId
              },
              order: {
                status: 'DELIVERED'
              }
            },
            _sum: {
              quantity: true,
              price: true
            }
          })
          
          totalSales = salesData._sum.quantity || 0
          totalRevenue = salesData._sum.price || 0
        } catch {
          // If sales calculation fails, use defaults
          totalSales = 0
          totalRevenue = 0
        }

        // Get unique categories
        const categories = [...new Set(vendor.products.map(p => p.category))].filter(Boolean)

        // Calculate rating
        const baseRating = 4.5
        const rating = totalSales > 0 ? Math.min(5, baseRating + (totalSales * 0.01)) : baseRating

        return {
          id: vendor.id,
          name: vendor.name,
          description: vendor.description || "No description available",
          location: vendor.district,
          status: "approved" as const,
          rating: parseFloat(rating.toFixed(1)),
          totalSales,
          totalRevenue,
          totalProducts: vendor.products.length,
          categories,
          joinedDate: vendor.vendor.createdAt.toISOString(),
          logo: vendor.logo
        }
      })
    )

    const totalPages = Math.ceil(totalVendors / limit)

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        pagination: {
          currentPage: page,
          totalPages,
          totalVendors,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load vendors"
      },
      { status: 500 }
    )
  }
}