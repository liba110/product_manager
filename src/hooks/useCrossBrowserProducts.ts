import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  const [useSupabase, setUseSupabase] = useState(true);

  // Update status
  const updateStatus = () => {
    setStatus(simpleCrossBrowserStorage.getStatus());
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading products...');
      console.log('🌐 Status:', status);
      console.log('🛠️ Use Supabase:', useSupabase);

      if (useSupabase && status.isOnline) {
        console.log('📡 Trying Supabase...');
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('id, name, updated_at') // Fetch only necessary columns
          .order('updated_at', { ascending: false })
          .limit(100); // Limit to 100 products

        if (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
          setError('Failed to fetch products from Supabase');
        } else if (data) {
          console.log('✅ Supabase data:', data.length, 'products');
          const supabaseProducts = data.map(item => ({
            id: item.id,
            name: item.name,
            image: null, // Placeholder for image
            createdAt: '', // Placeholder for createdAt
            updatedAt: item.updated_at,
            categories: defaultProductCategories // Default categories
          }));

          setProducts(supabaseProducts);
          await simpleCrossBrowserStorage.saveProducts(supabaseProducts.map(p => ({
            ...p,
            categories: p.categories
          })));
          return; // Exit early if Supabase fetch is successful
        }
      }

      console.log('💾 Falling back to local storage');
      const storageProducts = await simpleCrossBrowserStorage.loadProducts();
      const productsWithCategories = storageProducts.map(product => ({
        ...product,
        categories: Array.isArray(product.categories) ? product.categories : defaultProductCategories
      }));
      setProducts(productsWithCategories);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
      updateStatus();
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

    // Save to Supabase first if available
    if (useSupabase && status.isOnline) {
      try {
        console.log('📡 Saving to Supabase...');
        const supabaseData = {
          id: updatedProduct.id,
          name: updatedProduct.name,
          image_url: updatedProduct.image,
          categories: updatedProduct.categories,
          created_at: updatedProduct.createdAt,
          updated_at: updatedProduct.updatedAt,
          user_id: null
        };

        const { error: supabaseError } = await supabase
          .from('products')
          .upsert(supabaseData);

        if (supabaseError) {
          console.error('❌ Supabase save error:', supabaseError);
        } else {
          console.log('✅ Saved to Supabase successfully');
        }
      } catch (err) {
        console.error('❌ Supabase save failed:', err);
      }
    }

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
    // Delete from Supabase first if available
    if (useSupabase && status.isOnline) {
      try {
        console.log('📡 Deleting from Supabase...');
        const { error: supabaseError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (supabaseError) {
          console.error('❌ Supabase delete error:', supabaseError);
        } else {
          console.log('✅ Deleted from Supabase successfully');
        }
      } catch (err) {
        console.error('❌ Supabase delete failed:', err);
      }
    }

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
    status,
    useSupabase,
    setUseSupabase
  };
};