// ============================================================
// components/data-io.js  –  sao lưu / khôi phục lượt khách
// ============================================================

import { state } from '../state.js';
import { downloadJSON } from '../utils.js';
import { dbPut, dbGet, dbClear, dbGetAll } from '../db.js';
import { showToast } from '../toast.js';
import { renderHome } from '../screens/home.js';
import { renderHistory } from '../screens/history.js';
import { renderSummary } from '../screens/summary.js';

/* ── export sessions ─────────────────────────────────────── */
export async function exportSessions() {
  if (!state.sessions.length) return showToast('⚠️ Chưa có lượt nào để sao lưu');

  // Also bundle images
  const imageMap = {};
  for (const session of state.sessions) {
    if (!session.imageIds) continue;
    for (const id of session.imageIds) {
      if (!imageMap[id]) {
        const img = await dbGet('images', id).catch(() => null);
        if (img) imageMap[id] = img.data;
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  downloadJSON({
    version: 2,
    type: 'sessions',
    exportedAt: new Date().toISOString(),
    sessions: state.sessions,
    images: imageMap,
  }, `quickcut-backup-${date}.json`);

  showToast(`📁 Đã sao lưu ${state.sessions.length} lượt`);
}

/* ── import sessions ─────────────────────────────────────── */
export function importSessions() {
  document.getElementById('import-sessions-input').click();
}

export async function handleImportSessions(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const sessions = json.sessions || (Array.isArray(json) ? json : []);
    const images = json.images || {};

    let addedSessions = 0;
    let addedImages = 0;

    // Restore images
    for (const [id, data] of Object.entries(images)) {
      const exists = await dbGet('images', id).catch(() => null);
      if (!exists) {
        await dbPut('images', { id, data });
        addedImages++;
      }
    }

    // Restore sessions
    for (const s of sessions) {
      if (!s.id || !s.datetime) continue;
      const exists = state.sessions.find(x => x.id === s.id);
      if (!exists) {
        await dbPut('sessions', s);
        state.sessions.push(s);
        addedSessions++;
      }
    }

    renderHome();
    renderHistory();
    renderSummary();
    showToast(`✅ Đã nhập ${addedSessions} lượt, ${addedImages} ảnh`);
  } catch {
    showToast('❌ File backup không hợp lệ');
  }

  e.target.value = '';
}

/* ── clear all ───────────────────────────────────────────── */
export async function clearAllData() {
  if (!confirm('XÓA TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác!')) return;
  if (!confirm('Xác nhận lần 2: Xóa tất cả lượt khách và ảnh?')) return;

  await dbClear('sessions');
  await dbClear('images');
  state.sessions = [];

  renderHome();
  renderHistory();
  renderSummary();
  showToast('🗑️ Đã xóa toàn bộ dữ liệu');
}
