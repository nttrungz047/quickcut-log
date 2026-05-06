// ============================================================
// lazy-img.js  –  load images từ IndexedDB vào <img> tags
// ============================================================

import { dbGet } from '../db.js';

const _cache = new Map();

export async function loadLazyImages() {
  const imgs = document.querySelectorAll('img.lazy-img[data-image-id]');
  for (const img of imgs) {
    const id = img.dataset.imageId;
    if (!id) continue;
    if (_cache.has(id)) {
      img.src = _cache.get(id);
      continue;
    }
    try {
      const record = await dbGet('images', id);
      if (record) {
        _cache.set(id, record.data);
        img.src = record.data;
      }
    } catch { /* skip */ }
  }
}
