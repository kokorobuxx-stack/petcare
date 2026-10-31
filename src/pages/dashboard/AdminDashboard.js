import { el } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import { emptyState } from '../../components/DataTable.js';
import { formatRupiah } from '../../utils/formatters.js';
import { revenueChart, statusChart } from '../../components/charts.js';
import * as api from '../../services/dashboardService.js';
import { mountAsync, bookingsTable, transactionsTable } from './dashboardUi.js';

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
    <div class="stat-grid">
      ${statCard({ label: 'Total pelanggan', value: String(d.stats.customers), iconName: 'users' })}
      ${statCard({ label: 'Total hewan', value: String(d.stats.pets), iconName: 'paw-print', tone: 'info' })}
      ${statCard({ label: 'Petugas aktif', value: String(d.stats.staff), iconName: 'stethoscope', tone: 'info' })}
      ${statCard({ label: 'Total booking', value: String(d.stats.bookings), iconName: 'calendar-check', tone: 'warning' })}
      ${statCard({ label: 'Total pendapatan (lunas)', value: formatRupiah(d.stats.revenue), iconName: 'wallet', tone: 'success' })}
    </div>
    <div class="dash-grid">
      <div class="card">
        <h3 class="card__title">Pendapatan 6 bulan terakhir</h3>
        ${revTotal > 0
          ? '<div class="chart-box"><canvas id="revChart"></canvas></div>'
          : emptyState({ iconName: 'wallet', title: 'Belum ada pendapatan', text: 'Grafik muncul setelah ada transaksi lunas.' })}
      </div>
      <div class="card">
        <h3 class="card__title">Status booking</h3>
        ${statusTotal > 0
          ? '<div class="chart-box"><canvas id="statusChart"></canvas></div>'
          : emptyState({ iconName: 'calendar-check', title: 'Belum ada booking', text: 'Distribusi status muncul setelah ada booking.' })}
      </div>
    </div>
    <div class="card">
      <h3 class="card__title">Booking terbaru</h3>
      ${bookingsTable(d.bookings, { showStaff: true, emptyTitle: 'Belum ada booking', emptyText: 'Booking akan tampil di sini setelah dibuat.' })}
    </div>
    <div class="card">
      <h3 class="card__title">Transaksi terbaru</h3>
      ${transactionsTable(d.transactions, { emptyTitle: 'Belum ada transaksi', emptyText: 'Transaksi dibuat dari booking yang sudah selesai.' })}
    </div>`;
  if (revTotal > 0) revenueChart(body.querySelector('#revChart'), d.revenue.labels, d.revenue.values);
  if (statusTotal > 0) statusChart(body.querySelector('#statusChart'), d.status);
}

export function adminDashboard() {
  const node = el(`
    <div class="page">
      <div class="page-header"><div>
        <h2>Dashboard Admin</h2>
        <p class="muted">Ringkasan operasional klinik.</p>
      </div></div>
      <div class="page-body" data-body></div>
    </div>`);
  mountAsync(node, load, paint);
  return node;
}