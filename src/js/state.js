// ============================================================
// state.js  –  central app state
// ============================================================

export const state = {
  sessions: [],   // all sessions from DB
  services: [],   // service definitions
  historyFilter: 'today',
  summaryTab: 'day',

  // Add-modal draft
  addDraft: {
    selections: {},    // { serviceId: qty }
    photoDataURLs: [], // base64 strings
  },

  // Edit-modal draft
  editDraft: {
    sessionId: null,
    selections: {},
    date: '',
    time: '',
  },

  // Theme
  theme: 'dark', // 'dark' | 'light'
};

export const DEFAULT_SERVICES = [
  { id: 'sv-01', name: 'Dịch vụ 1', price: 200000 },
  { id: 'sv-02', name: 'Dịch vụ 2', price: 100000 },
  { id: 'sv-03', name: 'Dịch vụ 3', price: 50000 }
];
