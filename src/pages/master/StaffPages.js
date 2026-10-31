import { escapeHtml } from '../../utils/dom.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { listPage, actionButtons } from '../../components/ListPage.js';
import { openFormModal } from '../../components/FormModal.js';
import { openModal, confirmDialog } from '../../components/Modal.js';
import { renderIcons } from '../../components/icons.js';
import { toast } from '../../components/Toast.js';
import { getState } from '../../services/authService.js';
import { formatDate } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import { checkName, checkEmail, checkPhone, normalizePhone } from '../../utils/validators.js';
import { bookingsTable } from '../dashboard/dashboardUi.js';
import * as api from '../../services/staffService.js';
import * as adminApi from '../../services/staffAdminService.js';

const JOB = {
  dokter_hewan: 'Dokter hewan', paramedis: 'Paramedis', groomer: 'Groomer',
  resepsionis: 'Resepsionis', lainnya: 'Lainnya',
};
const jobOptions = Object.entries(JOB).map(([value, label]) => ({ value, label }));
const jobFilter = { id: 'job_title', label: 'Jabatan', options: [{ value: '', label: 'Semua jabatan' }, ...jobOptions] };
const statusFilter = {
  id: 'status', label: 'Status',
  options: [{ value: '', label: 'Semua status' }, { value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }],
};

const fields = [
  { id: 'job_title', label: 'Jabatan', type: 'select', options: jobOptions },
  { id: 'specialization', label: 'Spesialisasi (opsional)', placeholder: 'Contoh: Bedah, Kucing',
    validate: (v) => (v.trim().length > 100 ? 'Maksimal 100 karakter.' : '') },
];

const inviteFields = [
  { id: 'full_name', label: 'Nama lengkap', placeholder: 'Contoh: drh. Sari Dewi', validate: checkName },
  { id: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com', validate: checkEmail },
  { id: 'phone', label: 'Nomor telepon', type: 'tel', placeholder: '081234567890', validate: checkPhone },
  ...fields,
];

async function showDetail(row) {
  const m = openModal({ title: 'Detail petugas', body: '<div class="skeleton sk-block"></div>' });
  m.el.querySelector('.modal').classList.add('modal--wide');
  try {
    const bookings = await api.getStaffBookings(row.id);
    if (!m.el.isConnected) return;
    const live = !row.deleted_at && row.is_active && row.profiles?.is_active;
    m.body.innerHTML = `
      <dl class="info-list">
        <dt>Nama</dt><dd>${escapeHtml(row.profiles?.full_name || '-')}</dd>
        <dt>Telepon</dt><dd>${escapeHtml(row.profiles?.phone || '-')}</dd>
        <dt>Jabatan</dt><dd>${escapeHtml(JOB[row.job_title] || row.job_title)}</dd>
        <dt>Spesialisasi</dt><dd>${escapeHtml(row.specialization || '-')}</dd>
        <dt>Status</dt><dd>${statusBadge(row.deleted_at ? 'archived' : live ? 'active' : 'inactive')}</dd>
        <dt>Terdaftar</dt><dd>${formatDate(row.created_at)}</dd>
      </dl>
      <h3 class="card__title detail-h">Riwayat booking (10 terakhir)</h3>
      ${bookingsTable(bookings, { emptyTitle: 'Belum ada booking', emptyText: 'Booking yang ditangani petugas ini akan tampil di sini.' })}`;
  } catch (e) {
    console.error(e);
    m.body.innerHTML = '<p class="muted" data-err></p>';
    m.body.querySelector('[data-err]').textContent = mapError(e);
  }
  renderIcons();
}

// ---------- Admin: kelola petugas ----------
export function staffAdminPage() {
  const myId = getState().user.id;
  const isLive = (r) => r.is_active && r.profiles?.is_active;
  let pending = new Set(); // profile_id petugas yang belum pernah login

  async function load(params) {
    const res = await api.listStaff(params);
    try {
      pending = new Set(await adminApi.getPendingInvites(res.rows.map((r) => r.profile_id)));
    } catch (e) {
      console.error(e);
      pending = new Set();
    }
    return res;
  }

  const statusHtml = (r) => {
    if (r.deleted_at) return statusBadge('archived');
    if (pending.has(r.profile_id)) return '<span class="badge badge--info">Undangan terkirim</span>';
    return statusBadge(isLive(r) ? 'active' : 'inactive');
  };

  const columns = [
    { label: 'Nama', html: (r) => `<strong>${escapeHtml(r.profiles?.full_name || '-')}</strong>` },
    { label: 'Jabatan', text: (r) => JOB[r.job_title] || r.job_title },
    { label: 'Spesialisasi', text: (r) => r.specialization || '-' },
    { label: 'Telepon', text: (r) => r.profiles?.phone || '-' },
    { label: 'Status', html: statusHtml },
    {
      label: 'Aksi',
      html: (r) => {
        const self = r.profile_id === myId;
        const items = [{ act: 'detail', label: 'Detail', icon: 'eye' }];
        if (r.deleted_at) {
          items.push({ act: 'restore', label: 'Pulihkan', icon: 'archive-restore' });
        } else if (pending.has(r.profile_id)) {
          items.push({ act: 'edit', label: 'Ubah', icon: 'pencil' });
          items.push({ act: 'resend', label: 'Kirim ulang undangan', icon: 'refresh-cw' });
          items.push({ act: 'cancel_invite', label: 'Batalkan undangan', icon: 'x' });
        } else {
          items.push({ act: 'edit', label: 'Ubah', icon: 'pencil' });
          if (!self) {
            items.push(isLive(r)
              ? { act: 'deactivate', label: 'Nonaktifkan', icon: 'circle-x' }
              : { act: 'activate', label: 'Aktifkan', icon: 'circle-check' });
            items.push({ act: 'archive', label: 'Arsipkan', icon: 'archive' });
          }
        }
        return actionButtons(r, items);
      },
    },
  ];

  const confirmCfg = {
    deactivate: { title: 'Nonaktifkan petugas?', text: (n) => `"${n}" tidak bisa login dan tidak bisa ditugaskan ke booking baru.`, ok: 'Ya, nonaktifkan', danger: true, done: 'Petugas dinonaktifkan.' },
    activate: { title: 'Aktifkan petugas?', text: (n) => `"${n}" bisa login dan ditugaskan kembali.`, ok: 'Ya, aktifkan', danger: false, done: 'Petugas diaktifkan.' },
    archive: { title: 'Arsipkan petugas?', text: (n) => `"${n}" akan diarsipkan dan akunnya dinonaktifkan. Petugas yang masih punya booking aktif akan ditolak.`, ok: 'Ya, arsipkan', danger: true, done: 'Petugas diarsipkan.' },
    restore: { title: 'Pulihkan petugas?', text: (n) => `"${n}" dikembalikan dari arsip. Status aktifnya kembali seperti sebelum diarsipkan.`, ok: 'Ya, pulihkan', danger: false, done: 'Petugas dipulihkan.' },
    cancel_invite: { title: 'Batalkan undangan?', text: (n) => `Akun "${n}" akan dihapus permanen. Hanya bisa jika petugas belum pernah login dan belum punya riwayat data.`, ok: 'Ya, batalkan undangan', danger: true, done: 'Undangan dibatalkan.' },
  };

  return listPage({
    title: 'Petugas',
    subtitle: 'Kelola petugas klinik dan undang petugas baru.',
    headerActions: '<button class="btn btn--primary" data-act="add"><span>Undang petugas</span></button>',
    searchPlaceholder: 'Cari nama petugas...',
    filters: [jobFilter, statusFilter, { id: 'archive', label: 'Arsip', options: [
      { value: '', label: 'Tidak diarsipkan' }, { value: 'only', label: 'Diarsipkan' }] }],
    columns,
    load,
    emptyTitle: 'Belum ada petugas',
    emptyText: 'Klik "Undang petugas" untuk menambahkan petugas pertama.',
    async onAction(act, row, { reload }) {
      if (act === 'add') {
        let warning = '';
        return openFormModal({
          title: 'Undang petugas',
          note: 'Petugas menerima email berisi link untuk membuat password, lalu bisa login.',
          submitText: 'Kirim undangan',
          fields: inviteFields,
          values: { job_title: 'dokter_hewan' },
          async onSubmit(v) {
            const res = await adminApi.inviteStaff({
              full_name: v.full_name.trim(),
              email: v.email.trim().toLowerCase(),
              phone: normalizePhone(v.phone),
              job_title: v.job_title,
              specialization: v.specialization.trim(),
            });
            warning = res.warning || '';
          },
          onDone: () => {
            if (warning) toast.warning(warning);
            else toast.success('Undangan terkirim. Petugas menerima email untuk membuat password.');
            reload();
          },
        });
      }
      if (!row) return;
      if (act === 'detail') return showDetail(row);
      if (act === 'edit') {
        return openFormModal({
          title: `Ubah petugas: ${row.profiles?.full_name || ''}`, fields, values: row,
          note: 'Nama dan telepon diubah oleh petugas sendiri lewat profilnya.',
          onSubmit: (v) => api.updateStaff(row.id, {
            job_title: v.job_title, specialization: v.specialization.trim() || null }),
          onDone: () => { toast.success('Data petugas diperbarui.'); reload(); },
        });
      }
      if (act === 'resend') {
        try {
          await adminApi.resendInvite(row.id);
          toast.success('Undangan dikirim ulang.');
        } catch (e) {
          console.error(e);
          toast.error(mapError(e));
        }
        return;
      }
      const c = confirmCfg[act];
      if (!c) return;
      const name = row.profiles?.full_name || 'Petugas';
      const ok = await confirmDialog({
        title: c.title, message: c.text(name), confirmText: c.ok, danger: c.danger });
      if (!ok) return;
      try {
        if (act === 'deactivate') await api.setStaffActive(row, false);
        else if (act === 'activate') await api.setStaffActive(row, true);
        else if (act === 'archive') await api.archiveStaff(row.id);
        else if (act === 'cancel_invite') await adminApi.cancelInvite(row.id);
        else await api.restoreStaff(row.id);
        toast.success(c.done);
        reload();
      } catch (e) {
        console.error(e);
        toast.error(mapError(e));
        reload();
      }
    },
  });
}

// ---------- Petugas: direktori (hanya baca) ----------
export function staffDirectoryPage() {
  return listPage({
    title: 'Direktori Petugas',
    subtitle: 'Daftar petugas klinik.',
    searchPlaceholder: 'Cari nama petugas...',
    filters: [jobFilter, statusFilter],
    columns: [
      { label: 'Nama', html: (r) => `<strong>${escapeHtml(r.full_name)}</strong>` },
      { label: 'Jabatan', text: (r) => JOB[r.job_title] || r.job_title },
      { label: 'Spesialisasi', text: (r) => r.specialization || '-' },
      { label: 'Status', html: (r) => statusBadge(r.is_active ? 'active' : 'inactive') },
    ],
    load: api.listDirectory,
    emptyTitle: 'Belum ada petugas',
    emptyText: 'Petugas akan tampil di sini.',
  });
}