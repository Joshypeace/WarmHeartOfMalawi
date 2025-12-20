// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  image: z.string().optional().nullable(),
  slug: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  type: z.enum(['MAIN', 'SUB']).default('MAIN'),
  parentId: z.string().optional().nullable(),
  level: z.number().min(1).max(2).default(1)
})

// GET - Fetch all categories with hierarchy
export async function GET() {
  try {
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
            }
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    // Format categories with product counts
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
        productCount: child._count.products
      })),
      productCount: category._count.products,
      childrenCount: category._count.children,
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

// POST - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can create categories
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
    
    // Generate slug if not provided
    const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/\s+/g, '-')
    
    // Check for duplicate name
    const nameConflict = await prisma.category.findUnique({
      where: { name: validatedData.name }
    })

    if (nameConflict) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const slugConflict = await prisma.category.findUnique({
      where: { slug }
    })

    if (slugConflict) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Validate parent for subcategories
    if (validatedData.type === 'SUB') {
      if (!validatedData.parentId) {
        return NextResponse.json(
          { success: false, error: 'Parent category is required for subcategories' },
          { status: 400 }
        )
      }
      
      // Verify parent exists and is a main category
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
    } else {
      validatedData.level = 1
      validatedData.parentId = null
    }

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        slug
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: { 
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          slug: category.slug,
          isActive: category.isActive,
          type: category.type,
          level: category.level,
          parentId: category.parentId,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
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