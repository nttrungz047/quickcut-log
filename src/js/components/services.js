// ============================================================
// components/services.js  –  quản lý dịch vụ
// ============================================================

import { state } from '../state.js';
import { fmtMoney, uuid, downloadJSON } from '../utils.js';
import { dbPut, dbDel } from '../db.js';
import { showToast } from '../toast.js';

/* ── open / close ───────────────────────────────────────── */
export function openServiceModal() {
  renderServiceManageList();
  document.getElementById('service-modal').classList.add('open');
}

export function closeServiceModal() {
  document.getElementById('service-modal').classList.remove('open');
}

/* ── render list ─────────────────────────────────────────── */
export function renderServiceManageList() {
  const list = document.getElementById('service-manage-list');
  if (!state.services.length) {
    list.innerHTML = `<p class="text-sm text-zinc-400 text-center py-4">Chưa có dịch vụ nào</p>`;
    return;
  }

  list.innerHTML = state.services.map(svc => `
    <div class="flex items-center gap-2 mb-2.5">
      <div class="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2.5">
        <span class="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">${svc.name}</span>
        <span class="text-sm font-bold font-mono text-amber-500">${fmtMoney(svc.price)}</span>
      </div>
      <button onclick="APP.editServiceInline('${svc.id}')"
        class="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button onclick="APP.deleteService('${svc.id}')"
        class="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
        </svg>
      </button>
    </div>`).join('');
}

/* ── add service ─────────────────────────────────────────── */
export async function addService() {
  const nameEl = document.getElementById('new-srv-name');
  const priceEl = document.getElementById('new-srv-price');
  const name = nameEl.value.trim();
  const price = parseInt(priceEl.value) * 1000 || parseInt(priceEl.value) || 0;

  if (!name) return showToast('⚠️ Nhập tên dịch vụ');
  if (!price) return showToast('⚠️ Nhập giá dịch vụ');

  const svc = { id: uuid(), name, price };
  await dbPut('services', svc);
  state.services.push(svc);

  nameEl.value = '';
  priceEl.value = '';
  renderServiceManageList();
  showToast('✅ Đã thêm dịch vụ');
}

/* ── edit service inline ─────────────────────────────────── */
export function editServiceInline(svcId) {
  const svc = state.services.find(s => s.id === svcId);
  if (!svc) return;

  const newName = prompt('Tên dịch vụ:', svc.name);
  if (newName === null) return;
  const rawPrice = prompt('Giá (ví dụ: 50000 hoặc 50k):', svc.price);
  if (rawPrice === null) return;

  const price = parsePrice(rawPrice);
  if (!newName.trim() || !price) return showToast('⚠️ Dữ liệu không hợp lệ');

  svc.name = newName.trim();
  svc.price = price;
  dbPut('services', svc);
  renderServiceManageList();
  showToast('✅ Đã cập nhật dịch vụ');
}

/* ── delete service ──────────────────────────────────────── */
export async function deleteService(svcId) {
  if (!confirm('Xóa dịch vụ này?')) return;
  await dbDel('services', svcId);
  state.services = state.services.filter(s => s.id !== svcId);
  renderServiceManageList();
  showToast('🗑️ Đã xóa dịch vụ');
}

/* ── export services ─────────────────────────────────────── */
export function exportServices() {
  if (!state.services.length) return showToast('⚠️ Chưa có dịch vụ nào');
  const date = new Date().toISOString().slice(0, 10);
  downloadJSON({ version: 2, type: 'services', exportedAt: new Date().toISOString(), services: state.services },
    `quickcut-services-${date}.json`);
  showToast('📁 Đã xuất danh sách dịch vụ');
}

/* ── import services ─────────────────────────────────────── */
export function importServices() {
  document.getElementById('import-services-input').click();
}

export async function handleImportServices(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const list = json.services || json; // support array or wrapped
    if (!Array.isArray(list)) throw new Error('Invalid format');

    let added = 0;
    for (const svc of list) {
      if (!svc.id || !svc.name || !svc.price) continue;
      const exists = state.services.find(s => s.id === svc.id);
      if (!exists) {
        await dbPut('services', svc);
        state.services.push(svc);
        added++;
      }
    }
    renderServiceManageList();
    showToast(`✅ Đã nhập ${added} dịch vụ mới`);
  } catch {
    showToast('❌ File không hợp lệ');
  }
  e.target.value = '';
}

/* ── helper ──────────────────────────────────────────────── */
function parsePrice(raw) {
  const s = String(raw).trim().toLowerCase().replace(/\./g, '');
  if (s.endsWith('k')) return parseFloat(s) * 1000;
  if (s.endsWith('m')) return parseFloat(s) * 1000000;
  return parseInt(s) || 0;
}
