// src/app/api/vendor/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Transform the product data for the frontend
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category,
      inStock: product.inStock,
      stockCount: product.stockCount,
      // featured: product.featured || false,
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
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'stockCount'];
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate price and stock count
    if (body.price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    if (body.stockCount < 0) {
      return NextResponse.json(
        { error: 'Stock count must be a positive number' },
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

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        category: body.category,
        stockCount: parseInt(body.stockCount),
        inStock: Boolean(body.inStock),
        // featured: Boolean(body.featured),
        images: Array.isArray(body.images) ? body.images : [],
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
        }
      }
    });

    // Transform the response
    const transformedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
      images: updatedProduct.images,
      category: updatedProduct.category,
      inStock: updatedProduct.inStock,
      stockCount: updatedProduct.stockCount,
      // featured: updatedProduct.featured,
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
    
    return NextResponse.json(
      { 
        error: 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (your existing code with minor improvements)
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