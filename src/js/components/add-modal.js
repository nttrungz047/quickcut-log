// ============================================================
// components/add-modal.js
// ============================================================

import { state } from '../state.js';
import { fmtMoney, uuid, resizeImage } from '../utils.js';
import { dbPut } from '../db.js';
import { showToast } from '../toast.js';
import { renderHome } from '../screens/home.js';
import { renderHistory } from '../screens/history.js';

/* ── open / close ───────────────────────────────────────── */
export function openAddModal() {
  state.addDraft = { selections: {}, photoDataURLs: [] };
  renderAddServiceGrid();
  renderAddPhotos();
  updateAddTotal();
  document.getElementById('add-modal').classList.add('open');
}

export function closeAddModal() {
  document.getElementById('add-modal').classList.remove('open');
}

/* ── service grid ────────────────────────────────────────── */
export function renderAddServiceGrid() {
  const grid = document.getElementById('add-service-grid');
  grid.innerHTML = state.services.map(svc => {
    const qty = state.addDraft.selections[svc.id] || 0;
    return serviceBtnHTML(svc, qty, 'add');
  }).join('');

  grid.querySelectorAll('[data-svc-id]').forEach(btn => {
    btn.addEventListener('click', () => toggleAddService(btn.dataset.svcId));
  });
  grid.querySelectorAll('[data-qty-down]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); adjustQty(btn.dataset.qtyDown, -1, 'add'); });
  });
  grid.querySelectorAll('[data-qty-up]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); adjustQty(btn.dataset.qtyUp, 1, 'add'); });
  });
}

function toggleAddService(svcId) {
  const qty = state.addDraft.selections[svcId] || 0;
  if (qty > 0) {
    delete state.addDraft.selections[svcId];
  } else {
    state.addDraft.selections[svcId] = 1;
  }
  renderAddServiceGrid();
  updateAddTotal();
}

function adjustQty(svcId, delta, mode) {
  const draft = mode === 'add' ? state.addDraft : state.editDraft;
  const grid = mode === 'add' ? 'add-service-grid' : 'edit-service-grid';
  const current = draft.selections[svcId] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete draft.selections[svcId];
  else draft.selections[svcId] = next;

  if (mode === 'add') { renderAddServiceGrid(); updateAddTotal(); }
  else { renderEditServiceGrid(); updateEditTotal(); }
}

export function serviceBtnHTML(svc, qty, mode) {
  const selected = qty > 0;
  const borderColor = selected ? '#fbbf24' : '';
  const bgColor = selected ? (document.documentElement.classList.contains('dark') ? 'rgba(251,191,36,.1)' : '#fffbeb') : '';

  return `
    <div class="srv-btn-item ${selected ? 'border-amber-400' : 'border-zinc-200 dark:border-zinc-700'}"
         style="${selected ? `border-color:#fbbf24;background:${bgColor}` : ''}"
         data-svc-id="${svc.id}">
      <div class="flex items-center justify-between mb-1 pointer-events-none">
        <span class="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[80%]">${svc.name}</span>
        ${selected ? `<span class="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[9px] text-zinc-900 font-bold shrink-0">✓</span>` : ''}
      </div>
      <p class="text-xs text-zinc-400 pointer-events-none">${fmtMoney(svc.price)}</p>
      ${selected ? `
        <div class="flex items-center gap-2 mt-2 pointer-events-auto">
          <button data-qty-down="${svc.id}"
            class="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 text-sm font-bold">−</button>
          <span class="flex-1 text-center text-sm font-bold font-mono text-amber-500">${qty}</span>
          <button data-qty-up="${svc.id}"
            class="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center text-zinc-900 text-sm font-bold">+</button>
        </div>` : ''}
    </div>`;
}

/* ── photos ─────────────────────────────────────────────── */
export async function handleAddPhoto(e) {
  const files = Array.from(e.target.files);
  for (const f of files) {
    const data = await resizeImage(f);
    state.addDraft.photoDataURLs.push(data);
  }
  e.target.value = '';
  renderAddPhotos();
}

function renderAddPhotos() {
  const row = document.getElementById('add-photo-row');
  const existing = state.addDraft.photoDataURLs.map((src, i) => `
    <div class="photo-thumb-wrap">
      <img src="${src}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:10px">
      <button onclick="APP.removeAddPhoto(${i})"
        style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#ef4444;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:bold;line-height:1">✕</button>
    </div>`).join('');

  // Keep the label (add button) first, then thumbnails
  const label = row.querySelector('label');
  row.innerHTML = '';
  row.appendChild(label);
  label.insertAdjacentHTML('afterend', existing);
}

export function removeAddPhoto(idx) {
  state.addDraft.photoDataURLs.splice(idx, 1);
  renderAddPhotos();
}

/* ── total ───────────────────────────────────────────────── */
export function updateAddTotal() {
  const total = calcTotal(state.addDraft.selections, state.services);
  document.getElementById('add-total').textContent = fmtMoney(total);
  const btn = document.getElementById('add-save-btn');
  const hasServices = Object.keys(state.addDraft.selections).length > 0;
  btn.disabled = !hasServices;
  btn.style.opacity = hasServices ? '1' : '0.4';
  btn.style.cursor = hasServices ? 'pointer' : 'not-allowed';
}

/* ── save ────────────────────────────────────────────────── */
export async function saveSession() {
  const { selections, photoDataURLs } = state.addDraft;
  if (!Object.keys(selections).length) return;

  const services = Object.entries(selections).map(([serviceId, qty]) => ({ serviceId, qty }));
  const total = calcTotal(selections, state.services);

  // Save images
  const imageIds = [];
  const { dbPut: _dbPut } = await import('../db.js');
  for (const data of photoDataURLs) {
    const id = uuid();
    await dbPut('images', { id, data });
    imageIds.push(id);
  }

  const session = {
    id: uuid(),
    datetime: new Date().toISOString(),
    services,
    totalAmount: total,
    imageIds,
  };

  await dbPut('sessions', session);
  state.sessions.push(session);

  closeAddModal();
  renderHome();
  renderHistory();
  showToast('✅ Đã lưu lượt khách!');
}

/* ── edit helpers (shared) ───────────────────────────────── */
export function renderEditServiceGrid() {
  const grid = document.getElementById('edit-service-grid');
  grid.innerHTML = state.services.map(svc => {
    const qty = state.editDraft.selections[svc.id] || 0;
    return serviceBtnHTML(svc, qty, 'edit');
  }).join('');

  grid.querySelectorAll('[data-svc-id]').forEach(btn => {
    btn.addEventListener('click', () => toggleEditService(btn.dataset.svcId));
  });
  grid.querySelectorAll('[data-qty-down]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); adjustQty(btn.dataset.qtyDown, -1, 'edit'); });
  });
  grid.querySelectorAll('[data-qty-up]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); adjustQty(btn.dataset.qtyUp, 1, 'edit'); });
  });
}

function toggleEditService(svcId) {
  const qty = state.editDraft.selections[svcId] || 0;
  if (qty > 0) delete state.editDraft.selections[svcId];
  else state.editDraft.selections[svcId] = 1;
  renderEditServiceGrid();
  updateEditTotal();
}

export function updateEditTotal() {
  const total = calcTotal(state.editDraft.selections, state.services);
  document.getElementById('edit-total').textContent = fmtMoney(total);
}

/* ── util ────────────────────────────────────────────────── */
export function calcTotal(selections, services) {
  return Object.entries(selections).reduce((sum, [id, qty]) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc ? svc.price * qty : 0);
  }, 0);
}
