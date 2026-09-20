/**
 * MetriCheck AI - Scoped Citizen Storage Service
 * Isolates citizen scan history strictly by authenticated citizen phone number.
 * Prevents demo scan data from automatically leaking into newly registered citizen accounts.
 */

export interface CitizenScanRecord {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  printedMrp: number;
  stickerPrice?: number;
  expiryDate?: string;
  violations?: string[];
  status: 'PASS' | 'VIOLATION' | 'WARNING';
  storeName?: string;
  scannedAt: string;
  isDemo?: boolean;
}

export const DEMO_CITIZEN_HISTORY: CitizenScanRecord[] = [
  {
    id: 'hist_demo_01',
    name: 'Lays Classic Salted Potato Chips 50g',
    brand: 'Lays / PepsiCo',
    barcode: '8901491101831',
    printedMrp: 20,
    stickerPrice: 25,
    expiryDate: '2026-11-20',
    violations: ['DUAL_MRP_STICKER', 'SECTION_36_OVERCHARGING'],
    status: 'VIOLATION',
    storeName: 'गुप्ता किराना एवं जनरल स्टोर्स, विजय नगर',
    scannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isDemo: true
  },
  {
    id: 'hist_demo_02',
    name: 'Amul Taaza Homogenised Toned Milk 1L',
    brand: 'Amul',
    barcode: '8901262010054',
    printedMrp: 54,
    stickerPrice: 58,
    expiryDate: '2026-09-24',
    violations: ['SECTION_36_OVERCHARGING'],
    status: 'VIOLATION',
    storeName: 'दैनिक डेयरी एवं प्रोविजन, इंदौर',
    scannedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isDemo: true
  },
  {
    id: 'hist_demo_03',
    name: 'Parle-G Gold Glucose Biscuits 100g',
    brand: 'Parle Products',
    barcode: '8901719101019',
    printedMrp: 10,
    expiryDate: '2026-12-30',
    violations: [],
    status: 'PASS',
    storeName: 'अपना बाजार, इंदौर',
    scannedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isDemo: true
  }
];

export function getActiveCitizenPhone(): string | null {
  try {
    const rawUser = localStorage.getItem('metricheck_citizen_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.phone && typeof u.phone === 'string' && u.phone.trim()) {
        return u.phone.trim();
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

export function getCitizenHistoryKey(phone?: string | null): string {
  const targetPhone = phone && phone.trim() ? phone.trim() : getActiveCitizenPhone();
  if (targetPhone) {
    return `metricheck_citizen_history_${targetPhone}`;
  }
  return 'metricheck_citizen_history_anon';
}

export function getCitizenHistory(phone?: string | null): CitizenScanRecord[] {
  try {
    const key = getCitizenHistoryKey(phone);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse citizen scan history:', err);
    return [];
  }
}

export function saveCitizenHistory(items: CitizenScanRecord[], phone?: string | null): void {
  try {
    const key = getCitizenHistoryKey(phone);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save citizen scan history:', err);
  }
}

export function appendCitizenHistory(newItems: CitizenScanRecord[], phone?: string | null): CitizenScanRecord[] {
  try {
    const existing = getCitizenHistory(phone);
    const combined = [...newItems, ...existing];
    saveCitizenHistory(combined, phone);
    return combined;
  } catch (err) {
    console.warn('Failed to append citizen scan history:', err);
    return newItems;
  }
}

export function clearCitizenHistory(phone?: string | null): void {
  try {
    const key = getCitizenHistoryKey(phone);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear citizen scan history:', err);
  }
}
