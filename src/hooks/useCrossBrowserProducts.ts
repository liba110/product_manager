import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { simpleCrossBrowserStorage, StorageProduct } from '../lib/simpleStorage';
import { defaultProductCategories, TaskCategory } from '../lib/productTemplates';
import { v4 as uuidv4 } from 'uuid';

export interface ProductWithTasks extends Omit<StorageProduct, 'categories'> {
  categories: TaskCategory[];
  progress: number;
}

export const useCrossBrowserProducts = () => {
  const [products, setProducts] = useState<ProductWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({ isOnline: false, hasCloudSync: false });
  const [useSupabase, setUseSupabase] = useState(true);

  // Calculate progress from categories
  const calculateProgress = (categories: TaskCategory[]): number => {
    let totalTasks = 0;
    let completedTasks = 0;

    categories.forEach(category => {
      if (category.subSections) {
        Object.values(category.subSections).forEach(section => {
          totalTasks += section.tasks.length;
          completedTasks += section.tasks.filter(task => task.completed).length;
        });
      } else {
        totalTasks += category.tasks.length;
        completedTasks += category.tasks.filter(task => task.completed).length;
      }
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

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

      if (useSupabase) {
        console.log('📡 Trying Supabase...');
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('id, name, categories, created_at, updated_at, progress') // Fetch all necessary columns except image_url
          .order('updated_at', { ascending: false })
          .limit(100); // Limit to 100 products

        if (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
          setError('Failed to fetch products from Supabase');
        } else if (data) {
          console.log('✅ Supabase data:', data.length, 'products');
          const supabaseProducts = data.map(item => {
            // Merge stored categories with default categories to ensure labels and descriptions are present
            const mergedCategories = Array.isArray(item.categories) && item.categories.length > 0
              ? defaultProductCategories.map(defaultCat => {
                const storedCat = item.categories.find((c: any) => c.id === defaultCat.id);
                if (storedCat) {
                  // Merge stored category with default to ensure all task details are present
                  if (storedCat.subSections && defaultCat.subSections) {
                    const mergedSubSections: any = {};
                    Object.keys(defaultCat.subSections).forEach(sectionKey => {
                      const defaultSection = defaultCat.subSections![sectionKey];
                      const storedSection = storedCat.subSections[sectionKey];
                      if (storedSection) {
                        // Merge tasks in subsection
                        mergedSubSections[sectionKey] = {
                          ...defaultSection,
                          tasks: defaultSection.tasks.map(defaultTask => {
                            const storedTask = storedSection.tasks.find((t: any) => t.id === defaultTask.id);
                            return storedTask ? { ...defaultTask, completed: storedTask.completed || false } : defaultTask;
                          })
                        };
                      } else {
                        mergedSubSections[sectionKey] = defaultSection;
                      }
                    });
                    return {
                      ...defaultCat,
                      subSections: mergedSubSections
                    };
                  } else if (storedCat.tasks && defaultCat.tasks) {
                    // Merge regular tasks
                    return {
                      ...defaultCat,
                      tasks: defaultCat.tasks.map(defaultTask => {
                        const storedTask = storedCat.tasks.find((t: any) => t.id === defaultTask.id);
                        return storedTask ? { ...defaultTask, completed: storedTask.completed || false } : defaultTask;
                      })
                    };
                  }
                }
                return defaultCat;
              })
              : defaultProductCategories;

            return {
              id: item.id,
              name: item.name,
              image: null, // Don't fetch image initially - lazy load later
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              categories: mergedCategories,
              progress: item.progress || 0 // Use stored progress from database
            };
          });

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
      const productsWithCategories = storageProducts.map((product: StorageProduct) => ({
        ...product,
        categories: Array.isArray(product.categories) ? product.categories : defaultProductCategories,
        progress: product.progress || 0
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

    // Check if product already exists in the array
    const existingProduct = products.find(p => p.id === product.id);

    // Use existing ID if product exists, otherwise generate new UUID for truly new products
    const generatedId = existingProduct ? existingProduct.id : (product.id && isValidUUID(product.id) ? product.id : uuidv4());
    console.log('🆔 Generated ID at start of saveProduct:', generatedId, 'existing product:', !!existingProduct); // Log the generated ID at the start

    // Calculate progress from categories
    const progress = calculateProgress(productCategories);

    const updatedProduct: ProductWithTasks = {
      id: generatedId,
      name: product.name || 'Untitled Product',
      image: product.image || null,
      createdAt: product.createdAt || now,
      updatedAt: now,
      categories: productCategories,
      progress: progress
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
          user_id: null,
          progress: progress
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

  // Fetch product image lazily
  const fetchProductImage = async (productId: string): Promise<string | null> => {
    if (!useSupabase) return null;

    try {
      console.log('📡 Fetching image for product:', productId);
      const { data, error } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('❌ Error fetching image:', error);
        return null;
      }

      console.log('✅ Image fetched:', data?.image_url ? 'Found' : 'Not found');
      return data?.image_url || null;
    } catch (err) {
      console.error('❌ Failed to fetch image:', err);
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
    fetchProductImage,
    refreshProducts: loadProducts,
    status,
    useSupabase,
    setUseSupabase
  };
};