import { useState, useEffect } from 'react';
import { simpleCrossBrowserStorage, StorageProduct } from '../lib/simpleStorage';
import { defaultProductCategories, TaskCategory } from '../lib/productTemplates';

export interface ProductWithTasks extends Omit<StorageProduct, 'categories'> {
  categories: TaskCategory[];
}

export const useCrossBrowserProducts = () => {
  const [products, setProducts] = useState<ProductWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({ isOnline: false, hasCloudSync: false });

  // Update status
  const updateStatus = () => {
    setStatus(simpleCrossBrowserStorage.getStatus());
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storageProducts = await simpleCrossBrowserStorage.loadProducts();
      const productsWithCategories = storageProducts.map(product => ({
        ...product,
        categories: Array.isArray(product.categories) ? product.categories : defaultProductCategories
      }));
      
      setProducts(productsWithCategories);
      updateStatus();
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Save product
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

    console.log('💾 Saving product:', updatedProduct.name);

    // Update local state
    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === updatedProduct.id);
      let newProducts;
      
      if (existingIndex >= 0) {
        newProducts = [...prev];
        newProducts[existingIndex] = updatedProduct;
      } else {
        newProducts = [updatedProduct, ...prev];
      }
      
      console.log('💾 Saving to storage:', newProducts.length, 'products');
      // Save to storage (local + cloud)
      simpleCrossBrowserStorage.saveProducts(newProducts.map(p => ({
        ...p,
        categories: p.categories
      })));
      
      return newProducts;
    });

    updateStatus();
    return updatedProduct;
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    setProducts(prev => {
      const newProducts = prev.filter(p => p.id !== productId);
      
      // Save to storage
      simpleCrossBrowserStorage.saveProducts(newProducts.map(p => ({
        ...p,
        categories: p.categories
      })));
      
      return newProducts;
    });
    
    updateStatus();
  };

  // Fetch product details
  const fetchProductDetails = async (productId: string): Promise<ProductWithTasks | null> => {
    const product = products.find(p => p.id === productId);
    if (product && product.categories) {
      return product;
    }
    
    if (product) {
      const productWithCategories = {
        ...product,
        categories: defaultProductCategories
      };
      
      await saveProduct(productWithCategories);
      return productWithCategories;
    }
    
    return null;
  };

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    products,
    loading,
    error,
    saveProduct,
    deleteProduct,
    fetchProductDetails,
    refreshProducts: loadProducts,
    status
  };
};