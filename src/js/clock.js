// ============================================================
// clock.js  –  live HH:MM clock for all screen headers
// ============================================================

export function startClock() {
  const ids = ['clock-home', 'clock-history', 'clock-summary', 'clock-settings'];
  const tick = () => {
    const t = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = t;
    });
  };
  tick();
  setInterval(tick, 10000);
}
