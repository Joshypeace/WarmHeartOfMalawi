import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12')))
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const subCategory = searchParams.get('subCategory') || ''
    const sort = searchParams.get('sort') || 'featured'
    const featured = searchParams.get('featured')
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || []
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || []
    const materials = searchParams.get('materials')?.split(',').filter(Boolean) || []
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || []
    
    // Add support for dynamic filters from ProductFilters
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    // Get all other dynamic filter parameters
    const dynamicFilters: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      // Skip known parameters
      const knownParams = ['page', 'limit', 'search', 'category', 'subCategory', 'sort', 'featured', 'sizes', 'colors', 'materials', 'brands', 'minPrice', 'maxPrice']
      if (!knownParams.includes(key) && value) {
        dynamicFilters[key] = value
      }
    })

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      inStock: true,
      shop: {
        isApproved: true,
        isRejected: false
      }
    }

    // Featured filter
    if (featured === 'true') {
      where.featured = true
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category && category !== 'all') {
      where.categoryId = category
    }
    
    // Subcategory filter
    if (subCategory) {
      where.categoryId = subCategory
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) {
        where.price.gte = parseInt(minPrice)
      }
      if (maxPrice) {
        where.price.lte = parseInt(maxPrice)
      }
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

    // Handle dynamic filters from ProductFilters
    Object.entries(dynamicFilters).forEach(([key, value]) => {
      // Parse array values (comma-separated)
      if (value.includes(',')) {
        const values = value.split(',').filter(Boolean)
        if (values.length > 0) {
          where[key] = { in: values }
        }
      } 
      // Parse range values (min-max format)
      else if (value.includes('-')) {
        const [min, max] = value.split('-').map(v => v.trim())
        if (!isNaN(parseFloat(min)) && !isNaN(parseFloat(max))) {
          where[key] = {
            gte: parseFloat(min),
            lte: parseFloat(max)
          }
        }
      }
      // Parse boolean values
      else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        where[key] = value.toLowerCase() === 'true'
      }
      // Parse exact match for text fields
      else {
        where[key] = { contains: value, mode: 'insensitive' }
      }
    })

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
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'featured':
      default:
        orderBy = featured === 'true' 
          ? { createdAt: 'desc' } 
          : [{ featured: 'desc' }, { createdAt: 'desc' }]
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