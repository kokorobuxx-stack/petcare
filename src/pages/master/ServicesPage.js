import { statusBadge } from '../../components/StatusBadge.js';
import { listPage, actionButtons } from '../../components/ListPage.js';
import { openFormModal } from '../../components/FormModal.js';
import { confirmDialog } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { formatRupiah } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import * as api from '../../services/serviceService.js';

const CATEGORY = {
  pemeriksaan: 'Pemeriksaan', vaksinasi: 'Vaksinasi', grooming: 'Grooming', perawatan_lainnya: 'Perawatan lainnya',
};
const categoryOptions = Object.entries(CATEGORY).map(([value, label]) => ({ value, label }));

const fields = [
  { id: 'name', label: 'Nama layanan', placeholder: 'Contoh: Pemeriksaan Umum',
    validate: (v) => (!v.trim() ? 'Nama layanan wajib diisi.' : v.trim().length > 100 ? 'Maksimal 100 karakter.' : '') },
  { id: 'category', label: 'Kategori', type: 'select', options: categoryOptions },
  { id: 'description', label: 'Deskripsi (opsional)', type: 'textarea', placeholder: 'Keterangan singkat layanan' },
  { id: 'price', label: 'Harga (Rp)', type: 'number', min: 0, step: '1000', placeholder: '75000',
    validate: (v) => {
      if (v === '') return 'Harga wajib diisi.';
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return 'Harga tidak boleh negatif.';
      if (n > 1e9) return 'Harga terlalu besar.';
      return '';
    } },
  { id: 'duration_minutes', label: 'Durasi (menit)', type: 'number', min: 1, step: '1', placeholder: '30',
    validate: (v) => {
      const n = Number(v);
      if (v === '' || !Number.isInteger(n) || n < 1) return 'Durasi harus bilangan bulat lebih dari 0.';
      if (n > 1440) return 'Durasi maksimal 1440 menit.';
      return '';
    } },
  { id: 'is_active', label: 'Layanan aktif (bisa dipilih saat booking)', type: 'checkbox' },
];

const toPayload = (v) => ({
  name: v.name.trim(),
  category: v.category,
  description: v.description.trim() || null,
  price: Number(v.price),
  duration_minutes: parseInt(v.duration_minutes, 10),
  is_active: v.is_active,
});

export function servicesPage(role) {
  const isAdmin = role === 'admin';

  const columns = [
    { label: 'Layanan', html: (r) => `<strong>${escapeText(r.name)}</strong>${r.description ? `<br><span class="muted small">${escapeText(r.description)}</span>` : ''}` },
    { label: 'Kategori', text: (r) => CATEGORY[r.category] || r.category },
    { label: 'Harga', text: (r) => formatRupiah(r.price) },
    { label: 'Durasi', text: (r) => `${r.duration_minutes} menit` },
    { label: 'Status', html: (r) => statusBadge(r.deleted_at ? 'archived' : r.is_active ? 'active' : 'inactive') },
  ];
  if (isAdmin) {
    columns.push({
      label: 'Aksi',
      html: (r) => actionButtons(r, r.deleted_at
        ? [{ act: 'restore', label: 'Pulihkan', icon: 'archive-restore' }]
        : [{ act: 'edit', label: 'Ubah', icon: 'pencil' }, { act: 'archive', label: 'Arsipkan', icon: 'archive' }]),
    });
  }

  const filters = [
    { id: 'category', label: 'Kategori', options: [{ value: '', label: 'Semua kategori' }, ...categoryOptions] },
  ];
  if (isAdmin) {
    filters.push(
      { id: 'status', label: 'Status', options: [
        { value: '', label: 'Semua status' }, { value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }] },
      { id: 'archive', label: 'Arsip', options: [
        { value: '', label: 'Tidak diarsipkan' }, { value: 'only', label: 'Diarsipkan' }] }
    );
  }

  return listPage({
    title: 'Layanan',
    subtitle: isAdmin ? 'Kelola layanan dan harga klinik.' : 'Daftar layanan yang tersedia.',
    headerActions: isAdmin
      ? '<button class="btn btn--primary" data-act="add"><i data-lucide="plus" class="ico" aria-hidden="true"></i><span>Tambah layanan</span></button>'
      : '',
    searchPlaceholder: 'Cari nama layanan...',
    filters,
    columns,
    load: api.listServices,
    emptyTitle: 'Belum ada layanan',
    emptyText: isAdmin ? 'Klik "Tambah layanan" untuk membuat layanan pertama.' : 'Layanan akan tampil di sini.',
    async onAction(act, row, { reload }) {
      if (act === 'add') {
        return openFormModal({
          title: 'Tambah layanan', fields,
          values: { category: 'pemeriksaan', is_active: true },
          onSubmit: (v) => api.createService(toPayload(v)),
          onDone: () => { toast.success('Layanan berhasil ditambahkan.'); reload(); },
        });
      }
      if (!row) return;
      if (act === 'edit') {
        return openFormModal({
          title: 'Ubah layanan', fields, values: row,
          note: 'Perubahan harga tidak memengaruhi booking yang sudah dibuat (memakai harga saat booking).',
          onSubmit: (v) => api.updateService(row.id, toPayload(v)),
          onDone: () => { toast.success('Layanan berhasil diperbarui.'); reload(); },
        });
      }
      const archive = act === 'archive';
      const ok = await confirmDialog({
        title: archive ? 'Arsipkan layanan?' : 'Pulihkan layanan?',
        message: archive
          ? `Layanan "${row.name}" tidak akan muncul lagi di daftar. Riwayat booking lama tetap utuh.`
          : `Layanan "${row.name}" akan ditampilkan kembali.`,
        confirmText: archive ? 'Ya, arsipkan' : 'Ya, pulihkan',
        danger: archive,
      });
      if (!ok) return;
      try {
        await (archive ? api.archiveService(row.id) : api.restoreService(row.id));
        toast.success(archive ? 'Layanan diarsipkan.' : 'Layanan dipulihkan.');
        reload();
      } catch (e) {
        console.error(e);
        toast.error(mapError(e));
      }
    },
  });
}

function escapeText(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}