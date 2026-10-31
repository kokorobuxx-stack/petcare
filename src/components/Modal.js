import { icon, renderIcons } from './icons.js';
import { escapeHtml } from '../utils/dom.js';

function put(target, content) {
  if (content instanceof Node) target.append(content);
  else target.innerHTML = content || '';
}

export function openModal({ title = '', body = '', footer = '', onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" tabindex="-1">
      <div class="modal__head"><h3>${escapeHtml(title)}</h3>
        <button class="icon-btn" data-close aria-label="Tutup">${icon('x')}</button></div>
      <div class="modal__body"></div>
      <div class="modal__foot"></div>
    </div>`;
  const bodyEl = overlay.querySelector('.modal__body');
  put(bodyEl, body);
  put(overlay.querySelector('.modal__foot'), footer);

  const prevFocus = document.activeElement;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    if (!document.querySelector('.modal-overlay')) document.body.classList.remove('modal-open');
    prevFocus?.focus?.();
    onClose?.();
  }

  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.classList.add('modal-open');
  document.body.append(overlay);
  renderIcons();
  (bodyEl.querySelector('input, select, textarea') || overlay.querySelector('.modal')).focus();

  return { el: overlay, body: bodyEl, close };
}

// Mengembalikan Promise<boolean>. Contoh: if (await confirmDialog({ message: '...' })) { ... }
export function confirmDialog({
  title = 'Konfirmasi', message = '', confirmText = 'Ya, lanjutkan', cancelText = 'Batal', danger = false,
} = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };

    const body = document.createElement('p');
    body.className = 'modal__text';
    body.textContent = message;

    const foot = document.createElement('div');
    foot.className = 'modal__actions';
    foot.innerHTML = `<button class="btn btn--ghost" data-no></button>
      <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-yes></button>`;
    foot.querySelector('[data-no]').textContent = cancelText;
    foot.querySelector('[data-yes]').textContent = confirmText;

    const m = openModal({ title, body, footer: foot, onClose: () => finish(false) });
    foot.querySelector('[data-no]').addEventListener('click', () => m.close());
    foot.querySelector('[data-yes]').addEventListener('click', () => { finish(true); m.close(); });
  });
}