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
  // { id: 'default-1', name: 'Cắt tóc', price: 50000 },
  // { id: 'default-2', name: 'Gội đầu', price: 20000 },
  // { id: 'default-3', name: 'Cạo râu', price: 30000 },
  // { id: 'default-4', name: 'Nhuộm tóc', price: 150000 },
  // { id: 'default-5', name: 'Uốn tóc', price: 200000 },

  { id: 's1', name: 'Cắt tóc', price: 50000 },
  { id: 's2', name: 'Gội đầu', price: 20000 },
  { id: 's3', name: 'Cạo râu', price: 30000 },
  { id: 's4', name: 'Nhuộm tóc', price: 150000 },
  { id: 's5', name: 'Uốn tóc', price: 200000 },
];
