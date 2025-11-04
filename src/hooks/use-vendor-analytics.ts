// src/hooks/use-vendor-analytics.ts
import { useState, useEffect } from 'react';

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  sales: number;
  images: string[];
}

interface GrowthMetrics {
  revenueGrowth: number;
  ordersGrowth: number;
  aovGrowth: number;
  productsGrowth: number;
}

interface VendorAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  monthlyData: MonthlyData[];
  topProducts: TopProduct[];
  growthMetrics: GrowthMetrics;
}

export function useVendorAnalytics() {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch('/api/vendor/analytics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
}