import { el } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import { emptyState, dataTable } from '../../components/DataTable.js';
import { revenueChart } from '../../components/charts.js';
import { formatRupiah } from '../../utils/formatters.js';
import { mountAsync } from '../dashboard/dashboardUi.js';
import { getMonthlyReport } from '../../services/reportService.js';

function paint(body, rows) {
  const total = rows.reduce((n, r) => n + r.revenue, 0);
  const count = rows.reduce((n, r) => n + r.count, 0);
  const best = rows.reduce((b, r) => (r.revenue > b.revenue ? r : b), rows[0]);

  body.innerHTML = `
    <div class="stat-grid">
      ${statCard({ label: 'Total pendapatan 12 bulan', value: formatRupiah(total), iconName: 'wallet', tone: 'success' })}
      ${statCard({ label: 'Transaksi lunas', value: String(count), iconName: 'clipboard-list', tone: 'info' })}
      ${statCard({ label: 'Rata-rata per bulan', value: formatRupiah(total / rows.length), iconName: 'chart-column' })}
      ${statCard({ label: 'Bulan tertinggi', value: total > 0 ? best.long : '-', iconName: 'calendar-check', tone: 'warning' })}
    </div>
    <div class="card">
      <h3 class="card__title">Pendapatan per bulan</h3>
      ${total > 0
        ? '<div class="chart-box"><canvas id="reportChart"></canvas></div>'
        : emptyState({ iconName: 'wallet', title: 'Belum ada pendapatan', text: 'Laporan terisi setelah ada transaksi berstatus lunas.' })}
    </div>
    <div class="card">
      <h3 class="card__title">Rincian bulanan</h3>
      ${dataTable({
        columns: [
          { label: 'Bulan', text: (r) => r.long },
          { label: 'Transaksi lunas', text: (r) => String(r.count) },
          { label: 'Pendapatan', html: (r) => `<strong>${formatRupiah(r.revenue)}</strong>` },
        ],
        rows: [...rows].reverse(),
      })}
      <p class="muted" style="margin-top:12px">Hanya transaksi berstatus lunas yang dihitung, berdasarkan tanggal pembayaran (WIB). Transaksi lunas yang dibatalkan tidak dihitung.</p>
    </div>`;
  if (total > 0) revenueChart(body.querySelector('#reportChart'), rows.map((r) => r.short), rows.map((r) => r.revenue));
}

export function reportsPage() {
  const node = el(`
    <div class="page">
      <div class="page-header"><div>
        <h2>Laporan Pendapatan</h2>
        <p class="muted">Pendapatan bulanan dari transaksi lunas. Hanya dapat dilihat Admin.</p>
      </div></div>
      <div class="page-body" data-body></div>
    </div>`);
  mountAsync(node, () => getMonthlyReport(12), paint);
  return node;
}