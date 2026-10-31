import { icon, renderIcons } from './icons.js';

const ICON = { success: 'circle-check', error: 'circle-x', warning: 'triangle-alert', info: 'info' };
let box;

function container() {
  if (!box) {
    box = document.createElement('div');
    box.className = 'toast-box';
    box.setAttribute('aria-live', 'polite');
    document.body.append(box);
  }
  return box;
}

function show(type, message, ms = 4500) {
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');
  t.innerHTML = `${icon(ICON[type])}<span class="toast__msg"></span>
    <button class="icon-btn" aria-label="Tutup">${icon('x')}</button>`;
  t.querySelector('.toast__msg').textContent = message;
  const remove = () => {
    t.classList.add('is-leaving');
    setTimeout(() => t.remove(), 200);
  };
  t.querySelector('button').addEventListener('click', remove);
  container().append(t);
  renderIcons();
  setTimeout(remove, ms);
}

export const toast = {
  success: (m) => show('success', m),
  error: (m) => show('error', m, 7000),
  warning: (m) => show('warning', m, 6000),
  info: (m) => show('info', m),
};