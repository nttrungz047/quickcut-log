// ============================================================
// db.js  –  IndexedDB abstraction layer
// ============================================================

const DB_NAME = 'quickcut_db';
const DB_VER = 3; // bumped for v2

let _db = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sessions'))
        db.createObjectStore('sessions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('services'))
        db.createObjectStore('services', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('images'))
        db.createObjectStore('images', { keyPath: 'id' });
    };

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = _db.transaction(store, mode);
    const s = t.objectStore(store);
    const q = fn(s);
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
  });
}

export const dbGetAll = (store) => tx(store, 'readonly', s => s.getAll());
export const dbGet = (store, key) => tx(store, 'readonly', s => s.get(key));
export const dbPut = (store, val) => tx(store, 'readwrite', s => s.put(val));
export const dbDel = (store, key) => tx(store, 'readwrite', s => s.delete(key));
export const dbClear = (store) => tx(store, 'readwrite', s => s.clear());
