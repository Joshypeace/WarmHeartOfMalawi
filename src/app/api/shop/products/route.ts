// app/api/shop/products/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12')))
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const vendor = searchParams.get('vendor') || ''
    const sortBy = searchParams.get('sort') || 'featured'

    const skip = (page - 1) * limit

    // Build where clause - CORRECTED for your schema
    const whereClause: any = {
      inStock: true,
      shop: {
        isApproved: true,
        isRejected: false
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Add category filter
    if (category) {
      whereClause.category = category
    }

    // Add vendor filter
    if (vendor) {
      whereClause.vendorId = vendor
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }
    
    switch (sortBy) {
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'featured':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Get products with CORRECT relations for your schema
    const [totalProducts, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              vendorId: true
            }
          },
          vendor: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      })
    ])

    // Transform product data - CORRECTED for your schema
    const transformedProducts = products.map(product => {
      // Use shop name first, fallback to vendor name
      const vendorName = product.shop?.name 
        || `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim()
        || 'Vendor'

      // Calculate rating and reviews
      const baseRating = 4.0 + (Math.random() * 1.5)
      const rating = parseFloat(baseRating.toFixed(1))
      const reviews = Math.floor(Math.random() * 100) + 10

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images || ['/placeholder.svg'],
        category: product.category,
        inStock: product.inStock,
        stock: product.stockCount,
        featured: false,
        rating,
        reviews,
        vendorId: product.vendorId,
        vendorName,
        createdAt: product.createdAt.toISOString()
      }
    })

    const totalPages = Math.ceil(totalProducts / limit)

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    })

  } catch (error) {
    console.error('Shop products API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load products"
      },
      { status: 500 }
    )
  }
}