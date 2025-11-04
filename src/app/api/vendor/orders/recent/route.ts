// src/app/api/vendor/orders/recent/route.ts
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
    name: string;
    vendorId: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
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

    // Get recent orders for this vendor
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId: vendorId,
            },
          },
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                vendorId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to 5 recent orders
    });

    // Filter items to only include this vendor's products and calculate vendor-specific totals
    const vendorOrders = orders.map(order => {
      const vendorItems = order.items.filter(item => item.product.vendorId === vendorId);
      const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        id: order.id,
        status: order.status,
        totalAmount: vendorTotal,
        createdAt: order.createdAt.toISOString(),
        customer: order.customer,
        items: vendorItems,
      };
    });

    return NextResponse.json(vendorOrders);

  } catch (error: unknown) {
    console.error('Vendor recent orders error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent orders',
        details: process.env.NODE_ENV === 'production' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}