import Chart from 'chart.js/auto';
import { formatRupiah } from '../utils/formatters.js';

const v = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
let charts = [];

export const STATUS_ORDER = ['pending', 'confirmed', 'completed', 'cancelled'];
export const STATUS_LABEL = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi', completed: 'Selesai', cancelled: 'Dibatalkan',
};

// Dipanggil setiap pindah halaman agar grafik lama tidak menumpuk di memori.
export function destroyCharts() {
  charts.forEach((c) => c.destroy());
  charts = [];
}

function applyDefaults() {
  Chart.defaults.color = v('--text-2');
  Chart.defaults.font.family = v('--font-body');
  Chart.defaults.borderColor = v('--border');
}

export function revenueChart(canvas, labels, values) {
  if (!canvas || !canvas.isConnected) return;
  applyDefaults();
  const compact = new Intl.NumberFormat('id-ID', { notation: 'compact' });
  charts.push(new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Pendapatan', data: values, backgroundColor: v('--teal'), borderRadius: 6, maxBarThickness: 44 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => formatRupiah(c.parsed.y) } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (x) => compact.format(x) } },
        x: { grid: { display: false } },
      },
    },
  }));
}

export function statusChart(canvas, summary) {
  if (!canvas || !canvas.isConnected) return;
  applyDefaults();
  const colors = { pending: v('--warning'), confirmed: v('--info'), completed: v('--success'), cancelled: v('--danger') };
  charts.push(new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: STATUS_ORDER.map((s) => STATUS_LABEL[s]),
      datasets: [{
        data: STATUS_ORDER.map((s) => summary[s] || 0),
        backgroundColor: STATUS_ORDER.map((s) => colors[s]),
        borderColor: v('--surface'),
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14 } } },
    },
  }));
}