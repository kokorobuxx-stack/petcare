import Chart from 'chart.js/auto';
import { formatRupiah } from '../utils/formatters.js';

const themeRoot = (element) => element?.closest('.app-shell') || document.documentElement;
const v = (name, element) => {
  const root = themeRoot(element);
  return getComputedStyle(root).getPropertyValue(name).trim()
    || getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};
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

function applyDefaults(canvas) {
  const root = themeRoot(canvas);
  const computed = getComputedStyle(root);
  Chart.defaults.color = v('--text-2', canvas);
  Chart.defaults.font.family = computed.fontFamily || v('--font-body', canvas);
  Chart.defaults.borderColor = v('--border', canvas);
}

export function revenueChart(canvas, labels, values) {
  if (!canvas || !canvas.isConnected) return;
  applyDefaults(canvas);
  const compact = new Intl.NumberFormat('id-ID', { notation: 'compact' });
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  charts.push(new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Pendapatan', data: values, backgroundColor: v('--teal', canvas), borderRadius: 6, maxBarThickness: 44 }],
    },
    options: {
      animation: motion ? false : { duration: 720, easing: 'easeOutQuart' },
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
  applyDefaults(canvas);
  const colors = {
    pending: v('--warning', canvas),
    confirmed: v('--info', canvas),
    completed: v('--success', canvas),
    cancelled: v('--danger', canvas),
  };
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  charts.push(new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: STATUS_ORDER.map((s) => STATUS_LABEL[s]),
      datasets: [{
        data: STATUS_ORDER.map((s) => summary[s] || 0),
        backgroundColor: STATUS_ORDER.map((s) => colors[s]),
        borderColor: v('--surface', canvas),
        borderWidth: 3,
      }],
    },
    options: {
      animation: motion ? false : { animateRotate: true, animateScale: true, duration: 680, easing: 'easeOutQuart' },
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14 } } },
    },
  }));
}
