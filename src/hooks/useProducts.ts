import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // Load products from localStorage
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isOnline) {
        // Try Supabase first
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .order('updated_at', { ascending: false });

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          // Fallback to localStorage
          loadFromLocalStorage();
          setError('Using offline mode - Supabase connection failed');
        } else {
          // Convert Supabase data to our format
          const convertedProducts = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            image: item.image_url,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            categories: Array.isArray(item.categories) ? item.categories : defaultProductCategories
          }));
          
          setProducts(convertedProducts);
          // Also save to localStorage as backup
          saveToLocalStorage(convertedProducts);
        }
      } else {
        // Offline - use localStorage
        loadFromLocalStorage();
        setError('Offline mode - using local storage');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      // Fallback to localStorage
      loadFromLocalStorage();
      setError('Using offline mode');
    } finally {
      setLoading(false);
    }
  };

  // Load from localStorage (fallback)
  const loadFromLocalStorage = () => {
    try {
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setProducts([]);
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

    try {
      if (isOnline) {
        // Save to Supabase
        const supabaseData = {
          id: updatedProduct.id,
          name: updatedProduct.name,
          image_url: updatedProduct.image,
          categories: updatedProduct.categories,
          created_at: updatedProduct.createdAt,
          updated_at: updatedProduct.updatedAt
        };

        const { error: supabaseError } = await supabase
          .from('products')
          .upsert(supabaseData);

        if (supabaseError) {
          console.error('Supabase save error:', supabaseError);
          // Continue with local save even if Supabase fails
        }
      }
    } catch (err) {
      console.error('Error saving to Supabase:', err);
      // Continue with local save
    }

    // Always save to localStorage as backup
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
    try {
      if (isOnline) {
        // Delete from Supabase
        const { error: supabaseError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (supabaseError) {
          console.error('Supabase delete error:', supabaseError);
          // Continue with local delete even if Supabase fails
        }
      }
    } catch (err) {
      console.error('Error deleting from Supabase:', err);
      // Continue with local delete
    }

    // Always delete from local state
    setProducts(prev => {
      const newProducts = prev.filter(p => p.id !== productId);
      saveToLocalStorage(newProducts);
      return newProducts;
    });
  };

  useEffect(() => {
    loadProducts();
  }, [isOnline]);

  return {
    products,
    loading,
    error,
    saveProduct,
    deleteProduct,
    fetchProductDetails,
    refreshProducts: loadProducts,
    isOnline
  };
};