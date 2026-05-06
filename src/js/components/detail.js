// ============================================================
// components/detail.js  –  xem chi tiết + sửa + xóa
// ============================================================

import { state } from '../state.js';
import { fmtMoney, fmtDateFull, fmtTime } from '../utils.js';
import { dbDel, dbGet, dbPut } from '../db.js';
import { showToast } from '../toast.js';
import { renderHome } from '../screens/home.js';
import { renderHistory } from '../screens/history.js';
import { renderSummary } from '../screens/summary.js';
import {
  renderEditServiceGrid,
  updateEditTotal,
  calcTotal,
} from './add-modal.js';

let _currentSessionId = null;

/* ── open detail ─────────────────────────────────────────── */
export async function openDetailModal(sessionId) {
  _currentSessionId = sessionId;
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;

  document.getElementById('detail-title').textContent = fmtDateFull(session.datetime);

  const services = session.services.map(x => {
    const svc = state.services.find(s => s.id === x.serviceId);
    return svc
      ? `<div class="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
           <span class="text-sm text-zinc-700 dark:text-zinc-300">${svc.name}${x.qty > 1 ? ` ×${x.qty}` : ''}</span>
           <span class="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">${fmtMoney(svc.price * x.qty)}</span>
         </div>`
      : '';
  }).join('');

  // Load images
  let imagesHTML = '';
  if (session.imageIds && session.imageIds.length) {
    const imgs = await Promise.all(
      session.imageIds.map(id => dbGet('images', id).catch(() => null))
    );
    imagesHTML = `
      <p class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mt-4 mb-2">Ảnh kiểu tóc</p>
      <div class="flex gap-2 overflow-x-auto pb-1" style="scrollbar-width:none">
        ${imgs.filter(Boolean).map(img => `
          <img src="${img.data}" alt=""
               onclick="APP.openImgViewer('${img.id}')"
               class="w-24 h-24 object-cover rounded-xl shrink-0 cursor-zoom-in border border-zinc-200 dark:border-zinc-800">`
    ).join('')}
      </div>`;
  }

  document.getElementById('detail-body').innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <p class="text-xs text-zinc-400">${fmtTime(session.datetime)}</p>
      <p class="text-2xl font-bold font-mono text-amber-500 dark:text-amber-400">${fmtMoney(session.totalAmount)}</p>
    </div>
    <div class="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 mb-4">${services}</div>
    ${imagesHTML}
    <div class="flex flex-col gap-2.5 mt-5">
      <button onclick="APP.openEditModal('${session.id}')"
        class="w-full py-3.5 text-sm font-semibold rounded-xl
               bg-amber-400/10 border border-amber-400/30 text-amber-500 dark:text-amber-400
               transition-[background] hover:bg-amber-400/20">
        ✏️ Sửa lượt này
      </button>
      <button onclick="APP.deleteSession('${session.id}')"
        class="w-full py-3.5 text-sm font-semibold rounded-xl
               bg-red-500/10 border border-red-500/30 text-red-400
               transition-[background] hover:bg-red-500/20">
        🗑️ Xóa lượt này
      </button>
    </div>`;

  document.getElementById('detail-modal').classList.add('open');
}

export function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('open');
  _currentSessionId = null;
}

/* ── open edit ───────────────────────────────────────────── */
export function openEditModal(sessionId) {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;

  const dt = new Date(session.datetime);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

  state.editDraft = {
    sessionId,
    date: dateStr,
    time: timeStr,
    selections: Object.fromEntries(session.services.map(x => [x.serviceId, x.qty])),
  };

  document.getElementById('edit-date').value = dateStr;
  document.getElementById('edit-time').value = timeStr;
  renderEditServiceGrid();
  updateEditTotal();

  document.getElementById('edit-modal').classList.add('open');
}

export function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

/* ── save edit ───────────────────────────────────────────── */
export async function saveEditSession() {
  const { sessionId, selections, date, time } = state.editDraft;
  const dateVal = document.getElementById('edit-date').value || date;
  const timeVal = document.getElementById('edit-time').value || time;

  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;

  const datetime = new Date(`${dateVal}T${timeVal}`).toISOString();
  const services = Object.entries(selections).map(([serviceId, qty]) => ({ serviceId, qty }));
  const totalAmount = calcTotal(selections, state.services);

  const updated = { ...session, datetime, services, totalAmount };
  await dbPut('sessions', updated);

  const idx = state.sessions.findIndex(s => s.id === sessionId);
  if (idx !== -1) state.sessions[idx] = updated;

  closeEditModal();
  closeDetailModal();
  renderHome();
  renderHistory();
  renderSummary();
  showToast('✅ Đã cập nhật lượt khách!');
}

/* ── delete ──────────────────────────────────────────────── */
export async function deleteSession(sessionId) {
  if (!confirm('Xóa lượt khách này?')) return;

  const session = state.sessions.find(s => s.id === sessionId);
  if (session && session.imageIds) {
    for (const id of session.imageIds) {
      await dbDel('images', id).catch(() => { });
    }
  }

  await dbDel('sessions', sessionId);
  state.sessions = state.sessions.filter(s => s.id !== sessionId);

  closeDetailModal();
  renderHome();
  renderHistory();
  renderSummary();
  showToast('🗑️ Đã xóa lượt khách');
}

/* ── image viewer ────────────────────────────────────────── */
export async function openImgViewer(imageId) {
  const img = await dbGet('images', imageId).catch(() => null);
  if (!img) return;
  document.getElementById('img-viewer-img').src = img.data;
  document.getElementById('img-viewer').classList.add('open');
}

export function closeImgViewer() {
  document.getElementById('img-viewer').classList.remove('open');
  document.getElementById('img-viewer-img').src = '';
}
