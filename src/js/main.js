// ============================================================
// main.js  –  bootstrap & global APP interface
// ============================================================

import { initDB, dbGetAll, dbPut } from './db.js';
import { state, DEFAULT_SERVICES } from './state.js';
import { initTheme, toggleTheme } from './theme.js';
import { startClock } from './clock.js';
import { showToast } from './toast.js';

// Screens
import { renderHome } from './screens/home.js';
import { renderHistory, renderFilterBar } from './screens/history.js';
import { renderSummary } from './screens/summary.js';

// Components
import {
  openAddModal, closeAddModal,
  handleAddPhoto, removeAddPhoto,
  saveSession,
} from './components/add-modal.js';
import {
  openDetailModal, closeDetailModal,
  openEditModal, closeEditModal,
  saveEditSession, deleteSession,
  openImgViewer, closeImgViewer,
} from './components/detail.js';
import {
  openServiceModal, closeServiceModal,
  addService, editServiceInline, deleteService,
  exportServices, importServices, handleImportServices,
} from './components/services.js';
import {
  exportSessions, importSessions,
  handleImportSessions, clearAllData,
} from './components/data-io.js';

/* ─────────────────────────────────────────────────────────
   showScreen
───────────────────────────────────────────────────────── */
const SCREEN_IDS = {
  home: 'screen-home',
  history: 'screen-history',
  summary: 'screen-summary',
  settings: 'screen-settings',
};

function showScreen(name) {
  Object.entries(SCREEN_IDS).forEach(([n, id]) => {
    document.getElementById(id).classList.toggle('active', n === name);
  });

  // Update nav items in ALL screens
  document.querySelectorAll('.nav-item').forEach(el => {
    const onClick = el.getAttribute('onclick') || '';
    el.classList.toggle('active', onClick.includes(`'${name}'`));
  });

  // Render on demand
  switch (name) {
    case 'history': renderHistory(); break;
    case 'summary': renderSummary(); break;
    case 'home': renderHome(); break;
  }
}

function setHistoryFilter(filter) {
  state.historyFilter = filter;
  renderHistory();
}

function switchSummaryTab(tab) {
  state.summaryTab = tab;
  renderSummary();
}

/* ─────────────────────────────────────────────────────────
   Global APP object (called from HTML inline handlers)
───────────────────────────────────────────────────────── */
window.APP = {
  // Navigation
  showScreen,
  setHistoryFilter,
  switchSummaryTab,

  // Theme
  toggleTheme,

  // Add modal
  openAddModal,
  closeAddModal,
  handleAddPhoto,
  removeAddPhoto,
  saveSession,

  // Detail / edit
  openDetailModal,
  closeDetailModal,
  openEditModal,
  closeEditModal,
  saveEditSession,
  deleteSession,

  // Image viewer
  openImgViewer,
  closeImgViewer,

  // Services
  openServiceModal,
  closeServiceModal,
  addService,
  editServiceInline,
  deleteService,
  exportServices,
  importServices,
  handleImportServices,

  // Data I/O
  exportSessions,
  importSessions,
  handleImportSessions,
  clearAllData,
};

/* ─────────────────────────────────────────────────────────
   Bootstrap
───────────────────────────────────────────────────────── */
async function boot() {
  initTheme();
  startClock();

  await initDB();

  // Load services (seed defaults if empty)
  state.services = await dbGetAll('services');
  if (!state.services.length) {
    for (const s of DEFAULT_SERVICES) await dbPut('services', s);
    state.services = [...DEFAULT_SERVICES];
  }

  // Load sessions
  state.sessions = await dbGetAll('sessions');

  // Initial render
  renderHome();
  showScreen('home');

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  }
}

boot().catch(err => {
  console.error('Boot failed:', err);
  showToast('❌ Lỗi khởi động ứng dụng');
});
