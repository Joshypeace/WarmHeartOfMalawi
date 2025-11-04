// src/hooks/use-vendor-orders.ts
import { useState, useEffect } from 'react';

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

export function useVendorOrders(statusFilter: string = 'all', searchQuery: string = '') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/vendor/orders?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [statusFilter, searchQuery]);

  const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus.toLowerCase() }
            : order
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating order status:', err);
      return false;
    }
  };

  return { orders, loading, error, updateOrderStatus };
}