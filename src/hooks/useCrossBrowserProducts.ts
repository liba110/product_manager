import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { simpleCrossBrowserStorage, StorageProduct } from '../lib/simpleStorage';
import { defaultProductCategories, TaskCategory } from '../lib/productTemplates';
import { v4 as uuidv4 } from 'uuid';

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

  const callEdgeFunction = async (action: string, productId?: string, data?: any) => {
    const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdnpmYWlnZWN5ZGhneXFoaWhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI5NzAzNywiZXhwIjoyMDczODczMDM3fQ.ZjnbPwklxyTPOItYJyJlmD34O7bhAd9m20ep41JVKI8";

    const response = await fetch('https://glvzfaigecydhgyqhihq.supabase.co/functions/v1/manageProducts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ action, productId, data }),
    });

    const responseText = await response.text(); // Read the full response as text
    console.log("Edge Function Response:", responseText);

    if (!response.ok) {
      throw new Error(`Edge Function error: ${responseText}`);
    }

    return JSON.parse(responseText); // Parse the response as JSON
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading products...');
      console.log('🌐 Status:', status);
      console.log('🛠️ Use Supabase:', useSupabase);

      if (useSupabase) {
        console.log('📡 Trying Edge Function...');
        const products = await callEdgeFunction('fetch');
        console.log('✅ Edge Function data:', products.length, 'products');
        setProducts(products);
        // Exclude large image_url field when saving to localStorage
        const productsToStore = products.map(p => {
          const { image_url, ...rest } = p;
          return rest;
        });
        await simpleCrossBrowserStorage.saveProducts(productsToStore);
        return; // Exit early if Edge Function fetch is successful
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

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const generatedId = (product.id && isValidUUID(product.id)) ? product.id : uuidv4(); // Generate a valid UUID if no id is provided or if it's invalid
    console.log('🆔 Generated ID at start of saveProduct:', generatedId); // Log the generated ID at the start

    const updatedProduct: ProductWithTasks = {
      id: generatedId,
      name: product.name || 'Untitled Product',
      image: product.image || null,
      createdAt: product.createdAt || now,
      updatedAt: now,
      categories: productCategories
    };

    console.log('💾 Updated product before saving to Supabase:', updatedProduct); // Log the updated product before saving

    if (useSupabase) {
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

        console.log('🛠️ Supabase data being sent:', supabaseData); // Log the data being sent to Supabase
        //it works now
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

    console.log('🆔 Final ID before updating local state:', updatedProduct.id); // Log the final ID before updating local state

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
    if (useSupabase) {
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

  // Fetch image for a specific product
  const fetchProductImage = async (productId: string): Promise<string | null> => {
    try {
      const result = await callEdgeFunction('fetchImage', productId);
      return result?.image_url || null;
    } catch (err) {
      console.error('Error fetching product image:', err);
      return null;
    }
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
    fetchProductImage, // Add this to the returned object
    refreshProducts: loadProducts,
    status,
    useSupabase,
    setUseSupabase
  };
};