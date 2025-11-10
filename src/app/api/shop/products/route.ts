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

    // Build where clause
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

    // Add category filter - UPDATED FOR MANAGED CATEGORIES
    if (category) {
      // Check if category is a valid UUID (category ID) or a string (category name)
      const isCategoryId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(category)
      
      if (isCategoryId) {
        // Filter by categoryId for managed categories
        whereClause.categoryId = category
      } else {
        // Filter by category name for backward compatibility
        whereClause.category = category
      }
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
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'featured':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Get products with category relation
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
          },
          categoryRef: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      })
    ])

    // Transform product data
    const transformedProducts = products.map(product => {
      // Use shop name first, fallback to vendor name
      const vendorName = product.shop?.name 
        || `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim()
        || 'Vendor'

      // Use managed category name if available, otherwise fallback to category string
      const displayCategory = product.categoryRef?.name || product.category

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images || ['/placeholder.svg'],
        category: displayCategory, // Use proper category name
        categoryId: product.categoryId, // Include categoryId for frontend
        inStock: product.inStock,
        stock: product.stockCount,
        rating: product.rating,
        reviews: product.reviews,
        vendorId: product.vendorId,
        vendorName,
        // featured: product.featured || false,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
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