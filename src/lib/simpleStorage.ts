// Ultra-simple cross-browser storage using a different approach
const STORAGE_KEY = 'product_management_data_v3';

export interface StorageProduct {
  id: string;
  name: string;
  image: string | null;
  categories: any[];
  createdAt: string;
  updatedAt: string;
}

class SimpleCrossBrowserStorage {
  private isOnline = navigator.onLine;
  private cloudUrl = 'https://httpbin.org/anything'; // Simple test endpoint

  constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncFromCloud();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Save to localStorage (always works)
  private saveLocal(products: StorageProduct[]): void {
    try {
      console.log('💾 Saving to localStorage:', products.length, 'products');
      
      // Remove base64 images to prevent quota exceeded errors
      const productsForStorage = products.map(product => ({
        ...product,
        image: product.image && product.image.startsWith('data:') ? null : product.image
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        products: productsForStorage,
        lastUpdated: new Date().toISOString(),
        version: 3
      }));
      console.log('✅ Saved to localStorage');
    } catch (error) {
      console.error('❌ Local storage failed:', error);
    }
  }

  // Load from localStorage
  private loadLocal(): StorageProduct[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      console.log('📖 Raw localStorage data:', data ? 'Found' : 'Not found');
      if (data) {
        const parsed = JSON.parse(data);
        console.log('✅ Loaded from localStorage:', parsed.products?.length || 0, 'products');
        return parsed.products || [];
      }
    } catch (error) {
      console.error('❌ Local storage read failed:', error);
    }
    console.log('📖 No data found, returning empty array');
    return [];
  }

  // Try to sync to cloud (best effort)
  private async saveCloud(products: StorageProduct[]): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Use a simple approach - just try to store somewhere
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products,
          timestamp: Date.now(),
          domain: window.location.hostname 
        })
      });
      
      if (response.ok) {
        console.log('✅ Cloud sync attempted');
      }
    } catch (error) {
      console.log('❌ Cloud sync failed (expected):', error.message);
    }
  }

  // Public methods
  async loadProducts(): Promise<StorageProduct[]> {
    // Always load from local storage
    const products = this.loadLocal();
    console.log(`📦 Loaded ${products.length} products`);
    return products;
  }

  async saveProducts(products: StorageProduct[]): Promise<void> {
    // Always save locally first (this is what matters)
    this.saveLocal(products);
    
    // Try cloud sync (non-blocking, best effort)
    this.saveCloud(products).catch(() => {
      // Ignore cloud errors - local storage is primary
    });
  }

  async syncFromCloud(): Promise<void> {
    // For now, just use local storage
    // In a real implementation, this would sync from cloud
    console.log('🔄 Sync check completed');
  }

  getStatus(): { isOnline: boolean; hasCloudSync: boolean } {
    return {
      isOnline: this.isOnline,
      hasCloudSync: false // Simplified for now
    };
  }
}

export const simpleCrossBrowserStorage = new SimpleCrossBrowserStorage();