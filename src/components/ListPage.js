import { el, escapeHtml } from '../utils/dom.js';
import { icon, renderIcons } from './icons.js';
import { dataTable } from './DataTable.js';
import { mapError } from '../utils/errors.js';

// Tombol aksi per baris. items: [{ act, label, icon }]
export const actionButtons = (r, items) =>
  `<div class="row-actions">${items
    .map((i) => `<button class="icon-btn" type="button" data-act="${i.act}" data-id="${escapeHtml(r.id)}" title="${escapeHtml(i.label)}" aria-label="${escapeHtml(i.label)}">${icon(i.icon)}</button>`)
    .join('')}</div>`;

// load({ page, pageSize, search, filters }) -> { rows, count }
// onAction(act, row | null, { reload }) dipanggil saat tombol [data-act] diklik
export function listPage({
  title, subtitle = '', headerActions = '', searchPlaceholder = '', filters = [],
  columns, load, onAction, emptyTitle, emptyText, pageSize = 10,
}) {
  const state = {
    page: 1,
    search: '',
    filters: Object.fromEntries(filters.map((f) => [f.id, f.options[0]?.value ?? ''])),
  };
  let rows = [];
  let seq = 0;

  const node = el(`
    <div class="page">
      <div class="page-header">
        <div><h2></h2><p class="muted" data-sub></p></div>
        <div class="row">${headerActions}</div>
      </div>
      <div class="card">
        <div class="toolbar">
          ${searchPlaceholder ? `<div class="search">${icon('search')}<input class="input" type="search" data-search placeholder="${escapeHtml(searchPlaceholder)}" aria-label="Cari" /></div>` : ''}
          ${filters.map((f) => `<select class="input toolbar__select" data-filter="${f.id}" aria-label="${escapeHtml(f.label)}">${f.options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}</select>`).join('')}
        </div>
        <div data-list></div>
      </div>
    </div>`);
  node.querySelector('h2').textContent = title;
  node.querySelector('[data-sub]').textContent = subtitle;
  const box = node.querySelector('[data-list]');

  const pager = (count) => {
    if (!count) return '';
    const pages = Math.max(1, Math.ceil(count / pageSize));
    const a = (state.page - 1) * pageSize + 1;
    const b = Math.min(count, state.page * pageSize);
    return `<div class="pager"><span class="muted">Menampilkan ${a}-${b} dari ${count}</span>
      <div class="row">
        <button class="btn btn--ghost btn--sm" data-page="prev" ${state.page <= 1 ? 'disabled' : ''}>${icon('chevron-left')}<span>Sebelumnya</span></button>
        <span class="muted">${state.page} / ${pages}</span>
        <button class="btn btn--ghost btn--sm" data-page="next" ${state.page >= pages ? 'disabled' : ''}><span>Berikutnya</span>${icon('chevron-right')}</button>
      </div></div>`;
  };

  async function reload() {
    const my = ++seq;
    box.innerHTML = '<div class="skeleton sk-block"></div>';
    try {
      const res = await load({ page: state.page, pageSize, search: state.search, filters: state.filters });
      if (my !== seq || !node.isConnected) return;
      const pages = Math.max(1, Math.ceil(res.count / pageSize));
      if (state.page > pages) { state.page = pages; return reload(); }
      rows = res.rows;
      box.innerHTML = dataTable({ columns, rows, emptyTitle, emptyText }) + pager(res.count);
    } catch (e) {
      if (my !== seq || !node.isConnected) return;
      console.error(e);
      box.innerHTML = `<div class="empty"><span class="state-icon">${icon('triangle-alert')}</span>
        <h3>Gagal memuat data</h3><p class="muted" data-err></p>
        <button class="btn btn--ghost btn--sm" data-retry>${icon('refresh-cw')}<span>Coba lagi</span></button></div>`;
      box.querySelector('[data-err]').textContent = mapError(e);
    }
    renderIcons();
  }

  let timer;
  node.querySelector('[data-search]')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = e.target.value; state.page = 1; reload(); }, 350);
  });
  node.querySelectorAll('[data-filter]').forEach((s) =>
    s.addEventListener('change', () => { state.filters[s.dataset.filter] = s.value; state.page = 1; reload(); })
  );

  node.addEventListener('click', (e) => {
    if (e.target.closest('[data-retry]')) return reload();
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) {
      state.page += pg.dataset.page === 'next' ? 1 : -1;
      return reload();
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const row = b.dataset.id ? rows.find((r) => r.id === b.dataset.id) : null;
    onAction?.(b.dataset.act, row || null, { reload });
  });

  reload();
  return node;
}