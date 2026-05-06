// ============================================================
// theme.js  –  dark / light mode
// ============================================================

import { state } from './state.js';

const STORAGE_KEY = 'qc_theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  state.theme = saved || 'dark';
  applyTheme();
}

export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEY, state.theme);
  applyTheme();
}

function applyTheme() {
  const html = document.documentElement;
  if (state.theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  // update all theme icons
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = state.theme === 'dark' ? '☀️' : '🌙';
  });
  // update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === 'dark' ? '#09090b' : '#ffffff';
}
