
import localforage from 'localforage';

const DB_NAME = 'matrix_game_db';
const STORES = {
  SAVES: 'saves',
  SETTINGS: 'settings',
  GALLERY: 'gallery',
  SLOTS_INFO: 'slots_info',
  ASSETS: 'assets',
  FANFIC_WORKS: 'fanfic_works',
  IMAGES: 'images'
};

// Create localforage instances for each store
const instances: Record<string, LocalForage> = {};
Object.values(STORES).forEach(storeName => {
  instances[storeName] = localforage.createInstance({
    name: DB_NAME,
    storeName: storeName
  });
});

export class IDBService {
  private getInstance(storeName: string): LocalForage {
    const instance = instances[storeName];
    if (!instance) {
      throw new Error(`Store ${storeName} not found`);
    }
    return instance;
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    const instance = this.getInstance(storeName);
    await instance.setItem(key, value);
  }

  async get(storeName: string, key: string): Promise<any> {
    const instance = this.getInstance(storeName);
    return await instance.getItem(key);
  }

  async delete(storeName: string, key: string): Promise<void> {
    const instance = this.getInstance(storeName);
    await instance.removeItem(key);
  }

  async getAll(storeName: string): Promise<any[]> {
    const instance = this.getInstance(storeName);
    const results: any[] = [];
    await instance.iterate((value) => {
      results.push(value);
    });
    return results;
  }

  async getAllKeys(storeName: string): Promise<string[]> {
    const instance = this.getInstance(storeName);
    return await instance.keys();
  }

  async clear(storeName: string): Promise<void> {
    const instance = this.getInstance(storeName);
    await instance.clear();
  }
}

export const idbService = new IDBService();
export { STORES };
