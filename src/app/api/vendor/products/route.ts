// src/app/api/vendor/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // Legacy field - category name
  categoryId: string | null; // New field - managed category ID
  images: string[];
  stockCount: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  vendorId: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ErrorResponse | ProductResponse[]>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'VENDOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = session.user.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build where clause
    let whereClause: any = {
      vendorId: vendorId,
    };

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get vendor's products with category relation
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        categoryRef: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data for frontend
    const transformedProducts: ProductResponse[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.categoryRef?.name || product.category || "Uncategorized", // Use managed category name if available
      categoryId: product.categoryId, // Include the managed category ID
      images: product.images,
      stockCount: product.stockCount,
      inStock: product.inStock,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      vendorId: product.vendorId,
    }));

    return NextResponse.json(transformedProducts);

  } catch (error: unknown) {
    console.error('Vendor products error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'production' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}