import { escapeHtml } from '../../utils/dom.js';
import { icon, renderIcons } from '../../components/icons.js';
import { dataTable } from '../../components/DataTable.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { formatDateTime, formatRupiah } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';

const METHOD = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS', kartu: 'Kartu' };

const skeleton = () => `
  <div class="stat-grid">${'<div class="skeleton sk-stat"></div>'.repeat(4)}</div>
  <div class="skeleton sk-block"></div>`;

const errorHtml = () => `
  <div class="card"><div class="empty">
    <span class="state-icon">${icon('triangle-alert')}</span>
    <h3>Gagal memuat data</h3>
    <p class="muted" data-err></p>
    <button class="btn btn--ghost btn--sm" data-retry>${icon('refresh-cw')}<span>Coba lagi</span></button>
  </div></div>`;

// load(): Promise<data>; paint(body, data): mengisi tampilan. Skeleton -> data atau error + Coba lagi.
export function mountAsync(node, load, paint) {
  const body = node.querySelector('[data-body]');
  const run = async () => {
    body.innerHTML = skeleton();
    try {
      const data = await load();
      if (!node.isConnected) return; // pengguna sudah pindah halaman
      paint(body, data);
    } catch (e) {
      if (!node.isConnected) return;
      console.error(e);
      body.innerHTML = errorHtml();
      body.querySelector('[data-err]').textContent = mapError(e);
      body.querySelector('[data-retry]').addEventListener('click', run);
    }
    renderIcons();
  };
  run();
}

export function bookingsTable(rows, { showCustomer = true, showStaff = false, emptyTitle, emptyText } = {}) {
  const columns = [
    { label: 'Kode', html: (r) => `<span class="mono">${escapeHtml(r.booking_code)}</span>` },
    showCustomer && { label: 'Pelanggan', text: (r) => r.customers?.full_name || '-' },
    { label: 'Hewan', text: (r) => r.pets?.name || '-' },
    { label: 'Layanan', text: (r) => (r.booking_items || []).map((i) => i.service_name).join(', ') || '-' },
    { label: 'Jadwal', text: (r) => formatDateTime(r.scheduled_at) },
    showStaff && {
      label: 'Petugas',
      html: (r) => (r.staff_id
        ? '<span class="badge badge--info">Ditetapkan</span>'
        : '<span class="badge badge--warning">Belum ada</span>'),
    },
    { label: 'Status', html: (r) => statusBadge(r.status) },
  ].filter(Boolean);
  return dataTable({ columns, rows, emptyTitle, emptyText });
}

export function transactionsTable(rows, { emptyTitle, emptyText } = {}) {
  return dataTable({
    columns: [
      { label: 'Kode', html: (r) => `<span class="mono">${escapeHtml(r.transaction_code)}</span>` },
      { label: 'Booking', text: (r) => r.bookings?.booking_code || '-' },
      { label: 'Pelanggan', text: (r) => r.bookings?.customers?.full_name || '-' },
      { label: 'Total', text: (r) => formatRupiah(r.total_amount) },
      { label: 'Metode', text: (r) => METHOD[r.payment_method] || r.payment_method },
      { label: 'Status', html: (r) => statusBadge(r.payment_status) },
      { label: 'Dibuat', text: (r) => formatDateTime(r.created_at) },
    ],
    rows, emptyTitle, emptyText,
  });
}