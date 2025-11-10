// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long"),
  description: z.string().max(500, "Description too long").optional().nullable(),
  image: z.string().url("Invalid image URL").optional().nullable(),
  isActive: z.boolean().default(true)
})

// GET - Fetch all categories with product counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const categoriesWithCounts = categories.map(category => ({
      ...category,
      productCount: category._count.products
    }))

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithCounts
      }
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = CreateCategorySchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: errorMessages },
        { status: 400 }
      )
    }

    const { name, description, image, isActive } = validationResult.data

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}