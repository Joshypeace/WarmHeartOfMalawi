// src/hooks/use-vendor-products.ts
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stockCount: number;
  categoryId: string | null;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  vendorId: string;
}

export function useVendorProducts(searchQuery: string = '') {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/vendor/products?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchQuery]);

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Remove product from local state
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  return { products, loading, error, deleteProduct };
}