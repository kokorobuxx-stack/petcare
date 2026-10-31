import { el } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import * as api from '../../services/dashboardService.js';
import { mountAsync, bookingsTable, transactionsTable } from './dashboardUi.js';
import '../../styles/staff-dashboard.css';

async function load() {
  const [status, today, pending, transactions, unpaid] = await Promise.all([
    api.getStatusSummary(), api.getTodayBookings(), api.getPendingBookings(5),
    api.getRecentTransactions(5), api.countUnpaid(),
  ]);
  return { status, today, pending, transactions, unpaid };
}

function paint(body, d) {
  body.innerHTML = `
    <div class="stat-grid staff-dashboard__stats">
      ${statCard({ label: 'Booking hari ini', value: String(d.today.length), iconName: 'calendar-days' })}
      ${statCard({ label: 'Menunggu konfirmasi', value: String(d.status.pending), iconName: 'clock', tone: 'warning' })}
      ${statCard({ label: 'Dikonfirmasi', value: String(d.status.confirmed), iconName: 'calendar-check', tone: 'info' })}
      ${statCard({ label: 'Selesai (total)', value: String(d.status.completed), iconName: 'circle-check', tone: 'success' })}
      ${statCard({ label: 'Transaksi belum bayar', value: String(d.unpaid), iconName: 'receipt', tone: 'warning' })}
    </div>
    <section class="card staff-dashboard__panel">
      <div class="staff-dashboard__panel-head"><div><h3 class="card__title">Jadwal hari ini</h3><p>Janji temu yang menjadi perhatian hari ini</p></div><span class="staff-dashboard__tag">${d.today.length} booking</span></div>
      ${bookingsTable(d.today, { showStaff: true, emptyTitle: 'Tidak ada booking hari ini', emptyText: 'Booking dengan jadwal hari ini akan tampil di sini.' })}
    </section>
    <section class="card staff-dashboard__panel">
      <div class="staff-dashboard__panel-head"><div><h3 class="card__title">Menunggu konfirmasi</h3><p>Permintaan booking yang memerlukan tindak lanjut</p></div><span class="staff-dashboard__tag staff-dashboard__tag--warm">${d.status.pending} permintaan</span></div>
      ${bookingsTable(d.pending, { showStaff: true, emptyTitle: 'Tidak ada permintaan baru', emptyText: 'Permintaan booking pelanggan akan tampil di sini.' })}
    </section>
    <section class="card staff-dashboard__panel">
      <div class="staff-dashboard__panel-head"><div><h3 class="card__title">Transaksi terbaru</h3><p>Riwayat pembayaran yang tercatat</p></div><a class="staff-dashboard__link" href="#/staff/transactions">Buka transaksi <span aria-hidden="true">↗</span></a></div>
      ${transactionsTable(d.transactions, { emptyTitle: 'Belum ada transaksi', emptyText: 'Transaksi dibuat dari booking yang sudah selesai.' })}
    </section>`;
}

export function staffDashboard() {
  const node = el(`
    <div class="page staff-dashboard">
      <div class="page-header staff-dashboard__heading">
        <div>
          <p class="staff-dashboard__eyebrow">Ruang kerja petugas</p>
          <h2>Hari ini, satu perawatan<br /><em>pada satu waktu.</em></h2>
          <p class="muted">Jadwal, permintaan booking, dan pembayaran Anda di satu tempat.</p>
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
