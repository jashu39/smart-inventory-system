import { openDB } from 'idb';
const dbPromise = openDB('smart-inventory-offline', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: '_id' });
    if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
  }
});
export async function cacheProducts(items) {
  const db = await dbPromise; const tx = db.transaction('products', 'readwrite');
  await tx.store.clear(); for (const item of items) await tx.store.put(item); await tx.done;
}
export async function readCachedProducts() { return (await dbPromise).getAll('products'); }
export async function queueChange(change) { return (await dbPromise).add('queue', change); }
export async function syncQueue(token) {
  if (!navigator.onLine || !token) return;
  const db = await dbPromise; const pending = await db.getAll('queue');
  for (const item of pending) {
    try {
      const res = await fetch(item.url, { method: item.method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: item.body ? JSON.stringify(item.body) : undefined });
      if (res.ok) await db.delete('queue', item.id);
    } catch { break; }
  }
}
