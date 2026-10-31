import { escapeHtml } from '../utils/dom.js';

const MAP = {
  // Booking
  pending: ['Menunggu', 'warning'],
  confirmed: ['Dikonfirmasi', 'info'],
  completed: ['Selesai', 'success'],
  cancelled: ['Dibatalkan', 'danger'],
  // Pembayaran
  belum_bayar: ['Belum bayar', 'warning'],
  lunas: ['Lunas', 'success'],
  dibatalkan: ['Dibatalkan', 'danger'],
  // Umum
  active: ['Aktif', 'success'],
  inactive: ['Nonaktif', 'neutral'],
  archived: ['Diarsipkan', 'neutral'],
};

export function statusBadge(status) {
  const [label, tone] = MAP[status] || [status || '-', 'neutral'];
  return `<span class="badge badge--${tone}">${escapeHtml(label)}</span>`;
}