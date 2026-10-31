import { escapeHtml } from '../../utils/dom.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { listPage } from '../../components/ListPage.js';
import { dataTable } from '../../components/DataTable.js';
import { openFormModal } from '../../components/FormModal.js';
import { openModal, confirmDialog } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { formatDateTime, formatRupiah } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import * as api from '../../services/bookingService.js';
import { openBookingForm } from './BookingForm.js';

const durationOf = (r) => {
  if (!r.ends_at || !r.scheduled_at) return '-';
  return `${Math.round((new Date(r.ends_at) - new Date(r.scheduled_at)) / 60000)} menit`;
};

export function bookingsPage(role) {
  const isCustomer = role === 'customer';
  let staffList = [];
  let staffReady = null;

  const ensureStaff = () => {
    if (isCustomer) return Promise.resolve();
    staffReady ??= api.getStaffOptions(role).then((l) => { staffList = l; }).catch((e) => { staffReady = null; throw e; });
    return staffReady;
  };
  const staffName = (id) => staffList.find((s) => s.id === id)?.name || 'Ditetapkan';

  const actionsFor = (r) => {
    const list = [{ act: 'detail', label: 'Detail' }];
    if (isCustomer) {
      if (r.status === 'pending') list.push({ act: 'cancel', label: 'Batalkan' });
      return list;
    }
    if (r.status === 'pending') {
      list.push({ act: 'assign', label: r.staff_id ? 'Ganti petugas' : 'Tetapkan petugas' });
      if (r.staff_id) list.push({ act: 'confirm', label: 'Konfirmasi', primary: true });
      list.push({ act: 'cancel', label: 'Batalkan' });
    } else if (r.status === 'confirmed') {
      list.push({ act: 'assign', label: 'Ganti petugas' });
      list.push({ act: 'complete', label: 'Selesaikan', primary: true });
      list.push({ act: 'cancel', label: 'Batalkan' });
    }
    return list;
  };

  const columns = [
    { label: 'Kode', html: (r) => `<span class="mono">${escapeHtml(r.booking_code)}</span>` },
    !isCustomer && { label: 'Pelanggan', text: (r) => r.customers?.full_name || '-' },
    { label: 'Hewan', text: (r) => r.pets?.name || '-' },
    { label: 'Layanan', text: (r) => (r.booking_items || []).map((i) => i.service_name).join(', ') || '-' },
    { label: 'Jadwal', text: (r) => formatDateTime(r.scheduled_at) },
    { label: 'Durasi', text: durationOf },
    !isCustomer && {
      label: 'Petugas',
      html: (r) => (r.staff_id
        ? escapeHtml(staffName(r.staff_id))
        : '<span class="badge badge--warning">Belum ada</span>'),
    },
    { label: 'Status', html: (r) => statusBadge(r.status) },
    {
      label: 'Aksi',
      html: (r) => `<div class="row-actions">${actionsFor(r).map((a) =>
        `<button class="btn ${a.primary ? 'btn--primary' : 'btn--ghost'} btn--sm" type="button" data-act="${a.act}" data-id="${escapeHtml(r.id)}">${escapeHtml(a.label)}</button>`).join('')}</div>`,
    },
  ].filter(Boolean);

  const filters = [
    { id: 'status', label: 'Status', options: [
      { value: '', label: 'Semua status' }, { value: 'pending', label: 'Menunggu' },
      { value: 'confirmed', label: 'Dikonfirmasi' }, { value: 'completed', label: 'Selesai' },
      { value: 'cancelled', label: 'Dibatalkan' }] },
    { id: 'when', label: 'Tanggal', options: [
      { value: '', label: 'Semua tanggal' }, { value: 'today', label: 'Hari ini' },
      { value: 'upcoming', label: 'Mendatang' }, { value: 'past', label: 'Sudah lewat' }] },
  ];
  if (!isCustomer) {
    filters.push({ id: 'assign', label: 'Petugas', options: [
      { value: '', label: 'Semua petugas' }, { value: 'none', label: 'Belum ada petugas' }] });
  }

  async function showDetail(r) {
    const items = r.booking_items || [];
    const sub = (i) => Number(i.unit_price) * Number(i.quantity || 1);
    const total = items.reduce((n, i) => n + sub(i), 0);
    const m = openModal({ title: 'Detail booking', body: '' });
    m.el.querySelector('.modal').classList.add('modal--wide');
    m.body.innerHTML = `
      ${isCustomer && r.status === 'pending' ? '<p class="muted">Booking masih berupa permintaan sampai dikonfirmasi petugas.</p>' : ''}
      <section class="detail-section detail-section--overview"><p class="detail-section__eyebrow">01 / BOOKING</p><div class="detail-section__code"><strong>${escapeHtml(r.booking_code)}</strong>${statusBadge(r.status)}</div>
        <dl class="info-list">
          ${isCustomer ? '' : `<dt>Pelanggan</dt><dd>${escapeHtml(r.customers?.full_name || '-')}</dd>`}
          <dt>Hewan</dt><dd>${escapeHtml(r.pets?.name || '-')}</dd>
          ${isCustomer ? '' : `<dt>Petugas</dt><dd>${r.staff_id ? escapeHtml(staffName(r.staff_id)) : 'Belum ditetapkan'}</dd>`}
        </dl>
      </section>
      <section class="detail-section"><p class="detail-section__eyebrow">02 / JADWAL &amp; CATATAN</p><dl class="info-list">
        <dt>Jadwal</dt><dd>${escapeHtml(formatDateTime(r.scheduled_at))}</dd>
        <dt>Perkiraan selesai</dt><dd>${escapeHtml(formatDateTime(r.ends_at))} (${escapeHtml(durationOf(r))})</dd>
        <dt>Keluhan</dt><dd>${escapeHtml(r.complaint || '-')}</dd>
        ${r.status === 'cancelled' ? `<dt>Alasan batal</dt><dd>${escapeHtml(r.cancel_reason || '-')}</dd>` : ''}
        <dt>Dibuat</dt><dd>${escapeHtml(formatDateTime(r.created_at))}</dd>
      </dl></section>
      <section class="detail-section"><p class="detail-section__eyebrow">03 / RINCIAN LAYANAN</p>
      ${dataTable({
        columns: [
          { label: 'Layanan', text: (i) => i.service_name },
          { label: 'Harga', text: (i) => formatRupiah(i.unit_price) },
          { label: 'Durasi', text: (i) => `${i.duration_minutes} menit` },
          { label: 'Jumlah', text: (i) => String(i.quantity || 1) },
          { label: 'Subtotal', text: (i) => formatRupiah(sub(i)) },
        ],
        rows: items, emptyTitle: 'Tidak ada layanan',
      })}
      <p class="detail-total"><strong>Total layanan: ${escapeHtml(formatRupiah(total))}</strong></p></section>`;
  }

  const runStatus = async (row, status, { title, message, confirmText, ok }, reload) => {
    if (!(await confirmDialog({ title, message, confirmText }))) return;
    try {
      await api.setStatus(row.id, status);
      toast.success(ok);
      reload();
    } catch (e) {
      console.error(e);
      toast.error(mapError(e));
    }
  };

  return listPage({
    title: isCustomer ? 'Booking Saya' : 'Booking',
    subtitle: isCustomer
      ? 'Permintaan booking Anda diproses petugas klinik.'
      : 'Kelola jadwal, petugas, dan status booking. Untuk walk-in, tambahkan pelanggan dan hewannya lebih dulu.',
    headerActions: '<button class="btn btn--primary" data-act="add"><span>Buat booking</span></button>',
    searchPlaceholder: 'Cari kode booking...',
    filters, columns,
    async load(params) {
      try { await ensureStaff(); } catch (e) { console.error(e); }
      return api.listBookings(params);
    },
    emptyTitle: 'Belum ada booking',
    emptyText: 'Klik "Buat booking" untuk membuat booking pertama.',
    async onAction(act, row, { reload }) {
      if (act === 'add') return openBookingForm({ role, onDone: reload });
      if (!row) return;
      if (act === 'detail') return showDetail(row);

      if (act === 'assign') {
        let active;
        try {
          await ensureStaff();
          active = staffList.filter((s) => s.is_active);
        } catch (e) {
          console.error(e);
          return toast.error(mapError(e));
        }
        if (!active.length) return toast.error('Belum ada petugas aktif.');
        return openFormModal({
          title: 'Tetapkan petugas',
          note: 'Sistem memeriksa bentrok jadwal petugas saat disimpan.',
          fields: [{
            id: 'staff_id', label: 'Petugas', type: 'select',
            options: [{ value: '', label: 'Pilih petugas...' }, ...active.map((s) => ({
              value: s.id, label: `${s.name} (${api.JOB_LABEL[s.job_title] || s.job_title || '-'})`,
            }))],
            validate: (v) => (v ? '' : 'Pilih petugas.'),
          }],
          values: { staff_id: row.staff_id || '' },
          onSubmit: (v) => api.assignStaff(row.id, v.staff_id),
          onDone: () => { toast.success('Petugas ditetapkan.'); reload(); },
        });
      }

      if (act === 'confirm') {
        return runStatus(row, 'confirmed', {
          title: 'Konfirmasi booking?',
          message: `Booking ${row.booking_code} akan dikonfirmasi dengan petugas ${staffName(row.staff_id)}.`,
          confirmText: 'Ya, konfirmasi', ok: 'Booking dikonfirmasi.',
        }, reload);
      }

      if (act === 'complete') {
        return runStatus(row, 'completed', {
          title: 'Selesaikan booking?',
          message: `Booking ${row.booking_code} ditandai selesai dan tidak dapat diubah lagi.`,
          confirmText: 'Ya, selesaikan', ok: 'Booking diselesaikan.',
        }, reload);
      }

      if (act === 'cancel') {
        return openFormModal({
          title: 'Batalkan booking',
          note: `Booking ${row.booking_code} yang dibatalkan tidak dapat diaktifkan kembali.`,
          submitText: 'Batalkan booking',
          fields: [{
            id: 'reason', label: 'Alasan pembatalan', type: 'textarea', placeholder: 'Tulis alasan pembatalan',
            validate: (v) => (!v.trim() ? 'Alasan wajib diisi.' : v.trim().length > 300 ? 'Maksimal 300 karakter.' : ''),
          }],
          onSubmit: (v) => api.cancelBooking(row.id, v.reason.trim()),
          onDone: () => { toast.success('Booking dibatalkan.'); reload(); },
        });
      }
    },
  });
}
