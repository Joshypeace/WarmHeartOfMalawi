import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Updated validation schema for local image paths
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
  category: z.string().min(1, "Category is required"),
  stock: z.string().transform(val => {
    const parsed = parseInt(val)
    if (isNaN(parsed) || parsed < 0) {
      throw new Error("Stock must be a valid non-negative number")
    }
    return parsed
  }),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").default([]),
})

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    // Get user with vendor shop
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

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Validate input data
    const validationResult = CreateProductSchema.safeParse(body)
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const { name, description, price, category, stock, images } = validationResult.data

    // Check if vendor has reached product limit
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

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        stockCount: stock,
        inStock: stock > 0,
        images: images || [],
        vendorId: user.id,
        shopId: user.vendorShop.id,
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        stockCount: true,
        inStock: true,
        createdAt: true,
        images: true,
      }
    })

    console.log(`Product created: ${product.id} by vendor: ${user.id}`)

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: product
    }, { status: 201 })

  } catch (error) {
    console.error("Product creation error:", error)

    if (error instanceof Error && error.message.includes("prisma")) {
      return NextResponse.json(
        { error: "Database error occurred while creating product" },
        { status: 500 }
      )
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