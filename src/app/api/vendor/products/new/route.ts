// vendor/products/new/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  price: z.string().transform(val => {
    const parsed = parseFloat(val)
    if (isNaN(parsed) || parsed < 0) {
      throw new Error("Price must be a valid positive number")
    }
    return parsed
  }),
  category: z.string().min(1, "Category name is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  stockCount: z.string().transform(val => {
    const parsed = parseInt(val)
    if (isNaN(parsed) || parsed < 0) {
      throw new Error("Stock must be a valid non-negative number")
    }
    return parsed
  }),
  images: z.array(z.string()).max(10, "Maximum 10 images allowed").min(1, "At least one image is required"),
  brand: z.string().optional().nullable().default(null),
  size: z.string().optional().nullable().default(null),
  color: z.string().optional().nullable().default(null),
  material: z.string().optional().nullable().default(null),
  featured: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        role: "VENDOR" 
      },
      include: { 
        vendorShop: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Vendor account not found" },
        { status: 403 }
      )
    }

    if (!user.vendorShop) {
      return NextResponse.json(
        { error: "Vendor shop not set up. Please create a shop first." },
        { status: 403 }
      )
    }

    // Check if vendor shop is approved
    if (!user.vendorShop.isApproved) {
      return NextResponse.json(
        { error: "Your shop is not yet approved. Please wait for admin approval." },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const validationResult = CreateProductSchema.safeParse(body)
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const { 
      name, 
      description, 
      price, 
      category, 
      categoryId, 
      stockCount,
      images,
      brand,
      size,
      color,
      material,
      featured 
    } = validationResult.data

    // Validate category exists and is active (can be either MAIN or SUB category)
    const categoryExists = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Invalid category selected. Please choose a valid category." },
        { status: 400 }
      )
    }

    // For SUB categories, get the parent category name for the legacy category field
    let finalCategoryName = categoryExists.name
    if (categoryExists.type === 'SUB' && categoryExists.parent) {
      // Store both parent and child category names for clarity
      finalCategoryName = `${categoryExists.parent.name} - ${categoryExists.name}`
    }

    const productCount = await prisma.product.count({
      where: { vendorId: user.id }
    })

    const MAX_PRODUCTS = 1000
    if (productCount >= MAX_PRODUCTS) {
      return NextResponse.json(
        { error: `Product limit reached. Maximum ${MAX_PRODUCTS} products allowed.` },
        { status: 403 }
      )
    }

    const validImages = Array.isArray(images) ? images.slice(0, 10) : []

    // Create product WITHOUT reviews field (Prisma will handle defaults)
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category: finalCategoryName,
        categoryId,
        stockCount,
        inStock: stockCount > 0,
        images: validImages,
        vendorId: user.id,
        shopId: user.vendorShop.id,
        brand: brand?.trim() || null,
        size: size?.trim() || null,
        color: color?.trim() || null,
        material: material?.trim() || null,
        featured,
        rating: 0.0,
        reviewCount: 0,
      },
      include: {
        vendor: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        shop: {
          select: {
            name: true
          }
        },
        // FIX: Remove categoryRef or check if it exists in your schema
        categoryRef: true // Only include if it exists in your Prisma schema
      }
    })

    // Get the category separately if needed
    const categoryWithParent = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Product created successfully with ${validImages.length} images`,
      data: {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          categoryId: product.categoryId,
          categoryData: categoryWithParent ? {
            id: categoryWithParent.id,
            name: categoryWithParent.name,
            type: categoryWithParent.type,
            level: categoryWithParent.level,
            parentId: categoryWithParent.parentId,
            parentName: categoryWithParent.parent?.name
          } : undefined,
          stockCount: product.stockCount,
          inStock: product.inStock,
          images: product.images,
          featured: product.featured,
          brand: product.brand,
          size: product.size,
          color: product.color,
          material: product.material,
          vendorName: product.shop?.name || `${product.vendor.firstName} ${product.vendor.lastName}`,
          createdAt: product.createdAt,
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("Product creation error:", error)

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A product with similar details already exists." },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid category or shop reference." },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes("prisma") || error.message.includes("database")) {
        return NextResponse.json(
          { error: "Database error occurred while creating product" },
          { status: 500 }
        )
      }
      
      if (error.message.includes("foreign key constraint") || error.message.includes("categoryId")) {
        return NextResponse.json(
          { error: "Invalid category selected. Please choose a valid category." },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}