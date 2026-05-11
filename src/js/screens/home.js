// ============================================================
// screens/home.js
// ============================================================

import { state } from '../state.js';
import { fmtMoney, fmtTime, toDateKey, todayStr } from '../utils.js';
import { openDetailModal } from '../components/detail.js';
import { loadLazyImages } from '../components/lazy-img.js';

export function renderHome() {
  // Date heading
  const dateEl = document.getElementById('home-date');
  if (dateEl) dateEl.textContent = todayStr();

  const todayKey = toDateKey(new Date());
  const todaySessions = state.sessions.filter(s => toDateKey(s.datetime) === todayKey);

  const revenue = todaySessions.reduce((a, s) => a + s.totalAmount, 0);
  const count = todaySessions.length;
  const avg = count ? Math.round(revenue / count) : 0;

  document.getElementById('stat-revenue').textContent = fmtMoney(revenue);
  document.getElementById('stat-revenue-sub').textContent =
    count ? `${count} lượt · TB ${fmtMoney(avg)}` : 'Chưa có khách';
  document.getElementById('stat-count').textContent = count;
  document.getElementById('stat-avg').textContent = fmtMoney(avg);

  // Recent sessions (last 5)
  const list = document.getElementById('recent-list');
  const recent = [...state.sessions]
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    .slice(0, 5);

  if (!recent.length) {
    list.innerHTML = `
      <div class="flex flex-col items-center gap-3 py-14 text-zinc-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".4">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <p class="text-sm">Chưa có lượt nào hôm nay</p>
      </div>`;
    return;
  }

  list.innerHTML = recent.map(s => sessionCardHTML(s)).join('');
  list.querySelectorAll('[data-session-id]').forEach(el => {
    el.addEventListener('click', () => openDetailModal(el.dataset.sessionId));
  });

  loadLazyImages();
}

export function sessionCardHTML(s) {
  const srvNames = s.services
    .map(x => {
      const svc = state.services.find(sv => sv.id === x.serviceId);
      return svc ? (x.qty > 1 ? `${svc.name}×${x.qty}` : svc.name) : null;
    })
    .filter(Boolean)
    .join(', ');
  const thumb = s.imageIds && s.imageIds.length
    ? `<div class="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
         <img src="" data-image-id="${s.imageIds[0]}" alt="" class="w-full h-full object-cover lazy-img">
       </div>`
    : `<div class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400">
         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
         </svg>
       </div>`;

  return `
    <div class="flex items-center gap-3 mx-4 mb-2.5 p-3.5
                bg-white dark:bg-zinc-900
                border border-zinc-200 dark:border-zinc-800
                rounded-xl cursor-pointer
                transition-[border-color,transform] active:scale-[.98] active:border-amber-400"
         data-session-id="${s.id}">
      ${thumb}
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">${srvNames || 'Không có dịch vụ'}</p>
        <p class="text-xs text-zinc-400 mt-0.5">${fmtTime(s.datetime)}</p>
      </div>
      <p class="text-base font-bold font-mono text-amber-500 dark:text-amber-400 shrink-0">${fmtMoney(s.totalAmount)}</p>
    </div>`;
}
