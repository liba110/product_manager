import { useState, useEffect } from 'react';
import { 
  saveProductToFirebase, 
  getProductsFromFirebase, 
  deleteProductFromFirebase, 
  subscribeToProducts,
  isFirebaseConfigured,
  FirebaseProduct 
} from '../lib/firebase';
import { defaultProductCategories, TaskCategory } from '../lib/productTemplates';

export interface ProductWithTasks extends Omit<FirebaseProduct, 'categories'> {
  categories: TaskCategory[];
}

export const useFirebaseProducts = () => {
  const [products, setProducts] = useState<ProductWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [useFirebase, setUseFirebase] = useState(isFirebaseConfigured());

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

  // Load products from localStorage (fallback)
  const loadFromLocalStorage = () => {
    try {
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
  };

  // Save to localStorage (backup)
  const saveToLocalStorage = (products: ProductWithTasks[]) => {
    try {
      localStorage.setItem('products', JSON.stringify(products));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (useFirebase && isOnline) {
        // Try Firebase first
        const firebaseProducts = await getProductsFromFirebase();
        setProducts(firebaseProducts);
        // Also save to localStorage as backup
        saveToLocalStorage(firebaseProducts);
      } else {
        // Fallback to localStorage
        loadFromLocalStorage();
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products from Firebase, using local storage');
      // Fallback to localStorage
      loadFromLocalStorage();
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

    try {
      if (useFirebase && isOnline) {
        // Save to Firebase
        await saveProductToFirebase(updatedProduct);
      }
      
      // Always save to localStorage as backup
      setProducts(prev => {
        const existingIndex = prev.findIndex(p => p.id === updatedProduct.id);
        let newProducts;
        
        if (existingIndex >= 0) {
          newProducts = [...prev];
          newProducts[existingIndex] = updatedProduct;
        } else {
          newProducts = [updatedProduct, ...prev];
        }
        
        saveToLocalStorage(newProducts);
        return newProducts;
      });

    } catch (err) {
      console.error('Error saving product:', err);
      // Still update local state even if Firebase fails
      setProducts(prev => {
        const existingIndex = prev.findIndex(p => p.id === updatedProduct.id);
        let newProducts;
        
        if (existingIndex >= 0) {
          newProducts = [...prev];
          newProducts[existingIndex] = updatedProduct;
        } else {
          newProducts = [updatedProduct, ...prev];
        }
        
        saveToLocalStorage(newProducts);
        return newProducts;
      });
    }

    return updatedProduct;
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    try {
      if (useFirebase && isOnline) {
        await deleteProductFromFirebase(productId);
      }
      
      setProducts(prev => {
        const newProducts = prev.filter(p => p.id !== productId);
        saveToLocalStorage(newProducts);
        return newProducts;
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      // Still delete locally even if Firebase fails
      setProducts(prev => {
        const newProducts = prev.filter(p => p.id !== productId);
        saveToLocalStorage(newProducts);
        return newProducts;
      });
    }
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
      
      // Update the product with default categories
      await saveProduct(productWithCategories);
      return productWithCategories;
    }
    
    return null;
  };

  // Set up real-time listener for Firebase
  useEffect(() => {
    if (useFirebase && isOnline) {
      const unsubscribe = subscribeToProducts((firebaseProducts) => {
        setProducts(firebaseProducts);
        saveToLocalStorage(firebaseProducts);
      });

      return unsubscribe;
    }
  }, [useFirebase, isOnline]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [useFirebase, isOnline]);

  return {
    products,
    loading,
    error,
    saveProduct,
    deleteProduct,
    fetchProductDetails,
    refreshProducts: loadProducts,
    isOnline,
    useFirebase,
    setUseFirebase
  };
};