// app/api/admin/categories/route.ts
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

// Main category schema
const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  image: z.string().optional().nullable(),
  slug: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  type: z.enum(['MAIN', 'SUB']).default('MAIN'),
  parentId: z.string().optional().nullable(),
  level: z.number().min(1).max(2).default(1),
  attributes: z.array(CategoryAttributeSchema).optional().default([])
})

// GET - Fetch all categories with hierarchy
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const includeAttributes = url.searchParams.get('includeAttributes') === 'true'
    
    const categories = await prisma.category.findMany({
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ],
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          include: {
            _count: {
              select: {
                products: true
              }
            },
            ...(includeAttributes ? {
              categoryAttributes: {
                orderBy: { sortOrder: 'asc' }
              }
            } : {})
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        },
        ...(includeAttributes ? {
          categoryAttributes: {
            orderBy: { sortOrder: 'asc' }
          }
        } : {})
      }
    })

    const formattedCategories = categories.map(category => ({
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
      children: category.children.map(child => ({
        id: child.id,
        name: child.name,
        description: child.description,
        image: child.image,
        slug: child.slug,
        isActive: child.isActive,
        type: child.type,
        level: child.level,
        parentId: child.parentId,
        productCount: child._count.products,
        ...(includeAttributes && 'categoryAttributes' in child ? {
          attributes: child.categoryAttributes?.map((attr: any) => ({
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
          })) || []
        } : {})
      })),
      productCount: category._count.products,
      childrenCount: category._count.children,
      ...(includeAttributes && 'categoryAttributes' in category ? {
        attributes: category.categoryAttributes?.map((attr: any) => ({
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
        })) || []
      } : {}),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        categories: formattedCategories
      }
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load categories"
      },
      { status: 500 }
    )
  }
}

// POST - Create new category with attributes (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = CategorySchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: errorMessages },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    
    const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/\s+/g, '-')
    
    const nameConflict = await prisma.category.findUnique({
      where: { name: validatedData.name }
    })

    if (nameConflict) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    const slugConflict = await prisma.category.findUnique({
      where: { slug }
    })

    if (slugConflict) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    if (validatedData.type === 'SUB') {
      if (!validatedData.parentId) {
        return NextResponse.json(
          { success: false, error: 'Parent category is required for subcategories' },
          { status: 400 }
        )
      }
      
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedData.parentId }
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
      
      validatedData.level = 2
      validatedData.attributes = []
    } else {
      validatedData.level = 1
      validatedData.parentId = null
    }

    const category = await prisma.category.create({
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

    if (validatedData.type === 'MAIN' && validatedData.attributes && validatedData.attributes.length > 0) {
      await Promise.all(
        validatedData.attributes.map((attr, index) => 
          prisma.categoryAttribute.create({
            data: {
              categoryId: category.id,
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

    const createdCategory = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        parent: true,
        children: true,
        categoryAttributes: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    const formattedCategory = {
      id: createdCategory!.id,
      name: createdCategory!.name,
      description: createdCategory!.description,
      image: createdCategory!.image,
      slug: createdCategory!.slug,
      isActive: createdCategory!.isActive,
      type: createdCategory!.type,
      level: createdCategory!.level,
      parentId: createdCategory!.parentId,
      parent: createdCategory!.parent,
      children: createdCategory!.children,
      attributes: createdCategory!.categoryAttributes.map(attr => ({
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
      createdAt: createdCategory!.createdAt,
      updatedAt: createdCategory!.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: { 
        category: formattedCategory
      }
    })

  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}