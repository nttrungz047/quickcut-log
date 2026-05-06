// ============================================================
// screens/summary.js  –  thống kê 3 tab
// ============================================================

import { state } from '../state.js';
import { fmtMoney, fmtMoneyFull, toDateKey, toMonthKey } from '../utils.js';

/* ── tab switching ───────────────────────────────────────── */
export function renderSummaryTabs() {
  ['day', 'month', 'service'].forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    if (!btn) return;
    if (t === state.summaryTab) {
      btn.style.cssText = 'background:rgba(251,191,36,.15);color:#fbbf24;font-weight:700';
    } else {
      btn.style.cssText = 'background:none;color:#71717a;font-weight:500';
    }
  });
}

export function renderSummary() {
  renderSummaryTabs();
  switch (state.summaryTab) {
    case 'day': renderDayChart(); break;
    case 'month': renderMonthChart(); break;
    case 'service': renderServiceStats(); break;
  }
}

/* ── Day chart (14 ngày) ─────────────────────────────────── */
function renderDayChart() {
  const days = 14;
  const now = new Date();
  const buckets = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    buckets.push({ key: toDateKey(d), label: `${d.getDate()}/${d.getMonth() + 1}`, revenue: 0, count: 0 });
  }

  state.sessions.forEach(s => {
    const k = toDateKey(s.datetime);
    const b = buckets.find(x => x.key === k);
    if (b) { b.revenue += s.totalAmount; b.count++; }
  });

  const totalRevenue = buckets.reduce((a, b) => a + b.revenue, 0);
  const totalCount = buckets.reduce((a, b) => a + b.count, 0);
  const avgPerDay = totalRevenue / days;
  const todayRevenue = buckets[buckets.length - 1].revenue;
  const todayCount = buckets[buckets.length - 1].count;

  document.getElementById('summary-content').innerHTML = `
    ${summaryKPIs([
    { label: 'Hôm nay', value: fmtMoney(todayRevenue), sub: `${todayCount} lượt` },
    { label: '14 ngày', value: fmtMoney(totalRevenue), sub: `${totalCount} lượt` },
    { label: 'TB / ngày', value: fmtMoney(Math.round(avgPerDay)), sub: 'trung bình' },
  ])}
    <p class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Doanh thu 14 ngày qua</p>
    ${barChart(buckets, 'revenue', buckets.length - 1)}
  `;
}

/* ── Month chart (6 tháng) ───────────────────────────────── */
function renderMonthChart() {
  const months = 6;
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: toMonthKey(d),
      label: `T${d.getMonth() + 1}`,
      revenue: 0, count: 0,
    });
  }

  state.sessions.forEach(s => {
    const k = toMonthKey(s.datetime);
    const b = buckets.find(x => x.key === k);
    if (b) { b.revenue += s.totalAmount; b.count++; }
  });

  const totalRevenue = buckets.reduce((a, b) => a + b.revenue, 0);
  const totalCount = buckets.reduce((a, b) => a + b.count, 0);
  const thisMonth = buckets[buckets.length - 1];

  document.getElementById('summary-content').innerHTML = `
    ${summaryKPIs([
    { label: 'Tháng này', value: fmtMoney(thisMonth.revenue), sub: `${thisMonth.count} lượt` },
    { label: '6 tháng', value: fmtMoney(totalRevenue), sub: `${totalCount} lượt` },
    { label: 'TB / tháng', value: fmtMoney(Math.round(totalRevenue / months)), sub: 'trung bình' },
  ])}
    <p class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Doanh thu 6 tháng qua</p>
    ${barChart(buckets, 'revenue', buckets.length - 1)}
  `;
}

/* ── Service stats ───────────────────────────────────────── */
function renderServiceStats() {
  // Aggregate per service
  const map = {}; // serviceId -> { name, count, revenue }
  state.sessions.forEach(s => {
    s.services.forEach(x => {
      if (!map[x.serviceId]) {
        const svc = state.services.find(sv => sv.id === x.serviceId);
        map[x.serviceId] = { name: svc ? svc.name : 'Không xác định', count: 0, revenue: 0, price: svc ? svc.price : 0 };
      }
      map[x.serviceId].count += x.qty;
      map[x.serviceId].revenue += x.qty * map[x.serviceId].price;
    });
  });

  const rows = Object.values(map).sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const totalCount = rows.reduce((a, r) => a + r.count, 0);

  const maxRevenue = rows.length ? Math.max(...rows.map(r => r.revenue)) : 1;

  if (!rows.length) {
    document.getElementById('summary-content').innerHTML = emptyState('Chưa có dữ liệu dịch vụ');
    return;
  }

  const rowsHTML = rows.map((r, i) => {
    const pct = maxRevenue ? Math.round((r.revenue / maxRevenue) * 100) : 0;
    const sharePct = totalRevenue ? ((r.revenue / totalRevenue) * 100).toFixed(1) : 0;
    const medals = ['🥇', '🥈', '🥉'];
    return `
      <div class="mb-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-base">${medals[i] || ''}</span>
            <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">${r.name}</span>
          </div>
          <span class="text-xs text-zinc-400 font-mono">${sharePct}%</span>
        </div>
        <div class="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width:${pct}%"></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-400">${r.count} lượt thực hiện</span>
          <span class="font-bold font-mono text-amber-500">${fmtMoney(r.revenue)}</span>
        </div>
      </div>`;
  }).join('');

  document.getElementById('summary-content').innerHTML = `
    ${summaryKPIs([
    { label: 'Tổng DV', value: rows.length, sub: 'loại dịch vụ' },
    { label: 'Tổng lượt', value: totalCount, sub: 'lần thực hiện' },
    { label: 'Tổng doanh thu', value: fmtMoney(totalRevenue), sub: 'tất cả dịch vụ' },
  ])}
    <p class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Theo dịch vụ</p>
    ${rowsHTML}
  `;
}

/* ── helpers ─────────────────────────────────────────────── */
function summaryKPIs(items) {
  return `
    <div class="grid grid-cols-3 gap-2 mb-5">
      ${items.map(item => `
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-center">
          <p class="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1">${item.label}</p>
          <p class="text-base font-bold font-mono text-amber-500 dark:text-amber-400 leading-tight">${item.value}</p>
          <p class="text-[10px] text-zinc-400 mt-0.5">${item.sub}</p>
        </div>`).join('')}
    </div>`;
}

function barChart(buckets, field, highlightIdx) {
  const max = Math.max(...buckets.map(b => b[field]), 1);

  const bars = buckets.map((b, i) => {
    const h = Math.round((b[field] / max) * 100);
    const isHL = i === highlightIdx;
    return `
      <div class="bar-wrap" style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
        <span class="text-[8px] font-mono" style="color:${isHL ? '#fbbf24' : '#52525b'}">${b[field] ? fmtMoney(b[field]) : ''}</span>
        <div style="width:100%;flex:1;background:${isHL ? 'rgba(251,191,36,.15)' : 'rgba(39,39,42,1)'};border-radius:4px;overflow:hidden;display:flex;align-items:flex-end;min-height:80px">
          <div style="width:100%;height:${h || 2}%;background:${isHL ? '#fbbf24' : '#3f3f46'};border-radius:4px;transition:height .5s ease;min-height:3px"></div>
        </div>
        <span style="font-size:9px;color:#71717a;white-space:nowrap">${b.label}</span>
      </div>`;
  }).join('');

  return `<div style="display:flex;gap:4px;align-items:stretch;height:160px">${bars}</div><div style="height:16px"></div>`;
}

function emptyState(msg) {
  return `<div class="flex flex-col items-center gap-3 py-16 text-zinc-400"><p class="text-sm">${msg}</p></div>`;
}
