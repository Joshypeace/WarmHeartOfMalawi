// hooks/use-vendor-products.ts (or wherever your hook is located)
import { useState, useEffect, useCallback } from 'react';

interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId: string | null;
  images: string[];
  stockCount: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  vendorId: string;
}

export function useVendorProducts(searchQuery: string = '') {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/vendor/products${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Remove the deleted product from local state
      setProducts(prev => prev.filter(product => product.id !== productId));
      
      return { success: true };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    deleteProduct,
  };
}