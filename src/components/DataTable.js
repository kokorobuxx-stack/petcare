import { escapeHtml } from '../utils/dom.js';
import { icon } from './icons.js';

export function emptyState({ iconName = 'inbox', title = 'Belum ada data', text = '' } = {}) {
  return `
    <div class="empty">
      <span class="state-icon">${icon(iconName)}</span>
      <h3>${escapeHtml(title)}</h3>
      ${text ? `<p class="muted">${escapeHtml(text)}</p>` : ''}
    </div>`;
}

export function dataTable({ columns, rows, emptyTitle, emptyText }) {
  if (!rows || !rows.length) return emptyState({ title: emptyTitle, text: emptyText });
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${columns
      .map((c) => `<td>${c.html ? c.html(r) : escapeHtml(c.text ? c.text(r) : r[c.key])}</td>`)
      .join('')}</tr>`)
    .join('');
  return `<div class="table-wrap"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}