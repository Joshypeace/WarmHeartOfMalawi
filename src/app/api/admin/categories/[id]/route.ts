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
  isActive: z.boolean().optional()
})

// GET - Get single category (Now accessible to all authenticated users)
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
        _count: {
          select: {
            products: true
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
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          productCount: category._count.products
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

// PUT, PATCH, DELETE - Keep these admin-only
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

    const { name, ...updateData } = validationResult.data

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        ...(name && { name })
      }
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
            products: true
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