import React, { useState } from 'react';
import { Package, Settings, ChevronRight, Download, Trash2 } from 'lucide-react';
import { ProductWithTasks } from '../hooks/useProducts';

interface ExistingProductAppProps {
  products: ProductWithTasks[];
  onSelectProduct: (product: ProductWithTasks) => void;
  onDeleteProduct: (productId: string) => void;
}

const ExistingProductApp: React.FC<ExistingProductAppProps> = ({ 
  products, 
  onSelectProduct, 
  onDeleteProduct 
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

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

  // Collection categories for the Quick Category Access
  const collectionCategories = [
    {
      name: 'Mailbox',
      items: ['Barn', 'Log Cabin', 'Stone', 'Animal', 'Unique', 'Lighthouse']
    },
    {
      name: 'Birdhouses',
      items: ['Traditional', 'Modern', 'Rustic', 'Decorative']
    },
    {
      name: 'Bird Feeders',
      items: ['Tube', 'Platform', 'Suet', 'Nectar']
    },
    {
      name: 'Garden Decor',
      items: ['Statues', 'Wind Chimes', 'Planters', 'Fountains']
    },
    {
      name: 'Outdoor Furniture',
      items: ['Benches', 'Tables', 'Chairs', 'Swings']
    }
  ];

  const getRecentProducts = () => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    return products.filter(product => 
      new Date(product.updatedAt) > sixtyDaysAgo
    ).slice(0, 10);
  };

  const getProductProgress = (product: ProductWithTasks) => {
    if (!product.categories || product.categories.length === 0) {
      return 0;
    }
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    product.categories.forEach(category => {
      totalTasks += category.tasks.length;
      completedTasks += category.tasks.filter(task => task.completed).length;
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const exportCollectionData = () => {
    const data = collectionCategories.map(category => ({
      category: category.name,
      items: category.items
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collections-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Recently Added Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recently Added Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {getRecentProducts().map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600">
                  Updated {new Date(product.updatedAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductToDelete(product.id);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Category Access - Only in Existing tab */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Quick Category Access</h2>
            <div className="flex gap-3">
              <button
                onClick={exportCollectionData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Settings className="w-4 h-4" />
                Manage Collections
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {collectionCategories.map((category) => (
              <div key={category.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                </div>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item}</span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                disabled={deletePassword !== 'Admin1'}
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
    </>
  );
};

export default ExistingProductApp;