// src/app/api/vendor/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface StatsResponse {
  totalProducts: number;
  pendingOrders: number;
  totalRevenue: number;
  growth: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<ErrorResponse | StatsResponse>> {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a vendor
    if (session.user.role !== 'VENDOR') {
      return NextResponse.json(
        { error: 'Access denied. Vendor role required.' },
        { status: 403 }
      );
    }

    const vendorId = session.user.id;

    // Get vendor's products count
    const totalProducts = await prisma.product.count({
      where: {
        vendorId: vendorId,
        inStock: true,
      },
    });

    // Get vendor's orders statistics
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate vendor-specific stats
    const vendorOrders = orders.filter(order => 
      order.items.some(item => item.product.vendorId === vendorId)
    );

    const pendingOrders = vendorOrders.filter(order => 
      order.status === 'PENDING' || order.status === 'PROCESSING'
    ).length;

    // Calculate total revenue for this vendor
    const totalRevenue = vendorOrders.reduce((sum, order) => {
      const vendorItems = order.items.filter(item => item.product.vendorId === vendorId);
      const vendorTotal = vendorItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      return sum + vendorTotal;
    }, 0);

    // Mock growth calculation (in production, you'd compare with previous period)
    const growth = 12.5; // This would be calculated based on previous period data

    const stats: StatsResponse = {
      totalProducts,
      pendingOrders,
      totalRevenue,
      growth,
    };

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error('Vendor stats error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch vendor stats',
        details: process.env.NODE_ENV === 'production' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}