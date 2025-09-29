import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface DraftProductAppProps {
  onCreateProduct: (productData: {
    name: string;
    image: string | null;
    supplierInfo: {
      name: string;
      contact: string;
      price: string;
      leadTime: string;
    };
  }) => void;
}

const DraftProductApp: React.FC<DraftProductAppProps> = ({ onCreateProduct }) => {
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPrice, setSupplierPrice] = useState('');
  const [supplierLeadTime, setSupplierLeadTime] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewProductImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setNewProductImage(null);
  };

  const resetForm = () => {
    setNewProductName('');
    setNewProductImage(null);
    setSupplierName('');
    setSupplierContact('');
    setSupplierPrice('');
    setSupplierLeadTime('');
  };

  const handleCreateProduct = () => {
    if (!newProductName.trim()) return;

    onCreateProduct({
      name: newProductName,
      image: newProductImage,
      supplierInfo: {
        name: supplierName,
        contact: supplierContact,
        price: supplierPrice,
        leadTime: supplierLeadTime
      }
    });

    resetForm();
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Draft Product</h2>
      
      {/* Image Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Image</h3>
        
        {newProductImage ? (
          <div className="relative">
            <img
              src={newProductImage}
              alt="Product preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop an image here, or click to select</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
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

      {/* Product Name */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
        <input
          type="text"
          placeholder="Enter product name"
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Supplier Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Supplier name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Contact information"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Price"
            value={supplierPrice}
            onChange={(e) => setSupplierPrice(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Lead time"
            value={supplierLeadTime}
            onChange={(e) => setSupplierLeadTime(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleCreateProduct}
          disabled={!newProductName.trim()}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Create Product
        </button>
        <button
          onClick={resetForm}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default DraftProductApp;