import React, { useState } from 'react';
import { Package, ChevronLeft } from 'lucide-react';
import { useCrossBrowserProducts, ProductWithTasks } from './hooks/useCrossBrowserProducts';
import { defaultProductCategories, TaskCategory } from './lib/productTemplates';
import NewProductApp from './components/NewProductApp';
import ExistingProductApp from './components/ExistingProductApp';
import DraftProductApp from './components/DraftProductApp';
import CodeExporter from './components/CodeExporter';

const App: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    saveProduct, 
    deleteProduct, 
    fetchProductDetails, 
    refreshProducts,
    status,
    useSupabase,
    setUseSupabase
  } = useCrossBrowserProducts();
  const [activeTab, setActiveTab] = useState<'new' | 'existing' | 'draft'>('new');
  const [newTabProducts, setNewTabProducts] = useState<ProductWithTasks[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'product'>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithTasks | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  const checkPassword = () => {
    if (password === 'Admin1') {
      setActiveTab('draft');
      setShowPasswordModal(false);
      setPassword('');
    } else {
      alert('Incorrect password. Access denied.');
      setPassword('');
    }
  };

  const handleDraftClick = () => {
    setShowPasswordModal(true);
  };

  const handleSelectProduct = async (product: ProductWithTasks) => {
    // If product already has categories, use it directly
    if (product.categories && product.categories.length > 0) {
      setSelectedProduct(product);
      setCurrentView('product');
      return;
    }
    
    // Otherwise, fetch full product details including categories
    try {
      const fullProduct = await fetchProductDetails(product.id);
      if (fullProduct) {
        setSelectedProduct(fullProduct);
        setCurrentView('product');
      } else {
        console.error('Failed to load product details');
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  const handleCreateProduct = async (productData?: { name: string; image: string | null; categories?: TaskCategory[] }) => {
    const productName = productData?.name || newProductName;
    const productImage = productData?.image || null;
    const productCategories = productData?.categories || defaultProductCategories;

    if (!productName.trim()) return;

    try {
      const newProduct = {
        id: `temp-${Date.now()}`,
        name: productName,
        image: productImage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database but don't wait for it to prevent blocking
      saveProduct(newProduct, productCategories).catch(console.error);
      
      // Add to New tab products list
      const productWithCategories: ProductWithTasks = {
        ...newProduct,
        categories: productCategories
      };
      setNewTabProducts(prev => [productWithCategories, ...prev]);
      
      setNewProductName('');
      setIsCreatingProduct(false);
      
      // Return the created product for the component to use
      return productWithCategories;
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  };

  const handleUpdateProduct = (updatedProduct: ProductWithTasks) => {
    // Update the product in the newTabProducts list
    setNewTabProducts(prev => 
      prev.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
    
    // Return a promise so the UI can show proper feedback
    return saveProduct(updatedProduct, updatedProduct.categories);
  };

  const handleDeleteProduct = (productId: string) => {
    // Remove from all local states
    setNewTabProducts(prev => prev.filter(p => p.id !== productId));
    
    // Remove from database
    deleteProduct(productId);
  };

  const toggleTask = (categoryId: string, taskId: string) => {
    if (!selectedProduct) return;

    const updatedProduct = {
      ...selectedProduct,
      categories: selectedProduct.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              tasks: category.tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              )
            }
          : category
      )
    };

    setSelectedProduct(updatedProduct);
    saveProduct(updatedProduct, updatedProduct.categories);
  };

  const getCategoryProgress = (category: TaskCategory) => {
    const completedTasks = category.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / category.tasks.length) * 100);
  };

  const renderProductView = () => {
    if (!selectedProduct) return null;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedProduct(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">{selectedProduct.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {selectedProduct.categories.map((category) => {
              const progress = getCategoryProgress(category);
              return (
                <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                          <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {task.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={refreshProducts}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'product') {
    return renderProductView();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Product Manager</h1>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {status.isOnline ? (useSupabase ? 'Online (Supabase)' : 'Online (Local)') : 'Offline (Local)'}
                </span>
                <label className="flex items-center gap-1 ml-4">
                  <input
                    type="checkbox"
                    checked={useSupabase}
                    onChange={(e) => setUseSupabase(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span className="text-xs text-gray-600">Use Supabase</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2">
              {(['new', 'draft'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => tab === 'draft' ? handleDraftClick() : setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'new' && (
        <NewProductApp
          products={newTabProducts}
          allProducts={products}
          onSelectProduct={(product) => {
            setSelectedProduct(product);
            setCurrentView('product');
          }}
          onDeleteProduct={handleDeleteProduct}
          onCreateProduct={handleCreateProduct}
          onUpdateProduct={handleUpdateProduct}
        />
      )}

      {activeTab === 'existing' && (
        <ExistingProductApp 
          products={products}
          onSelectProduct={handleSelectProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {activeTab === 'draft' && (
        <DraftProductApp 
          onCreateProduct={handleCreateProduct}
        />
      )}

      {/* Create Product Modal */}
      {isCreatingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Product</h3>
            <input
              type="text"
              placeholder="Enter product name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleCreateProduct()}
                disabled={!newProductName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingProduct(false);
                  setNewProductName('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal for Draft */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Access Required</h3>
            <p className="text-gray-600 mb-4">Enter password to access Draft section:</p>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={checkPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Access
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
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
};

export default App;