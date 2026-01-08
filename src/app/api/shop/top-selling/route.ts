// app/api/shop/top-selling/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(20, parseInt(searchParams.get('limit') || '8')))
    
    // Calculate date range (last 30 days for "Today's Deals")
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get top-selling products based on order items in the last 30 days
    const topSellingProducts = await prisma.product.findMany({
      where: {
        inStock: true,
        shop: {
          isApproved: true,
          isRejected: false
        }
      },
      include: {
        shop: {
          select: {
            name: true,
            district: true
          }
        },
        vendor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        categoryRef: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: thirtyDaysAgo },
                  status: {
                    in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        {
          orderItems: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      take: limit
    })

    // Transform the data
    const transformedProducts = topSellingProducts.map(product => {
      const orderCount = product._count.orderItems
      
      // Determine popularity badge based on sales
      let popularityBadge = ""
      if (orderCount >= 50) {
        popularityBadge = "🔥 Bestseller"
      } else if (orderCount >= 20) {
        popularityBadge = "⭐ Popular"
      } else if (orderCount >= 10) {
        popularityBadge = "🆕 Trending"
      } else if (orderCount > 0) {
        popularityBadge = "📈 New Seller"
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images || ['/placeholder.svg'],
        category: product.categoryRef?.name || product.category,
        categoryId: product.categoryId,
        inStock: product.inStock,
        stockCount: product.stockCount,
        rating: product.rating,
        reviews: product.reviews,
        vendorId: product.vendorId,
        vendorName: product.shop?.name || 
                   `${product.vendor.firstName || ''} ${product.vendor.lastName || ''}`.trim() || 
                   'Vendor',
        featured: product.featured,
        size: product.size,
        color: product.color,
        material: product.material,
        brand: product.brand,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        // Add sales data
        orderCount: orderCount,
        popularityBadge: popularityBadge,
        // For "deal" display - we'll show order count as a deal metric
        dealMetric: orderCount > 0 ? `${orderCount}+ sold` : "New arrival"
      }
    })

    // Filter out products with 0 sales (optional)
    const productsWithSales = transformedProducts.filter(p => p.orderCount > 0)

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithSales.length > 0 ? productsWithSales : transformedProducts,
        // If no products have sales yet, return all (showing new arrivals)
        totalProducts: transformedProducts.length
      }
    })

  } catch (error) {
    console.error('Top selling products API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load top selling products"
      },
      { status: 500 }
    )
  }
}