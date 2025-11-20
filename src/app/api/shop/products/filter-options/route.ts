import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''

    // Build base where clause - MATCHING YOUR SCHEMA
    const where: any = {
      inStock: true,
      shop: {
        isApproved: true,
        isRejected: false
      }
    }

    // Add category filter if provided
    if (category && category !== 'all') {
      const isCategoryId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(category)
      if (isCategoryId) {
        where.categoryId = category
      } else {
        where.category = category
      }
    }

    // Get unique values for each filter option
    const [sizes, colors, materials, brands] = await Promise.all([
      // Sizes
      prisma.product.findMany({
        where: {
          ...where,
          size: { notIn: [null, ''] }
        },
        select: { size: true },
        distinct: ['size']
      }),
      // Colors
      prisma.product.findMany({
        where: {
          ...where,
          color: { notIn: [null, ''] }
        },
        select: { color: true },
        distinct: ['color']
      }),
      // Materials
      prisma.product.findMany({
        where: {
          ...where,
          material: { notIn: [null, ''] }
        },
        select: { material: true },
        distinct: ['material']
      }),
      // Brands
      prisma.product.findMany({
        where: {
          ...where,
          brand: { notIn: [null, ''] }
        },
        select: { brand: true },
        distinct: ['brand']
      })
    ])

    // Extract and sort unique values
    const filterOptions = {
      sizes: [...new Set(sizes.map(p => p.size).filter(Boolean))].sort(),
      colors: [...new Set(colors.map(p => p.color).filter(Boolean))].sort(),
      materials: [...new Set(materials.map(p => p.material).filter(Boolean))].sort(),
      brands: [...new Set(brands.map(p => p.brand).filter(Boolean))].sort()
    }

    return NextResponse.json({
      success: true,
      data: filterOptions
    })

  } catch (error) {
    console.error('Filter options API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load filter options"
      },
      { status: 500 }
    )
  }
}