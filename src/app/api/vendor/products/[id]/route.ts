// src/app/api/vendor/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Validation schema for product updates
const UpdateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  price: z.string().transform(val => {
    const parsed = parseFloat(val)
    if (isNaN(parsed) || parsed < 0) {
      throw new Error("Price must be a valid positive number")
    }
    return parsed
  }),
  categoryId: z.string().min(1, "Category ID is required"), // Use categoryId instead of category
  stockCount: z.string().transform(val => {
    const parsed = parseInt(val)
    if (isNaN(parsed) || parsed < 0) {
      throw new Error("Stock count must be a valid non-negative number")
    }
    return parsed
  }),
  images: z.array(z.string()).max(10, "Maximum 10 images allowed").default([]),
  inStock: z.boolean().default(true),
});

// GET - Fetch single product for editing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const { id: productId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // For vendors, verify the product belongs to them
    // For admins, allow access to any product
    const whereClause = session.user.role === 'VENDOR' 
      ? { id: productId, vendorId: userId }
      : { id: productId };

    const product = await prisma.product.findFirst({
      where: whereClause,
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        shop: {
          select: {
            id: true,
            name: true,
            description: true,
            district: true,
            logo: true
          }
        },
        categoryRef: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            isActive: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Transform the product data for the frontend with category support
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category, // Legacy field for backward compatibility
      categoryId: product.categoryId, // Managed category reference
      categoryData: product.categoryRef ? {
        id: product.categoryRef.id,
        name: product.categoryRef.name,
        description: product.categoryRef.description,
        image: product.categoryRef.image,
        isActive: product.categoryRef.isActive
      } : null,
      inStock: product.inStock,
      stockCount: product.stockCount,
      rating: product.rating,
      reviews: product.reviews,
      vendorId: product.vendorId,
      vendorName: product.shop?.name || `${product.vendor.firstName} ${product.vendor.lastName}`,
      vendorShop: product.shop ? {
        id: product.shop.id,
        name: product.shop.name,
        description: product.shop.description || '',
        district: product.shop.district,
        logo: product.shop.logo || ''
      } : undefined,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Product fetched successfully',
      data: {
        product: transformedProduct
      }
    });

  } catch (error: unknown) {
    console.error('Get product error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch product',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const { id: productId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate input data using schema
    const validationResult = UpdateProductSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ");
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      );
    }

    const { name, description, price, categoryId, stockCount, images, inStock } = validationResult.data;

    // Verify that the category exists and is active
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid category selected or category is inactive. Please choose a valid category." },
        { status: 400 }
      );
    }

    // For vendors, verify the product belongs to them
    // For admins, allow editing any product
    const whereClause = session.user.role === 'VENDOR' 
      ? { id: productId, vendorId: userId }
      : { id: productId };

    const existingProduct = await prisma.product.findFirst({
      where: whereClause
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Update the product with managed category support
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price,
        category: category.name, // Keep legacy field updated with category name
        categoryId, // Update managed category reference
        stockCount,
        inStock: stockCount > 0,
        images: Array.isArray(images) ? images : [],
        updatedAt: new Date()
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
          select: {
            id: true,
            name: true,
            description: true,
            image: true
          }
        }
      }
    });

    // Transform the response with category data
    const transformedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
      images: updatedProduct.images,
      category: updatedProduct.categoryRef?.name || updatedProduct.category, // Prefer managed category name
      categoryId: updatedProduct.categoryId,
      categoryData: updatedProduct.categoryRef ? {
        id: updatedProduct.categoryRef.id,
        name: updatedProduct.categoryRef.name,
        description: updatedProduct.categoryRef.description,
        image: updatedProduct.categoryRef.image
      } : null,
      inStock: updatedProduct.inStock,
      stockCount: updatedProduct.stockCount,
      rating: updatedProduct.rating,
      reviews: updatedProduct.reviews,
      vendorId: updatedProduct.vendorId,
      vendorName: updatedProduct.shop?.name || `${updatedProduct.vendor.firstName} ${updatedProduct.vendor.lastName}`,
      updatedAt: updatedProduct.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: transformedProduct
      }
    });

  } catch (error: unknown) {
    console.error('Update product error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint") || error.message.includes("categoryId")) {
        return NextResponse.json(
          { error: "Invalid category selected. Please choose a valid category." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const { id: productId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // For vendors, verify the product belongs to them
    // For admins, allow deleting any product
    const whereClause = session.user.role === 'VENDOR' 
      ? { id: productId, vendorId: userId }
      : { id: productId };

    const product = await prisma.product.findFirst({
      where: whereClause,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Check if product has any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
      },
    });

    if (orderItems) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Consider archiving instead.' },
        { status: 400 }
      );
    }

    // Check if product is in any carts
    const cartItems = await prisma.cartItem.findFirst({
      where: {
        productId: productId,
      },
    });

    if (cartItems) {
      // Remove from carts before deletion
      await prisma.cartItem.deleteMany({
        where: {
          productId: productId,
        },
      });
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error: unknown) {
    console.error('Delete product error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}