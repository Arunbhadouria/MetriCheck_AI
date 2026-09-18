export interface OfflineInspection {
  id: string;
  inspectionType: string;
  jurisdictionState: string;
  jurisdictionDistrict: string;
  jurisdictionZone: string;
  marketName: string;
  shopName: string;
  shopkeeperName: string;
  licenseNumber: string;
  locationAddress: string;
  images: Array<{ id: string; dataUrl: string }>;
  timestamp: string;
  synced: boolean;
}

const DB_NAME = 'MetriCheckOfflineDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('inspections')) {
        db.createObjectStore('inspections', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineInspection(data: OfflineInspection): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('inspections', 'readwrite');
  tx.objectStore('inspections').put(data);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineInspections(): Promise<OfflineInspection[]> {
  const db = await openDB();
  const tx = db.transaction('inspections', 'readonly');
  const request = tx.objectStore('inspections').getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
