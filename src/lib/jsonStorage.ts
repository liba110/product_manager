// Simple cross-browser storage using JSONBin (free service)
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const BIN_ID = 'product-management-' + btoa(window.location.hostname).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);

export interface StorageProduct {
  id: string;
  name: string;
  image: string | null;
  categories: any[];
  createdAt: string;
  updatedAt: string;
}

class CrossBrowserStorage {
  private binId: string | null = null;
  private isOnline = navigator.onLine;

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

  // Get unique bin ID for this domain
  private async getBinId(): Promise<string> {
    if (this.binId) return this.binId;
    
    const stored = localStorage.getItem('jsonbin_id');
    if (stored) {
      this.binId = stored;
      return stored;
    }

    // Create new bin
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bin-Name': BIN_ID
        },
        body: JSON.stringify({ products: [] })
      });

      if (response.ok) {
        const data = await response.json();
        this.binId = data.metadata.id;
        localStorage.setItem('jsonbin_id', this.binId);
        return this.binId;
      }
    } catch (error) {
      console.log('Cloud storage not available, using local only');
    }

    return 'local-only';
  }

  // Save to localStorage (always works)
  private saveLocal(products: StorageProduct[]): void {
    try {
      localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
      console.error('Local storage failed:', error);
    }
  }

  // Load from localStorage
  private loadLocal(): StorageProduct[] {
    try {
      const data = localStorage.getItem('products');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Local storage read failed:', error);
      return [];
    }
  }

  // Save to cloud (if online)
  private async saveCloud(products: StorageProduct[]): Promise<void> {
    if (!this.isOnline) return;

    try {
      const binId = await this.getBinId();
      if (binId === 'local-only') return;

      await fetch(`${JSONBIN_BASE_URL}/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ products })
      });
    } catch (error) {
      console.log('Cloud sync failed, continuing with local storage');
    }
  }

  // Load from cloud (if online)
  private async loadCloud(): Promise<StorageProduct[] | null> {
    if (!this.isOnline) return null;

    try {
      const binId = await this.getBinId();
      if (binId === 'local-only') return null;

      const response = await fetch(`${JSONBIN_BASE_URL}/b/${binId}/latest`);
      if (response.ok) {
        const data = await response.json();
        return data.record?.products || [];
      }
    } catch (error) {
      console.log('Cloud load failed, using local storage');
    }

    return null;
  }

  // Public methods
  async loadProducts(): Promise<StorageProduct[]> {
    // Try cloud first, fallback to local
    const cloudProducts = await this.loadCloud();
    if (cloudProducts) {
      // Save to local as backup
      this.saveLocal(cloudProducts);
      return cloudProducts;
    }

    return this.loadLocal();
  }

  async saveProducts(products: StorageProduct[]): Promise<void> {
    // Always save locally first
    this.saveLocal(products);
    
    // Try to sync to cloud (non-blocking)
    this.saveCloud(products).catch(() => {
      // Ignore cloud errors, local storage is primary
    });
  }

  async syncFromCloud(): Promise<void> {
    const cloudProducts = await this.loadCloud();
    if (cloudProducts) {
      this.saveLocal(cloudProducts);
    }
  }

  getStatus(): { isOnline: boolean; hasCloudSync: boolean } {
    return {
      isOnline: this.isOnline,
      hasCloudSync: this.binId !== null && this.binId !== 'local-only'
    };
  }
}

export const crossBrowserStorage = new CrossBrowserStorage();