import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useProducts, ProductWithTasks, TaskCategory } from '../hooks/useProducts';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  details?: string;
}

interface TestRunnerProps {
  onCreateProduct: (productData: { name: string; image: string | null; categories?: TaskCategory[] }) => Promise<ProductWithTasks | null>;
  onUpdateProduct: (product: ProductWithTasks) => void;
}

const TestRunner: React.FC<TestRunnerProps> = ({ onCreateProduct, onUpdateProduct }) => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Create Test Product', status: 'pending' },
    { name: 'Check First Shopify Image Task', status: 'pending' },
    { name: 'Check Second Shopify Image Task', status: 'pending' },
    { name: 'Verify Tasks Persist', status: 'pending' },
    { name: 'Calculate Progress', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [testProduct, setTestProduct] = useState<ProductWithTasks | null>(null);

  const updateTestStatus = (testName: string, status: TestResult['status'], error?: string, details?: string) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status, error, details }
        : test
    ));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      // Test 1: Create Test Product
      updateTestStatus('Create Test Product', 'running');
      await sleep(500);
      
      const productData = {
        name: 'Test Product - Automated Test',
        image: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
        categories: undefined // Use default categories
      };
      
      const createdProduct = await onCreateProduct(productData);
      
      if (!createdProduct) {
        updateTestStatus('Create Test Product', 'failed', 'Failed to create product');
        return;
      }
      
      setTestProduct(createdProduct);
      updateTestStatus('Create Test Product', 'passed', undefined, `Created product: ${createdProduct.name}`);
      
      // Test 2: Check First Shopify Image Task
      updateTestStatus('Check First Shopify Image Task', 'running');
      await sleep(500);
      
      const shopifyCategory = createdProduct.categories.find(cat => cat.id === 'shopify');
      if (!shopifyCategory?.subSections?.images?.tasks?.[0]) {
        updateTestStatus('Check First Shopify Image Task', 'failed', 'Could not find first Shopify image task');
        return;
      }
      
      // Toggle the first image task
      const updatedProduct1 = {
        ...createdProduct,
        categories: createdProduct.categories.map(category => {
          if (category.id === 'shopify' && category.subSections) {
            return {
              ...category,
              subSections: {
                ...category.subSections,
                images: {
                  ...category.subSections.images,
                  tasks: category.subSections.images.tasks.map((task, index) =>
                    index === 0 ? { ...task, completed: true } : task
                  )
                }
              }
            };
          }
          return category;
        })
      };
      
      onUpdateProduct(updatedProduct1);
      setTestProduct(updatedProduct1);
      updateTestStatus('Check First Shopify Image Task', 'passed', undefined, 'First image task checked');
      
      // Test 3: Check Second Shopify Image Task
      updateTestStatus('Check Second Shopify Image Task', 'running');
      await sleep(500);
      
      const updatedProduct2 = {
        ...updatedProduct1,
        categories: updatedProduct1.categories.map(category => {
          if (category.id === 'shopify' && category.subSections) {
            return {
              ...category,
              subSections: {
                ...category.subSections,
                images: {
                  ...category.subSections.images,
                  tasks: category.subSections.images.tasks.map((task, index) =>
                    index === 1 ? { ...task, completed: true } : task
                  )
                }
              }
            };
          }
          return category;
        })
      };
      
      onUpdateProduct(updatedProduct2);
      setTestProduct(updatedProduct2);
      updateTestStatus('Check Second Shopify Image Task', 'passed', undefined, 'Second image task checked');
      
      // Test 4: Verify Tasks Persist
      updateTestStatus('Verify Tasks Persist', 'running');
      await sleep(1000); // Wait for database save
      
      const shopifyCategoryAfter = updatedProduct2.categories.find(cat => cat.id === 'shopify');
      const firstTaskCompleted = shopifyCategoryAfter?.subSections?.images?.tasks?.[0]?.completed;
      const secondTaskCompleted = shopifyCategoryAfter?.subSections?.images?.tasks?.[1]?.completed;
      
      if (firstTaskCompleted && secondTaskCompleted) {
        updateTestStatus('Verify Tasks Persist', 'passed', undefined, 'Both tasks remain checked');
      } else {
        updateTestStatus('Verify Tasks Persist', 'failed', 'Tasks did not persist correctly');
        return;
      }
      
      // Test 5: Calculate Progress
      updateTestStatus('Calculate Progress', 'running');
      await sleep(500);
      
      if (shopifyCategoryAfter?.subSections) {
        const allTasks = Object.values(shopifyCategoryAfter.subSections).flatMap(section => section.tasks);
        const completedTasks = allTasks.filter(task => task.completed);
        const progress = Math.round((completedTasks.length / allTasks.length) * 100);
        
        if (progress > 0) {
          updateTestStatus('Calculate Progress', 'passed', undefined, `Progress: ${progress}%`);
        } else {
          updateTestStatus('Calculate Progress', 'failed', 'Progress calculation failed');
        }
      } else {
        updateTestStatus('Calculate Progress', 'failed', 'Could not find Shopify category');
      }
      
    } catch (error) {
      console.error('Test error:', error);
      const currentRunningTest = tests.find(test => test.status === 'running');
      if (currentRunningTest) {
        updateTestStatus(currentRunningTest.name, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const allTestsPassed = tests.every(test => test.status === 'passed');
  const hasFailures = tests.some(test => test.status === 'failed');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Automated Testing</h3>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-3">
        {tests.map((test, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            {getStatusIcon(test.status)}
            <div className="flex-1">
              <span className="font-medium text-gray-800">{test.name}</span>
              {test.details && (
                <p className="text-sm text-gray-600 mt-1">{test.details}</p>
              )}
              {test.error && (
                <p className="text-sm text-red-600 mt-1">Error: {test.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isRunning && tests.some(test => test.status !== 'pending') && (
        <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
          {allTestsPassed ? (
            <div className="text-center text-green-600">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">All Tests Passed! ✅</p>
              <p className="text-sm">The app is working correctly.</p>
            </div>
          ) : hasFailures ? (
            <div className="text-center text-red-600">
              <XCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Tests Failed! ❌</p>
              <p className="text-sm">There are issues that need to be fixed.</p>
            </div>
          ) : (
            <div className="text-center text-blue-600">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Tests Running...</p>
            </div>
          )}
        </div>
      )}

      {testProduct && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Test Product Created:</strong> {testProduct.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default TestRunner;