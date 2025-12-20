// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  image: z.string().optional().nullable(),
  slug: z.string().optional(),
  isActive: z.boolean().optional(),
  type: z.enum(['MAIN', 'SUB']).optional(),
  parentId: z.string().optional().nullable(),
  level: z.number().min(1).max(2).optional()
})

// GET - Get single category with hierarchy
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow any authenticated user to read categories
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // For non-admin users, only allow access to active categories
    const whereClause = session.user.role !== 'ADMIN' 
      ? { id, isActive: true }
      : { id }

    const category = await prisma.category.findUnique({
      where: whereClause,
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

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
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
        }
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

// PUT - Update category (admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can update categories
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
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

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
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

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if changing type from SUB to MAIN when there are children
    if (validatedData.type === 'MAIN' && existingCategory.type === 'SUB' && existingCategory._count.children > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot change subcategory to main category when it has children' },
        { status: 400 }
      )
    }

    // Handle type changes
    let updateData = { ...validatedData }
    
    if (validatedData.type) {
      if (validatedData.type === 'MAIN') {
        updateData.parentId = null
        updateData.level = 1
      } else if (validatedData.type === 'SUB') {
        // Validate parent if changing to subcategory
        if (!validatedData.parentId && !existingCategory.parentId) {
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
          
          if (!parentCategory || parentCategory.type !== 'MAIN') {
            return NextResponse.json(
              { success: false, error: 'Invalid parent category' },
              { status: 400 }
            )
          }
          
          if (parentId === id) {
            return NextResponse.json(
              { success: false, error: 'Category cannot be its own parent' },
              { status: 400 }
            )
          }
          
          updateData.parentId = parentId
        }
        updateData.level = 2
      }
    }

    // Check if name is being changed and if it conflicts
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: validatedData.name }
      })

      if (nameConflict && nameConflict.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
      
      // Generate new slug if name changed
      if (!validatedData.slug) {
        updateData.slug = validatedData.name.toLowerCase().replace(/\s+/g, '-')
      }
    }

    // Check if slug is being changed and if it conflicts
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const slugConflict = await prisma.category.findUnique({
        where: { slug: validatedData.slug }
      })

      if (slugConflict && slugConflict.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Category with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: { 
        category: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          description: updatedCategory.description,
          image: updatedCategory.image,
          slug: updatedCategory.slug,
          isActive: updatedCategory.isActive,
          type: updatedCategory.type,
          level: updatedCategory.level,
          parentId: updatedCategory.parentId,
          createdAt: updatedCategory.createdAt,
          updatedAt: updatedCategory.updatedAt
        }
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

// PATCH - Partial update (for status toggle) - Admin only
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    const category = await prisma.category.findUnique({
      where: { id }
    })

    if (!category) {
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
        category: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          description: updatedCategory.description,
          image: updatedCategory.image,
          isActive: updatedCategory.isActive,
          type: updatedCategory.type,
          level: updatedCategory.level,
          parentId: updatedCategory.parentId,
          createdAt: updatedCategory.createdAt,
          updatedAt: updatedCategory.updatedAt
        }
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

// DELETE - Delete category - Admin only
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

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
        { success: false, error: 'Cannot delete category with associated products' },
        { status: 400 }
      )
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with subcategories' },
        { status: 400 }
      )
    }

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