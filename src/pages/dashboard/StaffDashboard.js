import { el } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import * as api from '../../services/dashboardService.js';
import { mountAsync, bookingsTable, transactionsTable } from './dashboardUi.js';

async function load() {
  const [status, today, pending, transactions, unpaid] = await Promise.all([
    api.getStatusSummary(), api.getTodayBookings(), api.getPendingBookings(5),
    api.getRecentTransactions(5), api.countUnpaid(),
  ]);
  return { status, today, pending, transactions, unpaid };
}

function paint(body, d) {
  body.innerHTML = `
    <div class="stat-grid">
      ${statCard({ label: 'Booking hari ini', value: String(d.today.length), iconName: 'calendar-days' })}
      ${statCard({ label: 'Menunggu konfirmasi', value: String(d.status.pending), iconName: 'clock', tone: 'warning' })}
      ${statCard({ label: 'Dikonfirmasi', value: String(d.status.confirmed), iconName: 'calendar-check', tone: 'info' })}
      ${statCard({ label: 'Selesai (total)', value: String(d.status.completed), iconName: 'circle-check', tone: 'success' })}
      ${statCard({ label: 'Transaksi belum bayar', value: String(d.unpaid), iconName: 'receipt', tone: 'warning' })}
    </div>
    <div class="card">
      <h3 class="card__title">Booking hari ini</h3>
      ${bookingsTable(d.today, { showStaff: true, emptyTitle: 'Tidak ada booking hari ini', emptyText: 'Booking dengan jadwal hari ini akan tampil di sini.' })}
    </div>
    <div class="card">
      <h3 class="card__title">Menunggu konfirmasi</h3>
      ${bookingsTable(d.pending, { showStaff: true, emptyTitle: 'Tidak ada permintaan baru', emptyText: 'Permintaan booking pelanggan akan tampil di sini.' })}
    </div>
    <div class="card">
      <h3 class="card__title">Transaksi terbaru</h3>
      ${transactionsTable(d.transactions, { emptyTitle: 'Belum ada transaksi', emptyText: 'Transaksi dibuat dari booking yang sudah selesai.' })}
    </div>`;
}

export function staffDashboard() {
  const node = el(`
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Dashboard Petugas</h2>
          <p class="muted">Ringkasan tugas operasional hari ini.</p>
        </div>
        <div class="row">
          <a class="btn btn--primary" href="#/staff/customers"><i data-lucide="user-plus" class="ico" aria-hidden="true"></i><span>Walk-in baru</span></a>
          <a class="btn btn--ghost" href="#/staff/bookings"><i data-lucide="plus" class="ico" aria-hidden="true"></i><span>Buat booking</span></a>
        </div>
      </div>
      <div class="page-body" data-body></div>
    </div>`);
  mountAsync(node, load, paint);
  return node;
}