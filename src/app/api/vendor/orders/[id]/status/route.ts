import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface UpdateStatusRequest {
  status: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  order: any;
}


export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ErrorResponse | SuccessResponse>> {
  try {
    const { id: orderId } = await context.params; // must await params
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'VENDOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = session.user.id;
    const { status }: UpdateStatusRequest = await request.json();

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify the order belongs to this vendor and update status
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
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

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status.toUpperCase() as any,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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
    });

    // Filter items to only show vendor's products
    const vendorItems = updatedOrder.items.filter(item => item.product.vendorId === vendorId);
    const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const responseOrder = {
      ...updatedOrder,
      items: vendorItems,
      totalAmount: vendorTotal,
      status: updatedOrder.status.toLowerCase(),
    };

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status.toLowerCase()}`,
      order: responseOrder,
    });

  } catch (error: unknown) {
    console.error('Update order status error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to update order status',
        details: process.env.NODE_ENV === 'production' ? undefined : errorMessage
      },
      { status: 500 }
    );
  }
}
