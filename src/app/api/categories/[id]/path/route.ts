// app/api/categories/[id]/path/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true
      }
    })
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Build category path
    const path = []
    let currentCategory: any = category
    
    while (currentCategory) {
      path.unshift(currentCategory.name)
      if (currentCategory.parentId) {
        currentCategory = await prisma.category.findUnique({
          where: { id: currentCategory.parentId }
        })
      } else {
        currentCategory = null
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        path
      }
    })
    
  } catch (error) {
    console.error('Error fetching category path:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}