// ============================================================
// toast.js
// ============================================================

let _timer = null;

export function showToast(msg, duration = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_timer);
  _timer = setTimeout(() => el.classList.remove('show'), duration);
}
