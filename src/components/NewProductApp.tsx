import React, { useState } from 'react';
import { Package, ChevronLeft, Upload, Copy, Download, Trash2, CreditCard as Edit } from 'lucide-react';
import { ProductWithTasks } from '../hooks/useCrossBrowserProducts';
import { defaultProductCategories, TaskCategory } from '../lib/productTemplates';
import { useCrossBrowserProducts } from '../hooks/useCrossBrowserProducts';

interface NewProductAppProps {
  products: ProductWithTasks[];
  onDeleteProduct: (productId: string) => void;
  onCreateProduct: (productData: { name: string; image: string | null; categories?: TaskCategory[] }) => Promise<ProductWithTasks | null>;
  onUpdateProduct: (product: ProductWithTasks) => void;
  allProducts: ProductWithTasks[];
}

const NewProductApp: React.FC<NewProductAppProps> = ({
  products,
  onDeleteProduct,
  onCreateProduct,
  onUpdateProduct,
  allProducts
}) => {
  const { fetchProductImage } = useCrossBrowserProducts();

  const [currentView, setCurrentView] = useState<'main' | 'create' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productName, setProductName] = useState('New Product');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithTasks | null>(null);
  const [bcLink, setBcLink] = useState('');
  const [aaLink, setAaLink] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [pendingExportAction, setPendingExportAction] = useState<(() => void) | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Async handler for opening a product and fetching its image if needed
  const handleOpenProduct = async (product: ProductWithTasks) => {
    setImageLoading(true);
    setSelectedProduct(product);
    setProductName(product.name || 'New Product');
    setProductImage(product.image);
    setCurrentView('create'); // Change view immediately to show loading spinner
    window.scrollTo(0, 0); // Scroll to top when opening product

    // Fetch image lazily if not already loaded
    if (!product.image) {
      const imageUrl = await fetchProductImage(product.id);
      setProductImage(imageUrl);
      // Update the selected product with the fetched image
      setSelectedProduct(prev => prev ? { ...prev, image: imageUrl } : null);
    }

    setImageLoading(false);
  };

  const requireExportPassword = (action: () => void) => {
    setPendingExportAction(() => action);
    setShowExportPasswordModal(true);
  };

  const confirmExport = () => {
    if (exportPassword === 'Admin1' && pendingExportAction) {
      pendingExportAction();
      setShowExportPasswordModal(false);
      setExportPassword('');
      setPendingExportAction(null);
    } else if (exportPassword.trim() && exportPassword !== 'Admin1') {
      alert('Incorrect password. Please try again.');
      setExportPassword('');
    }
  };

  const toggleTask = async (categoryId: string, taskId: string, sectionKey?: string) => {
    if (!selectedProduct) return;

    const updatedCategories = selectedProduct.categories.map(category => {
      if (category.id !== categoryId) return category;

      if (sectionKey && category.subSections) {
        // Handle subsection tasks
        return {
          ...category,
          subSections: {
            ...category.subSections,
            [sectionKey]: {
              ...category.subSections[sectionKey],
              tasks: category.subSections[sectionKey].tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              )
            }
          }
        };
      } else {
        // Handle regular tasks
        return {
          ...category,
          tasks: category.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
    });

    // Calculate new progress after task toggle
    const tempProduct = { ...selectedProduct, categories: updatedCategories };
    const newProgress = getProductProgress(tempProduct);

    const updatedProduct = { ...tempProduct, progress: newProgress };
    setSelectedProduct(updatedProduct);

    // Save immediately and show status
    setSaveStatus('saving');
    try {
      const savedProduct = await onUpdateProduct(updatedProduct);
      // Update selectedProduct with the saved product that has the real UUID
      setSelectedProduct(savedProduct);

      // Show saved confirmation briefly
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
    } catch (error) {
      console.error('Error updating product:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setProductImage(imageData);

      // If we have a selected product, update it immediately
      if (selectedProduct) {
        const updatedProduct = { ...selectedProduct, image: imageData };
        setSelectedProduct(updatedProduct);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportAllProducts = () => {
    const data = allProducts.map(product => ({
      name: product.name,
      image: product.image,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      categories: product.categories
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-products.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportProduct = (product: ProductWithTasks) => {
    const data = {
      name: product.name,
      image: product.image,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      categories: product.categories
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getProductProgress = (product: ProductWithTasks) => {
    let totalTasks = 0;
    let completedTasks = 0;

    product.categories.forEach(category => {
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

  const getCategoryProgress = (category: TaskCategory) => {
    if (category.subSections) {
      const allTasks = Object.values(category.subSections).flatMap(section => section.tasks);
      const completedTasks = allTasks.filter(task => task.completed);
      return allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;
    }
    const completedTasks = category.tasks.filter(task => task.completed);
    return category.tasks.length > 0 ? Math.round((completedTasks.length / category.tasks.length) * 100) : 0;
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const confirmDelete = () => {
    if (productToDelete && deletePassword === 'Admin1') {
      onDeleteProduct(productToDelete);
      setShowDeleteModal(false);
      setProductToDelete(null);
      setDeletePassword('');
    } else if (deletePassword.trim() && deletePassword !== 'Admin1') {
      // Show error for wrong password but don't close modal
      alert('Incorrect password. Please try again.');
    }
  };

  const handleSaveProduct = async () => {
    if (saveStatus === 'saving') return; // Prevent multiple clicks

    setSaveStatus('saving');
    setSaveMessage('Saving product...');

    console.log('🚀 Creating product:', productName);

    try {
      if (selectedProduct) {
        // Update the existing product - recalculate progress
        const currentProgress = getProductProgress(selectedProduct);
        const updatedProduct = {
          ...selectedProduct,
          name: selectedProduct.name,
          image: selectedProduct.image || productImage,
          progress: currentProgress
        };
        setSelectedProduct(updatedProduct);
        await onUpdateProduct(updatedProduct);
        setSaveStatus('saved');
        setSaveMessage('Product saved successfully!');
      } else {
        // Create new product - initialize with 0 progress
        const productData = {
          name: productName,
          image: productImage,
          categories: defaultProductCategories,
          progress: 0
        };

        const newProduct = await onCreateProduct(productData);

        if (newProduct) {
          console.log('🔄 Updating product:', newProduct.name);
          setSaveStatus('saved');
          setSaveMessage('Product created and saved!');
        } else {
          setSaveStatus('error');
          setSaveMessage('Failed to create product. Please try again.');
        }
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error saving product:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save product. Please try again.');

      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  // Main page view
  if (currentView === 'main') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">All Products</p>
                <p className="text-xl font-semibold text-gray-800">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">New Product</p>
                <button
                  onClick={() => setCurrentView('create')}
                  className="text-xl font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Create
                </button>
                <p className="text-xl font-semibold text-gray-800">{allProducts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Products section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">All Products</h2>
            <button
              onClick={() => requireExportPassword(exportAllProducts)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProducts.map((product) => {
              const progress = product.progress || 0; // Use stored progress from database
              return (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Updated {new Date(product.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenProduct(product)}
                      disabled={imageLoading}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {imageLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        'Open'
                      )}
                    </button>
                    <button
                      onClick={() => requireExportPassword(() => exportProduct(product))}
                      className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setProductToDelete(product.id);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Password confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-4">Enter password to delete this product:</p>
              <input
                type="password"
                placeholder="Enter password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={!deletePassword.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Product
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export password confirmation modal */}
        {showExportPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Export Access Required</h3>
              <p className="text-gray-600 mb-4">Enter password to export data:</p>
              <input
                type="password"
                placeholder="Enter password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && confirmExport()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={confirmExport}
                  disabled={!exportPassword.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Export Data
                </button>
                <button
                  onClick={() => {
                    setShowExportPasswordModal(false);
                    setExportPassword('');
                    setPendingExportAction(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Create page view
  if (currentView === 'create') {
    if (imageLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      );
    }

    const progress = selectedProduct ? (selectedProduct.progress || 0) : 0; // Use stored progress from database

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCurrentView('main');
                  setSelectedProduct(null);
                  setProductName('New Product');
                  setProductImage(null);
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={selectedProduct ? selectedProduct.name : productName}
                    onChange={(e) => {
                      if (selectedProduct) {
                        setSelectedProduct({ ...selectedProduct, name: e.target.value });
                      } else {
                        setProductName(e.target.value);
                      }
                    }}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    className="text-3xl font-bold text-gray-800 bg-transparent border-b-2 border-blue-600 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-3xl font-bold text-gray-800 cursor-pointer hover:text-blue-600"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {selectedProduct ? selectedProduct.name : productName}
                  </h1>
                )}
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{progress}% Complete</span>
              {saveMessage && (
                <span className={`text-sm ${saveStatus === 'saved' ? 'text-green-600' :
                    saveStatus === 'error' ? 'text-red-600' :
                      'text-blue-600'
                  }`}>
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSaveProduct}
                disabled={saveStatus === 'saving'}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${saveStatus === 'saving'
                    ? 'bg-blue-500 text-white cursor-not-allowed'
                    : saveStatus === 'saved'
                      ? 'bg-green-600 text-white'
                      : saveStatus === 'error'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                {saveStatus === 'saving' && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {saveStatus === 'saved' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {saveStatus === 'error' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {saveStatus === 'saving' ? 'Saving...' :
                  saveStatus === 'saved' ? 'Saved!' :
                    saveStatus === 'error' ? 'Retry' :
                      'Save Product'}
              </button>
            </div>
          </div>

          {/* Image upload section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {(selectedProduct?.image || productImage) ? (
              <div className="relative">
                <img
                  src={selectedProduct?.image || productImage || ''}
                  alt="Product"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="replace-image"
                  />
                  <label
                    htmlFor="replace-image"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm"
                  >
                    Replace Image
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload product image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose Image
                </label>
              </div>
            )}
          </div>

          {/* Category boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {defaultProductCategories.map((category) => {
              const currentCategories = selectedProduct?.categories || defaultProductCategories;
              const categoryProgress = getCategoryProgress(currentCategories.find(c => c.id === category.id) || category);
              return (
                <div
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    // Initialize selectedProduct with default categories if it doesn't exist
                    if (!selectedProduct) {
                      setSelectedProduct({
                        id: `temp-${Date.now()}`,
                        name: productName,
                        image: productImage,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        categories: defaultProductCategories,
                        progress: 0
                      });
                    }
                    setCurrentView('category');
                  }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
                    <div className="text-2xl font-bold text-blue-600">{categoryProgress}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Category page view (e.g., Shopify)
  if (currentView === 'category' && selectedCategory) {
    const categories = selectedProduct?.categories || defaultProductCategories;
    const category = categories.find(cat => cat.id === selectedCategory);

    if (!category) return null;

    const progress = getCategoryProgress(category);

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('create')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{progress}% Complete</span>
            </div>
          </div>

          {/* Links section for Shopify */}
          {selectedCategory === 'shopify' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">BC Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter BC link"
                    value={bcLink}
                    onChange={(e) => setBcLink(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => copyLink(bcLink)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AA Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter AA link"
                    value={aaLink}
                    onChange={(e) => setAaLink(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => copyLink(aaLink)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task sections */}
          {category.subSections && Object.keys(category.subSections).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(category.subSections).map(([sectionKey, section]) => {
                const sectionProgress = section.tasks.filter(task => task.completed).length;
                const sectionTotal = section.tasks.length;
                const sectionPercent = sectionTotal > 0 ? Math.round((sectionProgress / sectionTotal) * 100) : 0;

                return (
                  <div key={sectionKey} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl">
                        {sectionKey === 'images' && '🖼️'}
                        {sectionKey === 'description' && '📝'}
                        {sectionKey === 'fields' && '⚙️'}
                        {sectionKey === 'links' && '🔗'}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800">{section.name}</h3>
                      <span className="ml-auto text-sm text-gray-600">
                        {sectionProgress}/{sectionTotal} ({sectionPercent}%)
                      </span>
                    </div>

                    <div className="space-y-4">
                      {section.tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(category.id, task.id, sectionKey)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium ${task.completed ? 'text-gray-600' : 'text-gray-800'}`}>
                              {task.label}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Regular category tasks
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="text-xl font-semibold text-gray-800">{category.name}</h3>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {category.tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(category.id, task.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? 'text-gray-600' : 'text-gray-800'}`}>
                        {task.label}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default NewProductApp;