import { el, escapeHtml } from '../../utils/dom.js';
import { statCard } from '../../components/StatCard.js';
import { getState } from '../../services/authService.js';
import { ROLE_LABEL } from '../../utils/constants.js';
import * as api from '../../services/dashboardService.js';
import { mountAsync, bookingsTable } from './dashboardUi.js';
import '../../styles/customer-dashboard.css';

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
      <div class="stat-grid customer-dashboard__stats">
        ${statCard({ label: 'Hewan saya', value: String(d.stats.pets), iconName: 'paw-print' })}
        ${statCard({ label: 'Booking mendatang', value: String(d.upcoming.length), iconName: 'calendar-days', tone: 'info' })}
        ${statCard({ label: 'Total booking', value: String(d.stats.bookings), iconName: 'calendar-check', tone: 'success' })}
      </div>
      <div class="alert alert--warning">Booking berstatus Menunggu masih berupa permintaan sampai dikonfirmasi petugas klinik.</div>
      <section class="card customer-dashboard__panel">
        <div class="customer-dashboard__panel-head"><div><h3 class="card__title">Booking mendatang</h3><p>Jadwal kunjungan hewan Anda</p></div><a class="customer-dashboard__link" href="#/customer/bookings">Semua booking <span aria-hidden="true">↗</span></a></div>
        ${bookingsTable(d.upcoming.slice(0, 5), { showCustomer: false, emptyTitle: 'Belum ada booking mendatang', emptyText: 'Buat booking pertama Anda dari tombol di atas.' })}
      </section>
      <section class="card customer-dashboard__panel">
        <div class="customer-dashboard__panel-head"><div><h3 class="card__title">Riwayat kunjungan</h3><p>Perawatan yang sudah dijalani</p></div><a class="customer-dashboard__link" href="#/customer/bookings">Lihat riwayat <span aria-hidden="true">↗</span></a></div>
        ${bookingsTable(d.history, { showCustomer: false, emptyTitle: 'Belum ada riwayat', emptyText: 'Riwayat booking Anda akan tampil di sini.' })}
      </section>
      <section class="card customer-dashboard__panel customer-dashboard__account">
        <div class="customer-dashboard__panel-head"><div><h3 class="card__title">Informasi akun</h3><p>Rincian profil PetCare Anda</p></div><a class="customer-dashboard__link" href="#/customer/profile">Kelola profil <span aria-hidden="true">↗</span></a></div>
        <dl class="info-list">
          <dt>Nama</dt><dd>${escapeHtml(profile.full_name)}</dd>
          <dt>Telepon</dt><dd>${escapeHtml(profile.phone || '-')}</dd>
          <dt>Peran</dt><dd>${escapeHtml(ROLE_LABEL[profile.role])}</dd>
        </dl>
      </section>`;
  };

  const node = el(`
    <div class="page customer-dashboard">
      <div class="page-header customer-dashboard__heading">
        <div>
          <p class="customer-dashboard__eyebrow">RUANG KECIL ANDA</p>
          <h2>Senang melihatmu kembali,<br /><em><span data-name></span>.</em></h2>
          <p class="muted">Semua yang hewan kesayangan Anda butuhkan, ada di satu tempat.</p>
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
