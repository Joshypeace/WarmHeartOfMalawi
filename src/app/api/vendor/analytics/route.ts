import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface AnalyticsResponse {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    sales: number;
    images: string[];
  }>;
  growthMetrics: {
    revenueGrowth: number;
    ordersGrowth: number;
    aovGrowth: number;
    productsGrowth: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<ErrorResponse | AnalyticsResponse>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'VENDOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vendorId = session.user.id;

    // Get vendor's shop
    const vendorShop = await prisma.vendorShop.findUnique({
      where: { vendorId },
    });

    if (!vendorShop) {
      return NextResponse.json(
        { error: 'Vendor shop not found' },
        { status: 404 }
      );
    }

    // Get all time analytics
    const [totalRevenueResult, totalOrdersResult, totalProductsResult] = await Promise.all([
      // Total Revenue
      prisma.orderItem.aggregate({
        where: {
          product: {
            vendorId: vendorId,
          },
          order: {
            status: {
              in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
            }
          }
        },
        _sum: {
          price: true,
        },
      }),
      
      // Total Orders
      prisma.order.count({
        where: {
          items: {
            some: {
              product: {
                vendorId: vendorId,
              },
            },
          },
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          }
        },
      }),
      
      // Total Products
      prisma.product.count({
        where: {
          vendorId: vendorId,
          inStock: true,
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.price || 0;
    const totalOrders = totalOrdersResult;
    const totalProducts = totalProductsResult;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get monthly data for last 6 months
    const monthlyData = await getMonthlyData(vendorId);
    
    // Get top products
    const topProducts = await getTopProducts(vendorId);
    
    // Calculate growth metrics compared to previous period
    const growthMetrics = await getGrowthMetrics(vendorId, totalRevenue, totalOrders, averageOrderValue, totalProducts);

    const analytics: AnalyticsResponse = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProducts,
      monthlyData,
      topProducts,
      growthMetrics,
    };

    return NextResponse.json(analytics);

  } catch (error: unknown) {
    console.error('Vendor analytics error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        details: process.env.NODE_ENV === 'production' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate monthly data for last 6 months
async function getMonthlyData(vendorId: string) {
  const months = [];
  const currentDate = new Date();
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get orders for this month
    const monthlyOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId: vendorId,
            },
          },
        },
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        items: {
          where: {
            product: {
              vendorId: vendorId,
            },
          },
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate revenue and orders for this month
    const revenue = monthlyOrders.reduce((sum, order) => {
      const vendorItemsTotal = order.items.reduce((itemSum, item) => 
        itemSum + (item.price * item.quantity), 0
      );
      return sum + vendorItemsTotal;
    }, 0);

    const orders = monthlyOrders.length;

    months.push({
      month: monthName,
      revenue,
      orders,
    });
  }

  return months;
}

// Helper function to calculate top products
async function getTopProducts(vendorId: string) {
  const topProductsData = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      product: {
        vendorId: vendorId,
      },
      order: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        }
      }
    },
    _sum: {
      quantity: true,
    },
    _avg: {
      price: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 5,
  });

  // Get product details for top products
  const productIds = topProductsData.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      images: true,
    },
  });

  // Combine sales data with product details
  return topProductsData.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      id: item.productId,
      name: product?.name || 'Unknown Product',
      category: product?.category || 'Uncategorized',
      price: product?.price || 0,
      sales: item._sum.quantity || 0,
      images: product?.images || [],
    };
  });
}

// Helper function to calculate growth metrics
async function getGrowthMetrics(
  vendorId: string, 
  currentRevenue: number, 
  currentOrders: number, 
  currentAOV: number, 
  currentProducts: number
) {
  const currentDate = new Date();
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59, 999);

  // Get last month's data for comparison
  const [lastMonthRevenueResult, lastMonthOrdersResult, lastMonthProductsResult] = await Promise.all([
    // Last month revenue
    prisma.orderItem.aggregate({
      where: {
        product: {
          vendorId: vendorId,
        },
        order: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          },
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      },
      _sum: {
        price: true,
      },
    }),
    
    // Last month orders
    prisma.order.count({
      where: {
        items: {
          some: {
            product: {
              vendorId: vendorId,
            },
          },
        },
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    }),
    
    // Products added last month
    prisma.product.count({
      where: {
        vendorId: vendorId,
        inStock: true,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    }),
  ]);

  const lastMonthRevenue = lastMonthRevenueResult._sum.price || 0;
  const lastMonthOrders = lastMonthOrdersResult;
  const lastMonthAOV = lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0;

  // Calculate growth percentages
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : currentRevenue > 0 ? 100 : 0;

  const ordersGrowth = lastMonthOrders > 0 
    ? ((currentOrders - lastMonthOrders) / lastMonthOrders) * 100 
    : currentOrders > 0 ? 100 : 0;

  const aovGrowth = lastMonthAOV > 0 
    ? ((currentAOV - lastMonthAOV) / lastMonthAOV) * 100 
    : currentAOV > 0 ? 100 : 0;

  const productsGrowth = lastMonthProductsResult;

  return {
    revenueGrowth: Math.round(revenueGrowth * 10) / 10, // 1 decimal place
    ordersGrowth: Math.round(ordersGrowth * 10) / 10,
    aovGrowth: Math.round(aovGrowth * 10) / 10,
    productsGrowth,
  };
}