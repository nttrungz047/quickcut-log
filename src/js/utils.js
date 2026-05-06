// ============================================================
// utils.js  –  shared helpers
// ============================================================

export const fmtMoney = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'k';
  return n + 'đ';
};

export const fmtMoneyFull = (n) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export const fmtTime = (dt) => {
  const d = new Date(dt);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const fmtDate = (dt) => {
  const d = new Date(dt);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
};

export const fmtDateFull = (dt) => {
  const d = new Date(dt);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const todayStr = () => new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const toDateKey = (dt) => {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const toMonthKey = (dt) => {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const uuid = () => crypto.randomUUID();

export const fileToBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
};

export const resizeImage = (file, maxSide = 800) => new Promise((res) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    res(c.toDataURL('image/jpeg', 0.82));
  };
  img.src = url;
});
