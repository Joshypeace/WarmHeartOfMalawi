import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  price: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null
      if (typeof val === 'string') {
        const parsed = parseFloat(val)
        return isNaN(parsed) ? null : parsed
      }
      return val
    },
    z.number().positive("Price must be a positive number").min(0.01, "Price must be at least 0.01")
  ),
  category: z.string().min(1, "Category name is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  stockCount: z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return 0
    if (typeof val === "string") {
      const parsed = parseInt(val, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return val
  },
  z.number().int().min(0, "Stock count must be a non-negative integer")
),
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

    // Debug: Log what we're receiving
    console.log("=== DEBUG: Incoming Request Data ===")
    console.log("Full body:", JSON.stringify(body, null, 2))
    console.log("Price field:", body.price, "Type:", typeof body.price)
    console.log("StockCount field:", body.stockCount, "Type:", typeof body.stockCount)
    console.log("=====================================")

    const validationResult = CreateProductSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("=== DEBUG: Validation Errors ===")
      validationResult.error.errors.forEach((err, index) => {
        console.log(`Error ${index + 1}:`, {
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
          
        })
      })
      console.log("==================================")

      const errorMessages = validationResult.error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`
      }).join(", ")

      return NextResponse.json(
        { 
          error: `Validation failed: ${errorMessages}`,
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
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

    console.log("=== DEBUG: Parsed Data ===")
    console.log("Price (parsed):", price, "Type:", typeof price)
    console.log("StockCount (parsed):", stockCount, "Type:", typeof stockCount)
    console.log("============================")

    // Validate category exists and is active
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

    // For SUB categories, get the parent category name
    let finalCategoryName = categoryExists.name
    if (categoryExists.type === 'SUB' && categoryExists.parent) {
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

    // Create product
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
        }
      }
    })

    // Get the category separately for response
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

    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message 
      },
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