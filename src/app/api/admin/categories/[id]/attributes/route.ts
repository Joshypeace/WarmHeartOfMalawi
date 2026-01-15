import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET: Get attributes for a specific category
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // Check if user is admin
    if (!session?.user?.role || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    
    // Find the category and its attributes
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        categoryAttributes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Format attributes for frontend
    const formattedAttributes = category.categoryAttributes.map((attr: any) => ({
      id: attr.id,
      attributeName: attr.attributeName,
      name: attr.attributeName, // Add name for compatibility
      attributeType: attr.attributeType as 'text' | 'number' | 'select' | 'color' | 'boolean' | 'range',
      filterType: attr.filterType as 'text_input' | 'dropdown' | 'checkbox' | 'range_slider' | 'color_swatch' | 'toggle',
      options: attr.options || [],
      units: attr.units || undefined,
      isRequired: attr.isRequired,
      isFilterable: attr.isFilterable,
      placeholder: attr.placeholder || undefined,
      sortOrder: attr.sortOrder,
      minValue: attr.minValue || undefined,
      maxValue: attr.maxValue || undefined
    }))

    return NextResponse.json({
      success: true,
      data: {
        attributes: formattedAttributes,
        category: {
          id: category.id,
          name: category.name,
          type: category.type
        }
      }
    })

  } catch (error) {
    console.error('Error fetching category attributes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category attributes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST: Create attributes for a category (bulk update)
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // Check if user is admin
    if (!session?.user?.role || !['ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const data = await _request.json()
    
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Delete existing attributes
    await prisma.categoryAttribute.deleteMany({
      where: { categoryId: id }
    })

    // Create new attributes
    const attributes = data.attributes || []
    const createdAttributes = await Promise.all(
      attributes.map((attr: any) =>
        prisma.categoryAttribute.create({
          data: {
            categoryId: id,
            attributeName: attr.name || attr.attributeName,
            attributeType: attr.attributeType || attr.type,
            filterType: attr.filterType,
            options: attr.options || [],
            units: attr.units || undefined,
            isRequired: attr.isRequired || false,
            isFilterable: attr.isFilterable !== false, // Default to true
            placeholder: attr.placeholder || undefined,
            sortOrder: attr.sortOrder || 0,
            minValue: attr.minValue || undefined,
            maxValue: attr.maxValue || undefined,
            isActive: true
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: {
        attributes: createdAttributes,
        message: 'Attributes saved successfully'
      }
    })

  } catch (error) {
    console.error('Error saving category attributes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save category attributes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}