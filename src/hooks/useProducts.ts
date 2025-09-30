import { useState, useEffect } from 'react';
import { defaultProductCategories, TaskCategory, ChecklistItem } from '../lib/productTemplates';

// Re-export types for backward compatibility
export type { TaskCategory, ChecklistItem } from '../lib/productTemplates';

export interface Product {
  name: string;
  image: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  name: string;
  image: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithTasks extends Product {
  categories?: TaskCategory[];
}

export const useProducts = () => {
  const [products, setProducts] = useState<ProductWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products from localStorage
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      } else {
        setProducts([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(null); // Don't show errors for localStorage
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Save products to localStorage
  const saveToLocalStorage = (products: ProductWithTasks[]) => {
    try {
      localStorage.setItem('products', JSON.stringify(products));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Fetch detailed product data including categories
  const fetchProductDetails = async (productId: string): Promise<ProductWithTasks | null> => {
    const product = products.find(p => p.id === productId);
    if (product && product.categories) {
      return product;
    }
    
    // If product doesn't have categories, add default ones
    if (product) {
      const productWithCategories = {
        ...product,
        categories: defaultProductCategories
      };
      
      // Update the product in the list
      setProducts(prev => prev.map(p => 
        p.id === productId ? productWithCategories : p
      ));
      
      return productWithCategories;
    }
    
    return null;
  };

  // Save product (create or update)
  const saveProduct = async (product: Partial<ProductWithTasks>, categories?: TaskCategory[]): Promise<ProductWithTasks> => {
    const now = new Date().toISOString();
    const productCategories = categories || product.categories || defaultProductCategories;
    
    const updatedProduct: ProductWithTasks = {
      id: product.id || `product-${Date.now()}`,
      name: product.name || 'Untitled Product',
      image: product.image || null,
      createdAt: product.createdAt || now,
      updatedAt: now,
      categories: productCategories
    };

    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === updatedProduct.id);
      let newProducts;
      
      if (existingIndex >= 0) {
        // Update existing product
        newProducts = [...prev];
        newProducts[existingIndex] = updatedProduct;
      } else {
        // Add new product
        newProducts = [updatedProduct, ...prev];
      }
      
      // Save to localStorage
      saveToLocalStorage(newProducts);
      return newProducts;
    });

    return updatedProduct;
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    setProducts(prev => {
      const newProducts = prev.filter(p => p.id !== productId);
      saveToLocalStorage(newProducts);
      return newProducts;
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    saveProduct,
    deleteProduct,
    fetchProductDetails,
    refreshProducts: loadProducts
  };
};