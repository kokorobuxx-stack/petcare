import { el, escapeHtml } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import { getState } from '../../services/authService.js';
import { ROLE_LABEL } from '../../utils/constants.js';
import * as api from '../../services/dashboardService.js';
import { mountAsync, bookingsTable } from './dashboardUi.js';

async function load() {
  const [stats, upcoming, history] = await Promise.all([
    api.getStats(), api.getUpcomingBookings(20), api.getRecentBookings(5),
  ]);
  return { stats, upcoming, history };
}

export function customerDashboard() {
  const { profile } = getState();
  const first = (profile.full_name || '').trim().split(/\s+/)[0] || 'Pelanggan';

  const paint = (body, d) => {
    body.innerHTML = `
      <div class="stat-grid">
        ${statCard({ label: 'Hewan saya', value: String(d.stats.pets), iconName: 'paw-print' })}
        ${statCard({ label: 'Booking mendatang', value: String(d.upcoming.length), iconName: 'calendar-days', tone: 'info' })}
        ${statCard({ label: 'Total booking', value: String(d.stats.bookings), iconName: 'calendar-check', tone: 'success' })}
      </div>
      <div class="alert alert--warning">Booking berstatus Menunggu masih berupa permintaan sampai dikonfirmasi petugas klinik.</div>
      <div class="card">
        <h3 class="card__title">Booking mendatang</h3>
        ${bookingsTable(d.upcoming.slice(0, 5), { showCustomer: false, emptyTitle: 'Belum ada booking mendatang', emptyText: 'Buat booking pertama Anda dari tombol di atas.' })}
      </div>
      <div class="card">
        <h3 class="card__title">Riwayat booking</h3>
        ${bookingsTable(d.history, { showCustomer: false, emptyTitle: 'Belum ada riwayat', emptyText: 'Riwayat booking Anda akan tampil di sini.' })}
      </div>
      <div class="card">
        <h3 class="card__title">Informasi akun</h3>
        <dl class="info-list">
          <dt>Nama</dt><dd>${escapeHtml(profile.full_name)}</dd>
          <dt>Telepon</dt><dd>${escapeHtml(profile.phone || '-')}</dd>
          <dt>Peran</dt><dd>${escapeHtml(ROLE_LABEL[profile.role])}</dd>
        </dl>
      </div>`;
  };

  const node = el(`
    <div class="page">
      <div class="page-header">
        <div>
          <h2>Halo, <span data-name></span></h2>
          <p class="muted">Kelola hewan dan booking Anda di sini.</p>
        </div>
        <div class="row">
          <a class="btn btn--primary" href="#/customer/pets"><i data-lucide="paw-print" class="ico" aria-hidden="true"></i><span>Tambah hewan</span></a>
          <a class="btn btn--ghost" href="#/customer/bookings"><i data-lucide="plus" class="ico" aria-hidden="true"></i><span>Buat booking</span></a>
        </div>
      </div>
      <div class="page-body" data-body></div>
    </div>`);
  node.querySelector('[data-name]').textContent = first;
  mountAsync(node, load, paint);
  return node;
}