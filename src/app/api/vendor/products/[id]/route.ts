// vendor/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Update validation schema
const UpdateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name too long").optional(),
  description: z.string().min(1, "Description is required").max(2000, "Description too long").optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  category: z.string().min(1, "Category name is required").optional(),
  categoryId: z.string().min(1, "Category ID is required").optional(),
  stockCount: z.number().min(0, "Stock count must be non-negative").optional(),
  inStock: z.boolean().optional(),
  images: z.array(z.string()).max(10, "Maximum 10 images allowed").optional(),
  brand: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  featured: z.boolean().optional(),
})

// GET method for fetching a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Vendor account not found" },
        { status: 403 }
      )
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        vendorId: user.id
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
        categoryRef: {
          include: {
            parent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.categoryRef?.name || product.category,
          categoryId: product.categoryId,
          categoryData: product.categoryRef ? {
            id: product.categoryRef.id,
            name: product.categoryRef.name,
            type: product.categoryRef.type,
            level: product.categoryRef.level,
            parentId: product.categoryRef.parentId,
            parentName: product.categoryRef.parent?.name
          } : undefined,
          stockCount: product.stockCount,
          inStock: product.inStock,
          images: product.images,
          featured: product.featured,
          brand: product.brand,
          size: product.size,
          color: product.color,
          material: product.material,
          rating: product.rating,
          reviews: product.reviews,
          vendorName: product.shop?.name || `${product.vendor.firstName} ${product.vendor.lastName}`,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }
      }
    })

  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT method for updating a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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

    // Check if product exists and belongs to this vendor
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        vendorId: user.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or you don't have permission to edit it" },
        { status: 404 }
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

    const validationResult = UpdateProductSchema.safeParse(body)
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    let categoryData: any = null
    let finalCategoryName = updateData.category || existingProduct.category

    // Verify and process category if being updated
    if (updateData.categoryId) {
      const categoryExists = await prisma.category.findFirst({
        where: {
          id: updateData.categoryId,
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

      categoryData = {
        id: categoryExists.id,
        name: categoryExists.name,
        type: categoryExists.type,
        level: categoryExists.level,
        parentId: categoryExists.parentId,
        parentName: categoryExists.parent?.name
      }

      // Update category name based on hierarchy
      if (categoryExists.type === 'SUB' && categoryExists.parent) {
        finalCategoryName = `${categoryExists.parent.name} - ${categoryExists.name}`
      } else {
        finalCategoryName = categoryExists.name
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        category: finalCategoryName,
        categoryId: updateData.categoryId,
        stockCount: updateData.stockCount,
        inStock: updateData.inStock ?? (updateData.stockCount ? updateData.stockCount > 0 : existingProduct.inStock),
        images: updateData.images,
        brand: updateData.brand,
        size: updateData.size,
        color: updateData.color,
        material: updateData.material,
        featured: updateData.featured,
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
        categoryRef: {
          include: {
            parent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: {
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          category: updatedProduct.categoryRef?.name || updatedProduct.category,
          categoryId: updatedProduct.categoryId,
          categoryData: categoryData || (updatedProduct.categoryRef ? {
            id: updatedProduct.categoryRef.id,
            name: updatedProduct.categoryRef.name,
            type: updatedProduct.categoryRef.type,
            level: updatedProduct.categoryRef.level,
            parentId: updatedProduct.categoryRef.parentId,
            parentName: updatedProduct.categoryRef.parent?.name
          } : undefined),
          stockCount: updatedProduct.stockCount,
          inStock: updatedProduct.inStock,
          images: updatedProduct.images,
          featured: updatedProduct.featured,
          brand: updatedProduct.brand,
          size: updatedProduct.size,
          color: updatedProduct.color,
          material: updatedProduct.material,
          vendorName: updatedProduct.shop?.name || `${updatedProduct.vendor.firstName} ${updatedProduct.vendor.lastName}`,
          updatedAt: updatedProduct.updatedAt,
        }
      }
    })

  } catch (error) {
    console.error("Product update error:", error)

    if (error instanceof Error) {
      if (error.message.includes("prisma") || error.message.includes("database")) {
        return NextResponse.json(
          { error: "Database error occurred while updating product" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE method for deleting a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Vendor account not found" },
        { status: 403 }
      )
    }

    // Check if product exists and belongs to the vendor
    const product = await prisma.product.findFirst({
      where: {
        id,
        vendorId: user.id,
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or you do not have permission to delete it" },
        { status: 404 }
      )
    }

    // Check for active orders (not delivered/completed)
    const activeOrderItem = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: {
          status: {
            in: ['PENDING', 'PROCESSING', 'SHIPPED', 'CONFIRMED']
          }
        }
      }
    })

    if (activeOrderItem) {
      return NextResponse.json(
        { 
          error: "Cannot delete product with active orders",
          suggestion: "Wait for orders to be delivered or canceled before deleting"
        },
        { status: 400 }
      )
    }

    // Use a transaction to delete related records first
    const result = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { productId: id }
      });

      const deletedProduct = await tx.product.delete({
        where: { id }
      });

      return deletedProduct;
    });

    return NextResponse.json({ 
      success: true,
      message: "Product deleted successfully" 
    });

  } catch (error: unknown) {
    console.error('Delete product error:', error);
    
    let errorMessage = 'Failed to delete product';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Handle Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        
        switch (prismaError.code) {
          case 'P2003':
            errorMessage = 'Cannot delete product due to database constraints';
            break;
          case 'P2025':
            errorMessage = 'Product not found';
            statusCode = 404;
            break;
          default:
            errorMessage = `Database error: ${prismaError.code}`;
        }
      }
      
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: statusCode }
    );
  }
}