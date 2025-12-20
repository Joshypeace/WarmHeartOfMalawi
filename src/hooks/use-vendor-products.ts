import { useState, useEffect, useCallback } from 'react';

interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId: string | null;
  categoryData?: {
    id: string;
    name: string;
    type: 'MAIN' | 'SUB';
    level: number;
    parentId: string | null;
    parentName?: string;
  };
  images: string[];
  stockCount: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  vendorId: string;
}

interface UseVendorProductsOptions {
  search?: string;
  categoryId?: string;
}

export function useVendorProducts({ 
  search = '',
  categoryId 
}: UseVendorProductsOptions = {}) {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId) params.append('categoryId', categoryId);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
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
  }, [search, categoryId]);

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

  // Helper function to get category hierarchy name
  const getCategoryHierarchyName = (product: ProductResponse): string => {
    if (product.categoryData) {
      const { name, type, parentName } = product.categoryData;
      if (type === 'SUB' && parentName) {
        return `${parentName} - ${name}`;
      }
      return name;
    }
    return product.category || "Uncategorized";
  };

  // Get unique categories from products
  const getUniqueCategories = () => {
    const categoryMap = new Map<string, ProductResponse['categoryData']>();
    
    products.forEach(product => {
      if (product.categoryData) {
        categoryMap.set(product.categoryData.id, product.categoryData);
      } else if (product.categoryId) {
        // If no categoryData but has categoryId
        categoryMap.set(product.categoryId, {
          id: product.categoryId,
          name: product.category,
          type: 'MAIN' as const,
          level: 1,
          parentId: null
        });
      }
    });
    
    return Array.from(categoryMap.values());
  };

  // Get main categories (filter out subcategories)
  const getMainCategories = () => {
    return getUniqueCategories().filter(cat => cat?.type === 'MAIN');
  };

  // Get subcategories for a specific main category
  const getSubCategories = (parentCategoryId: string) => {
    return getUniqueCategories().filter(cat => 
      cat?.type === 'SUB' && cat.parentId === parentCategoryId
    );
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    deleteProduct,
    // Helper functions
    getCategoryHierarchyName,
    getUniqueCategories,
    getMainCategories,
    getSubCategories,
  };
}