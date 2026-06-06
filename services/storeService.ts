// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORE_ITEMS } from '@/constants/config';

export interface StoreItemOverride {
  id: string;
  cost: number;
  name?: string;
  description?: string;
  isLocked?: boolean;
}

const STORE_OVERRIDES_KEY = 'hawa_store_overrides_v2';
const STORE_LOCKS_KEY = 'hawa_store_locks_v1';
const STORE_NAMES_KEY = 'hawa_store_names_v1'; // owner-customized names

export async function getStoreOverrides(): Promise<Record<string, StoreItemOverride>> {
  try {
    const data = await AsyncStorage.getItem(STORE_OVERRIDES_KEY);
    if (!data) {
      const oldData = await AsyncStorage.getItem('hawa_store_overrides_v1');
      if (oldData) {
        await AsyncStorage.setItem(STORE_OVERRIDES_KEY, oldData);
        return JSON.parse(oldData);
      }
    }
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function getStoreLocks(): Promise<Record<string, boolean>> {
  try {
    const data = await AsyncStorage.getItem(STORE_LOCKS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function getStoreNames(): Promise<Record<string, string>> {
  try {
    const data = await AsyncStorage.getItem(STORE_NAMES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function updateStoreItemName(
  itemId: string,
  newName: string,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; error?: string }> {
  if (requesterRank !== 'owner') {
    return { success: false, error: 'فقط المالك يمكنه تغيير أسماء عناصر المتجر' };
  }
  const names = await getStoreNames();
  if (newName.trim()) {
    names[itemId] = newName.trim();
  } else {
    delete names[itemId];
  }
  await AsyncStorage.setItem(STORE_NAMES_KEY, JSON.stringify(names));
  return { success: true };
}

export async function resetStoreItemName(itemId: string): Promise<void> {
  const names = await getStoreNames();
  delete names[itemId];
  await AsyncStorage.setItem(STORE_NAMES_KEY, JSON.stringify(names));
}

export async function toggleStoreLock(
  itemId: string,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; isLocked?: boolean; error?: string }> {
  if (requesterRank !== 'owner') {
    return { success: false, error: 'فقط المالك يمكنه قفل/فتح عناصر المتجر' };
  }
  const locks = await getStoreLocks();
  locks[itemId] = !locks[itemId];
  await AsyncStorage.setItem(STORE_LOCKS_KEY, JSON.stringify(locks));
  return { success: true, isLocked: locks[itemId] };
}

export async function updateStoreItemPrice(
  itemId: string,
  newCost: number,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; error?: string }> {
  if (!['owner', 'legend', 'admin'].includes(requesterRank)) {
    return { success: false, error: 'ليس لديك صلاحية تعديل أسعار المتجر' };
  }
  const overrides = await getStoreOverrides();
  overrides[itemId] = { id: itemId, cost: newCost, ...(overrides[itemId] || {}) };
  await AsyncStorage.setItem(STORE_OVERRIDES_KEY, JSON.stringify(overrides));
  return { success: true };
}

export async function resetStoreItemPrice(itemId: string): Promise<void> {
  const overrides = await getStoreOverrides();
  delete overrides[itemId];
  await AsyncStorage.setItem(STORE_OVERRIDES_KEY, JSON.stringify(overrides));
}

export async function getEffectiveStoreItems() {
  const overrides = await getStoreOverrides();
  const locks = await getStoreLocks();
  const customNames = await getStoreNames();
  return STORE_ITEMS.map(item => ({
    ...item,
    cost: overrides[item.id]?.cost ?? item.cost,
    name: customNames[item.id] ?? overrides[item.id]?.name ?? item.name,
    originalName: item.name,
    description: overrides[item.id]?.description ?? item.description,
    originalCost: item.cost,
    isModified: !!overrides[item.id],
    isNameModified: !!customNames[item.id],
    isLocked: locks[item.id] === true,
  }));
}

export async function giftItemToUser(
  itemId: string,
  targetId: string,
  gifterId: string,
  gifterRank: string,
): Promise<{ success: boolean; error?: string }> {
  if (gifterRank !== 'owner' && gifterRank !== 'legend') {
    return { success: false, error: 'فقط المالك والأسطورة يمكنهم إهداء العناصر مجاناً' };
  }
  return { success: true };
}
