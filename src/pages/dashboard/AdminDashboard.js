import { el } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import { emptyState } from '../../components/DataTable.js';
import { formatRupiah } from '../../utils/formatters.js';
import { revenueChart, statusChart } from '../../components/charts.js';
import * as api from '../../services/dashboardService.js';
import { mountAsync, bookingsTable, transactionsTable } from './dashboardUi.js';
import '../../styles/admin-dashboard.css';

async function load() {
  const [stats, status, revenue, bookings, transactions] = await Promise.all([
    api.getStats(), api.getStatusSummary(), api.getMonthlyRevenue(),
    api.getRecentBookings(5), api.getRecentTransactions(5),
  ]);
  return { stats, status, revenue, bookings, transactions };
}

function paint(body, d) {
  const revTotal = d.revenue.values.reduce((a, b) => a + b, 0);
  const statusTotal = Object.values(d.status).reduce((a, b) => a + b, 0);
  body.innerHTML = `
    <div class="stat-grid admin-dashboard__stats">
      ${statCard({ label: 'Total pelanggan', value: String(d.stats.customers), iconName: 'users' })}
      ${statCard({ label: 'Total hewan', value: String(d.stats.pets), iconName: 'paw-print', tone: 'info' })}
      ${statCard({ label: 'Petugas aktif', value: String(d.stats.staff), iconName: 'stethoscope', tone: 'info' })}
      ${statCard({ label: 'Total booking', value: String(d.stats.bookings), iconName: 'calendar-check', tone: 'warning' })}
      ${statCard({ label: 'Total pendapatan (lunas)', value: formatRupiah(d.stats.revenue), iconName: 'wallet', tone: 'success' })}
    </div>
    <div class="dash-grid admin-dashboard__charts">
      <section class="card admin-dashboard__panel">
        <div class="admin-dashboard__panel-head"><div><h3 class="card__title">Pendapatan klinik</h3><p>Tren transaksi yang telah lunas</p></div><span class="admin-dashboard__period">6 bulan</span></div>
        ${revTotal > 0
          ? '<div class="chart-box"><canvas id="revChart"></canvas></div>'
          : emptyState({ iconName: 'wallet', title: 'Belum ada pendapatan', text: 'Grafik muncul setelah ada transaksi lunas.' })}
      </section>
      <section class="card admin-dashboard__panel">
        <div class="admin-dashboard__panel-head"><div><h3 class="card__title">Ringkasan booking</h3><p>Komposisi status booking</p></div><span class="admin-dashboard__period">Semua waktu</span></div>
        ${statusTotal > 0
          ? '<div class="chart-box"><canvas id="statusChart"></canvas></div>'
          : emptyState({ iconName: 'calendar-check', title: 'Belum ada booking', text: 'Distribusi status muncul setelah ada booking.' })}
      </section>
    </div>
    <section class="card admin-dashboard__panel admin-dashboard__table-panel">
      <div class="admin-dashboard__panel-head"><div><h3 class="card__title">Booking terbaru</h3><p>Aktivitas klinik yang perlu dipantau</p></div><a class="admin-dashboard__link" href="#/admin/bookings">Semua booking <span aria-hidden="true">↗</span></a></div>
      ${bookingsTable(d.bookings, { showStaff: true, emptyTitle: 'Belum ada booking', emptyText: 'Booking akan tampil di sini setelah dibuat.' })}
    </section>
    <section class="card admin-dashboard__panel admin-dashboard__table-panel">
      <div class="admin-dashboard__panel-head"><div><h3 class="card__title">Transaksi terbaru</h3><p>Pembayaran yang tercatat di klinik</p></div><a class="admin-dashboard__link" href="#/admin/transactions">Semua transaksi <span aria-hidden="true">↗</span></a></div>
      ${transactionsTable(d.transactions, { emptyTitle: 'Belum ada transaksi', emptyText: 'Transaksi dibuat dari booking yang sudah selesai.' })}
    </section>`;
  if (revTotal > 0) revenueChart(body.querySelector('#revChart'), d.revenue.labels, d.revenue.values);
  if (statusTotal > 0) statusChart(body.querySelector('#statusChart'), d.status);
}

export function adminDashboard() {
  const node = el(`
    <div class="page admin-dashboard">
      <div class="admin-dashboard__heading"><div>
        <p class="admin-dashboard__eyebrow">Operational overview</p>
        <h2>Hari yang tertata,<br /><em>dimulai dari sini.</em></h2>
        <p class="muted">Pantau aktivitas klinik dan temukan hal yang perlu mendapat perhatian.</p>
      </div><span class="admin-dashboard__date">${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span></div>
      <div class="page-body" data-body></div>
    </div>`);
  mountAsync(node, load, paint);
  return node;
}
