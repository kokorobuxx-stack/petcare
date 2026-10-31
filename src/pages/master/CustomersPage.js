import { escapeHtml } from '../../utils/dom.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { listPage, actionButtons } from '../../components/ListPage.js';
import { openFormModal } from '../../components/FormModal.js';
import { openModal, confirmDialog } from '../../components/Modal.js';
import { dataTable } from '../../components/DataTable.js';
import { renderIcons } from '../../components/icons.js';
import { toast } from '../../components/Toast.js';
import { formatDate } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import { checkName, checkPhone, checkEmail, normalizePhone } from '../../utils/validators.js';
import { bookingsTable } from '../dashboard/dashboardUi.js';
import * as api from '../../services/customerService.js';

const SPECIES = { kucing: 'Kucing', anjing: 'Anjing', kelinci: 'Kelinci', burung: 'Burung', lainnya: 'Lainnya' };
const GENDER = { jantan: 'Jantan', betina: 'Betina', tidak_diketahui: 'Tidak diketahui' };

const typeBadge = (r) =>
  r.profile_id ? '<span class="badge badge--info">Akun</span>' : '<span class="badge">Walk-in</span>';

function buildFields(row) {
  const locked = Boolean(row?.profile_id);
  return [
    { id: 'full_name', label: 'Nama lengkap', placeholder: 'Nama pelanggan', disabled: locked, validate: checkName },
    { id: 'phone', label: 'Nomor telepon', type: 'tel', placeholder: '081234567890', disabled: locked, validate: checkPhone },
    { id: 'email', label: 'Email (opsional)', type: 'email', placeholder: 'nama@email.com',
      validate: (v) => (v.trim() ? checkEmail(v) : '') },
    { id: 'address', label: 'Alamat (opsional)', type: 'textarea', placeholder: 'Alamat pelanggan' },
    { id: 'notes', label: 'Catatan (opsional)', type: 'textarea', placeholder: 'Catatan internal' },
  ];
}

const toPayload = (v) => ({
  full_name: v.full_name?.trim(),
  phone: v.phone ? normalizePhone(v.phone) : undefined,
  email: v.email.trim() || null,
  address: v.address.trim() || null,
  notes: v.notes.trim() || null,
});

async function showDetail(row) {
  const m = openModal({ title: 'Detail pelanggan', body: '<div class="skeleton sk-block"></div>' });
  m.el.querySelector('.modal').classList.add('modal--wide');
  try {
    const d = await api.getCustomerDetail(row.id);
    if (!m.el.isConnected) return;
    m.body.innerHTML = `
      <dl class="info-list">
        <dt>Nama</dt><dd>${escapeHtml(row.full_name)} ${typeBadge(row)}</dd>
        <dt>Telepon</dt><dd>${escapeHtml(row.phone || '-')}</dd>
        <dt>Email</dt><dd>${escapeHtml(row.email || '-')}</dd>
        <dt>Alamat</dt><dd>${escapeHtml(row.address || '-')}</dd>
        <dt>Catatan</dt><dd>${escapeHtml(row.notes || '-')}</dd>
        <dt>Terdaftar</dt><dd>${formatDate(row.created_at)}</dd>
      </dl>
      <h3 class="card__title detail-h">Hewan peliharaan</h3>
      ${dataTable({
        columns: [
          { label: 'Nama', key: 'name' },
          { label: 'Jenis', text: (r) => SPECIES[r.species] || r.species },
          { label: 'Ras', text: (r) => r.breed || '-' },
          { label: 'Kelamin', text: (r) => GENDER[r.gender] || r.gender },
        ],
        rows: d.pets, emptyTitle: 'Belum ada hewan', emptyText: 'Hewan pelanggan ini belum dicatat.',
      })}
      <h3 class="card__title detail-h">Riwayat booking (10 terakhir)</h3>
      ${bookingsTable(d.bookings, { showCustomer: false, emptyTitle: 'Belum ada booking', emptyText: 'Riwayat booking akan tampil di sini.' })}`;
  } catch (e) {
    console.error(e);
    m.body.innerHTML = '<p class="muted" data-err></p>';
    m.body.querySelector('[data-err]').textContent = mapError(e);
  }
  renderIcons();
}

export function customersPage(role) {
  const isAdmin = role === 'admin';

  const columns = [
    { label: 'Nama', html: (r) => `<strong>${escapeHtml(r.full_name)}</strong>` },
    { label: 'Telepon', text: (r) => r.phone || '-' },
    { label: 'Email', text: (r) => r.email || '-' },
    { label: 'Jenis', html: (r) => (r.deleted_at ? statusBadge('archived') : typeBadge(r)) },
    { label: 'Terdaftar', text: (r) => formatDate(r.created_at) },
    {
      label: 'Aksi',
      html: (r) => actionButtons(r, [
        { act: 'detail', label: 'Detail', icon: 'eye' },
        ...(r.deleted_at ? [] : [{ act: 'edit', label: 'Ubah', icon: 'pencil' }]),
        ...(isAdmin
          ? [r.deleted_at
            ? { act: 'restore', label: 'Pulihkan', icon: 'archive-restore' }
            : { act: 'archive', label: 'Arsipkan', icon: 'archive' }]
          : []),
      ]),
    },
  ];

  const filters = [
    { id: 'type', label: 'Jenis', options: [
      { value: '', label: 'Semua jenis' }, { value: 'akun', label: 'Ber-akun' }, { value: 'walkin', label: 'Walk-in' }] },
  ];
  if (isAdmin) {
    filters.push({ id: 'archive', label: 'Arsip', options: [
      { value: '', label: 'Tidak diarsipkan' }, { value: 'only', label: 'Diarsipkan' }] });
  }

  return listPage({
    title: 'Pelanggan',
    subtitle: 'Data pelanggan ber-akun dan pelanggan walk-in.',
    headerActions: '<button class="btn btn--primary" data-act="add"><i data-lucide="user-plus" class="ico" aria-hidden="true"></i><span>Tambah walk-in</span></button>',
    searchPlaceholder: 'Cari nama atau telepon...',
    filters, columns,
    load: api.listCustomers,
    emptyTitle: 'Belum ada pelanggan',
    emptyText: 'Klik "Tambah walk-in" untuk mencatat pelanggan yang datang langsung.',
    async onAction(act, row, { reload }) {
      if (act === 'add') {
        return openFormModal({
          title: 'Tambah pelanggan walk-in', fields: buildFields(null), submitText: 'Simpan',
          note: 'Pelanggan walk-in tidak memerlukan akun login. Nomor telepon wajib diisi.',
          onSubmit: (v) => api.createWalkin(toPayload(v)),
          onDone: () => { toast.success('Pelanggan walk-in berhasil ditambahkan.'); reload(); },
        });
      }
      if (!row) return;
      if (act === 'detail') return showDetail(row);
      if (act === 'edit') {
        return openFormModal({
          title: 'Ubah pelanggan', fields: buildFields(row), values: row,
          note: row.profile_id ? 'Nama dan telepon pelanggan ber-akun hanya bisa diubah oleh pemilik akun lewat profilnya.' : '',
          onSubmit: (v) => api.updateCustomer(row, toPayload(v)),
          onDone: () => { toast.success('Data pelanggan diperbarui.'); reload(); },
        });
      }
      const archive = act === 'archive';
      const ok = await confirmDialog({
        title: archive ? 'Arsipkan pelanggan?' : 'Pulihkan pelanggan?',
        message: archive
          ? `"${row.full_name}" dan hewannya akan diarsipkan. Pelanggan yang masih punya booking aktif akan ditolak.`
          : `"${row.full_name}" dan hewannya akan ditampilkan kembali.`,
        confirmText: archive ? 'Ya, arsipkan' : 'Ya, pulihkan',
        danger: archive,
      });
      if (!ok) return;
      try {
        await (archive ? api.archiveCustomer(row.id) : api.restoreCustomer(row.id));
        toast.success(archive ? 'Pelanggan diarsipkan.' : 'Pelanggan dipulihkan.');
        reload();
      } catch (e) {
        console.error(e);
        toast.error(mapError(e));
      }
    },
  });
}