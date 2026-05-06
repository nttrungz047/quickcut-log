// ============================================================
// screens/history.js
// ============================================================

import { state } from '../state.js';
import { fmtMoney, fmtDate, fmtTime, toDateKey } from '../utils.js';
import { openDetailModal } from '../components/detail.js';
import { loadLazyImages } from '../components/lazy-img.js';

const FILTERS = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7days', label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'all', label: 'Tất cả' },
];

export function renderFilterBar() {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = FILTERS.map(f => `
    <button class="filter-chip ${state.historyFilter === f.key ? 'active' : ''}"
            style="${state.historyFilter === f.key
      ? 'background:#fbbf24;border-color:#fbbf24;color:#18181b'
      : 'border-color:#e4e4e7;color:#71717a'}"
            onclick="APP.setHistoryFilter('${f.key}')">
      ${f.label}
    </button>`).join('');
}

export function renderHistory() {
  renderFilterBar();
  const now = new Date();
  const todayKey = toDateKey(now);

  const filtered = state.sessions.filter(s => {
    const d = new Date(s.datetime);
    switch (state.historyFilter) {
      case 'today': return toDateKey(d) === todayKey;
      case '7days': return (now - d) / 86400000 < 7;
      case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      default: return true;
    }
  }).sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  const list = document.getElementById('history-list');

  if (!filtered.length) {
    list.innerHTML = `
      <div class="flex flex-col items-center gap-3 py-16 text-zinc-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".4">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p class="text-sm">Không có lượt nào</p>
      </div>`;
    return;
  }

  // Group by date
  const groups = {};
  filtered.forEach(s => {
    const dk = toDateKey(s.datetime);
    if (!groups[dk]) groups[dk] = [];
    groups[dk].push(s);
  });

  list.innerHTML = Object.entries(groups).map(([dk, sessions]) => {
    const dayRevenue = sessions.reduce((a, s) => a + s.totalAmount, 0);
    const dateLabel = dk === todayKey ? 'Hôm nay' : fmtDate(sessions[0].datetime);

    return `
      <div class="px-4 pt-4 pb-1.5 flex items-center justify-between">
        <p class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">${dateLabel}</p>
        <p class="text-xs font-bold font-mono text-amber-500">${fmtMoney(dayRevenue)} · ${sessions.length} lượt</p>
      </div>
      ${sessions.map(s => sessionRowHTML(s)).join('')}`;
  }).join('');

  // Attach click handlers
  list.querySelectorAll('[data-session-id]').forEach(el => {
    el.addEventListener('click', () => openDetailModal(el.dataset.sessionId));
  });

  loadLazyImages();
}

function sessionRowHTML(s) {
  const srvNames = s.services
    .map(x => {
      const svc = state.services.find(sv => sv.id === x.serviceId);
      return svc ? (x.qty > 1 ? `${svc.name}×${x.qty}` : svc.name) : null;
    })
    .filter(Boolean).join(', ');

  const thumb = s.imageIds && s.imageIds.length
    ? `<img src="" data-image-id="${s.imageIds[0]}" alt=""
            class="w-11 h-11 rounded-xl object-cover lazy-img bg-zinc-200 dark:bg-zinc-700">`
    : `<div class="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
         </svg>
       </div>`;

  return `
    <div class="flex items-center gap-3 mx-4 mb-2
                bg-white dark:bg-zinc-900
                border border-zinc-200 dark:border-zinc-800
                rounded-xl p-3 cursor-pointer
                transition-[border-color,transform] active:scale-[.98] active:border-amber-400"
         data-session-id="${s.id}">
      <div class="w-11 h-11 rounded-xl overflow-hidden shrink-0">${thumb}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">${srvNames || '—'}</p>
        <p class="text-xs text-zinc-400">${fmtTime(s.datetime)}</p>
      </div>
      <p class="text-sm font-bold font-mono text-amber-500 dark:text-amber-400 shrink-0">${fmtMoney(s.totalAmount)}</p>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
}
