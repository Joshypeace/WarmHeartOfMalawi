// src/app/api/vendor/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
    vendorId: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  shippingAddress: string;
  district: string;
  items: OrderItem[];
}

export async function GET(request: NextRequest): Promise<NextResponse<ErrorResponse | Order[]>> {
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause for vendor-specific orders
    let whereClause: any = {
      items: {
        some: {
          product: {
            vendorId: vendorId,
          },
        },
      },
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Get orders for this vendor
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                vendorId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter items to only include this vendor's products and calculate vendor-specific totals
    const vendorOrders = orders.map(order => {
      const vendorItems = order.items.filter(item => item.product.vendorId === vendorId);
      const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        id: order.id,
        status: order.status.toLowerCase(),
        totalAmount: vendorTotal,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        district: order.district,
        items: vendorItems,
      };
    });

    // Apply search filter if provided
    let filteredOrders = vendorOrders;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = vendorOrders.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customer.firstName.toLowerCase().includes(searchLower) ||
        order.customer.lastName.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(filteredOrders);

  } catch (error: unknown) {
    console.error('Vendor orders error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'production' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}