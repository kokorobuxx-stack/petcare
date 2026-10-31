import { el, escapeHtml } from '../utils/dom.js';
import { icon } from '../components/icons.js';

export function placeholderPage(title) {
  return el(`
    <div class="page">
      <div class="page-header"><div>
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">Halaman ini belum tersedia.</p>
      </div></div>
      <div class="card"><div class="empty">
        <span class="state-icon">${icon('inbox')}</span>
        <h3>Belum ada konten</h3>
        <p class="muted">Fitur halaman ini belum dibuat.</p>
      </div></div>
    </div>`);
}