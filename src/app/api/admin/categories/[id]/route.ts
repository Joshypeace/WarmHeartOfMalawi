import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Schema for category attributes
const CategoryAttributeSchema = z.object({
  name: z.string().min(1).max(100),
  attributeName: z.string().min(1).max(100).optional(),
  type: z.enum(['text', 'number', 'select', 'color', 'boolean', 'range']),
  attributeType: z.enum(['text', 'number', 'select', 'color', 'boolean', 'range']).optional(),
  filterType: z.enum(['text_input', 'dropdown', 'checkbox', 'range_slider', 'color_swatch', 'toggle']),
  options: z.array(z.string()).optional().default([]),
  units: z.string().optional().nullable(),
  isRequired: z.boolean().optional().default(false),
  isFilterable: z.boolean().optional().default(true),
  placeholder: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable()
})

// Main category schema for update
const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  image: z.string().optional().nullable(),
  slug: z.string().optional(),
  isActive: z.boolean().optional(),
  type: z.enum(['MAIN', 'SUB']).optional(),
  parentId: z.string().optional().nullable(),
  level: z.number().min(1).max(2).optional(),
  attributes: z.array(CategoryAttributeSchema).optional()
})

// GET single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        categoryAttributes: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    const formattedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image,
      slug: category.slug,
      isActive: category.isActive,
      type: category.type,
      level: category.level,
      parentId: category.parentId,
      parent: category.parent,
      children: category.children,
      productCount: category._count.products,
      childrenCount: category._count.children,
      attributes: category.categoryAttributes.map(attr => ({
        id: attr.id,
        name: attr.attributeName,
        type: attr.attributeType,
        filterType: attr.filterType,
        options: attr.options || [],
        units: attr.units,
        isRequired: attr.isRequired,
        isFilterable: attr.isFilterable,
        placeholder: attr.placeholder,
        sortOrder: attr.sortOrder,
        minValue: attr.minValue,
        maxValue: attr.maxValue
      })),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: {
        category: formattedCategory
      }
    })

  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update category with attributes (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validationResult = UpdateCategorySchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: errorMessages },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        categoryAttributes: true,
        children: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    if (validatedData.type && validatedData.type !== existingCategory.type && existingCategory.children.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot change category type when it has subcategories' },
        { status: 400 }
      )
    }

    const type = validatedData.type || existingCategory.type

    if (type === 'SUB') {
      if (validatedData.parentId === undefined && existingCategory.type === 'MAIN') {
        return NextResponse.json(
          { success: false, error: 'Parent category is required for subcategories' },
          { status: 400 }
        )
      }
      
      const parentId = validatedData.parentId || existingCategory.parentId
      
      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId }
        })
        
        if (!parentCategory) {
          return NextResponse.json(
            { success: false, error: 'Parent category not found' },
            { status: 404 }
          )
        }
        
        if (parentCategory.type !== 'MAIN') {
          return NextResponse.json(
            { success: false, error: 'Parent must be a main category' },
            { status: 400 }
          )
        }
      }
      
      validatedData.level = 2
      validatedData.attributes = []
    } else {
      validatedData.level = 1
      if (validatedData.parentId === undefined) {
        validatedData.parentId = null
      }
    }

    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }

    const name = validatedData.name || existingCategory.name
    const slug = validatedData.slug || name.toLowerCase().replace(/\s+/g, '-')

    if (slug !== existingCategory.slug) {
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      })

      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Category with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        image: validatedData.image,
        slug,
        isActive: validatedData.isActive,
        type: validatedData.type,
        level: validatedData.level,
        parentId: validatedData.parentId
      }
    })

    if (type === 'MAIN') {
      await prisma.categoryAttribute.deleteMany({
        where: { categoryId: id }
      })

      if (validatedData.attributes && validatedData.attributes.length > 0) {
        await Promise.all(
          validatedData.attributes.map((attr, index) => 
            prisma.categoryAttribute.create({
              data: {
                categoryId: id,
                attributeName: attr.attributeName || attr.name,
                attributeType: attr.attributeType || attr.type,
                filterType: attr.filterType,
                options: attr.options || [],
                units: attr.units || null,
                isRequired: attr.isRequired || false,
                isFilterable: attr.isFilterable !== false,
                placeholder: attr.placeholder || null,
                sortOrder: attr.sortOrder || index,
                minValue: attr.minValue || null,
                maxValue: attr.maxValue || null,
                isActive: true
              }
            })
          )
        )
      }
    }

    const finalCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        categoryAttributes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    const formattedCategory = {
      id: finalCategory!.id,
      name: finalCategory!.name,
      description: finalCategory!.description,
      image: finalCategory!.image,
      slug: finalCategory!.slug,
      isActive: finalCategory!.isActive,
      type: finalCategory!.type,
      level: finalCategory!.level,
      parentId: finalCategory!.parentId,
      parent: finalCategory!.parent,
      children: finalCategory!.children,
      attributes: finalCategory!.categoryAttributes.map(attr => ({
        id: attr.id,
        name: attr.attributeName,
        type: attr.attributeType,
        filterType: attr.filterType,
        options: attr.options || [],
        units: attr.units,
        isRequired: attr.isRequired,
        isFilterable: attr.isFilterable,
        placeholder: attr.placeholder,
        sortOrder: attr.sortOrder,
        minValue: attr.minValue,
        maxValue: attr.maxValue
      })),
      createdAt: finalCategory!.createdAt,
      updatedAt: finalCategory!.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: { 
        category: formattedCategory
      }
    })

  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Partial update (for status toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: body
    })

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: { 
        category: updatedCategory
      }
    })

  } catch (error) {
    console.error('Error patching category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with products' },
        { status: 400 }
      )
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with subcategories' },
        { status: 400 }
      )
    }

    // Delete attributes first
    await prisma.categoryAttribute.deleteMany({
      where: { categoryId: id }
    })

    // Delete category
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}