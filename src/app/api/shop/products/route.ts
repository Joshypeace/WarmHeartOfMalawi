import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12')))
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const sort = searchParams.get('sort') || 'featured'
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || []
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || []
    const materials = searchParams.get('materials')?.split(',').filter(Boolean) || []
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || []

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      inStock: true,
      shop: {
        isApproved: true,
        isRejected: false
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Category filter - FIXED: Always use categoryId when category is provided
    if (category && category !== 'all') {
      where.categoryId = category
    }

    // Size filter
    if (sizes.length > 0) {
      where.size = { in: sizes }
    }

    // Color filter
    if (colors.length > 0) {
      where.color = { in: colors }
    }

    // Material filter
    if (materials.length > 0) {
      where.material = { in: materials }
    }

    // Brand filter
    if (brands.length > 0) {
      where.brand = { in: brands }
    }

    // Build orderBy
    let orderBy: any = {}
    switch (sort) {
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
      case 'name-asc':
        orderBy = { name: 'asc' }
        break
      case 'name-desc':
        orderBy = { name: 'desc' }
        break
      case 'featured':
      default:
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }]
        break
    }

    // Get products and total count
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
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
      }),
      prisma.product.count({ where })
    ])

    // Transform products
    const transformedProducts = products.map(product => ({
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
                 `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim() || 
                 'Vendor',
      featured: product.featured,
      size: product.size,
      color: product.color,
      material: product.material,
      brand: product.brand,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: totalCount,
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