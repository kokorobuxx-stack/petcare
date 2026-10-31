import { escapeHtml } from '../../utils/dom.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { listPage, actionButtons } from '../../components/ListPage.js';
import { openFormModal } from '../../components/FormModal.js';
import { openModal, confirmDialog } from '../../components/Modal.js';
import { renderIcons } from '../../components/icons.js';
import { toast } from '../../components/Toast.js';
import { formatDate } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import { bookingsTable } from '../dashboard/dashboardUi.js';
import * as api from '../../services/petService.js';

const SPECIES = { kucing: 'Kucing', anjing: 'Anjing', kelinci: 'Kelinci', burung: 'Burung', lainnya: 'Lainnya' };
const GENDER = { jantan: 'Jantan', betina: 'Betina', tidak_diketahui: 'Tidak diketahui' };
const opts = (m) => Object.entries(m).map(([value, label]) => ({ value, label }));

const todayYmd = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

function ageText(d) {
  if (!d) return '-';
  const b = new Date(d + 'T00:00:00');
  const n = new Date();
  let m = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) m--;
  if (m < 0) return '-';
  if (m < 12) return `${m} bulan`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${y} tahun ${r} bulan` : `${y} tahun`;
}

function buildFields({ ownerOptions = null, ownerLocked = false } = {}) {
  const f = [];
  if (ownerOptions) {
    f.push({
      id: 'customer_id', label: 'Pemilik', type: 'select', disabled: ownerLocked,
      options: [{ value: '', label: 'Pilih pemilik...' }, ...ownerOptions],
      validate: (v) => (v ? '' : 'Pilih pemilik hewan.'),
    });
  }
  f.push(
    { id: 'name', label: 'Nama hewan', placeholder: 'Contoh: Mochi',
      validate: (v) => (!v.trim() ? 'Nama hewan wajib diisi.' : v.trim().length > 60 ? 'Maksimal 60 karakter.' : '') },
    { id: 'species', label: 'Jenis', type: 'select', options: opts(SPECIES) },
    { id: 'breed', label: 'Ras (opsional)', placeholder: 'Contoh: Persia' },
    { id: 'birth_date', label: 'Tanggal lahir (opsional)', type: 'date',
      validate: (v) => (v && v > todayYmd() ? 'Tanggal lahir tidak boleh di masa depan.' : '') },
    { id: 'gender', label: 'Jenis kelamin', type: 'select', options: opts(GENDER) },
    { id: 'notes', label: 'Catatan (opsional)', type: 'textarea', placeholder: 'Alergi, kebiasaan, dll.' },
  );
  return f;
}

const toPayload = (v) => ({
  customer_id: v.customer_id,
  name: v.name.trim(),
  species: v.species,
  breed: v.breed.trim() || null,
  birth_date: v.birth_date || null,
  gender: v.gender,
  notes: v.notes.trim() || null,
});

async function showDetail(row, showOwner) {
  const m = openModal({ title: 'Detail hewan', body: '<div class="skeleton sk-block"></div>' });
  m.el.querySelector('.modal').classList.add('modal--wide');
  try {
    const bookings = await api.getPetBookings(row.id);
    if (!m.el.isConnected) return;
    m.body.innerHTML = `
      <dl class="info-list">
        <dt>Nama</dt><dd>${escapeHtml(row.name)}</dd>
        ${showOwner ? `<dt>Pemilik</dt><dd>${escapeHtml(row.customers?.full_name || '-')}</dd>` : ''}
        <dt>Jenis</dt><dd>${escapeHtml(SPECIES[row.species] || row.species)}</dd>
        <dt>Ras</dt><dd>${escapeHtml(row.breed || '-')}</dd>
        <dt>Tanggal lahir</dt><dd>${row.birth_date ? `${formatDate(row.birth_date)} (${ageText(row.birth_date)})` : '-'}</dd>
        <dt>Kelamin</dt><dd>${escapeHtml(GENDER[row.gender] || row.gender)}</dd>
        <dt>Catatan</dt><dd>${escapeHtml(row.notes || '-')}</dd>
      </dl>
      <h3 class="card__title detail-h">Riwayat booking (10 terakhir)</h3>
      ${bookingsTable(bookings, { showCustomer: false, emptyTitle: 'Belum ada booking', emptyText: 'Riwayat booking hewan ini akan tampil di sini.' })}`;
  } catch (e) {
    console.error(e);
    m.body.innerHTML = '<p class="muted" data-err></p>';
    m.body.querySelector('[data-err]').textContent = mapError(e);
  }
  renderIcons();
}

export function petsPage(role) {
  const isAdmin = role === 'admin';
  const isCustomer = role === 'customer';

  const columns = [
    { label: 'Nama', html: (r) => `<strong>${escapeHtml(r.name)}</strong>` },
    !isCustomer && { label: 'Pemilik', text: (r) => r.customers?.full_name || '-' },
    { label: 'Jenis', text: (r) => SPECIES[r.species] || r.species },
    { label: 'Ras', text: (r) => r.breed || '-' },
    { label: 'Umur', text: (r) => ageText(r.birth_date) },
    { label: 'Kelamin', text: (r) => GENDER[r.gender] || r.gender },
    { label: 'Status', html: (r) => (r.deleted_at ? statusBadge('archived') : statusBadge('active')) },
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
  ].filter(Boolean);

  const filters = [
    { id: 'species', label: 'Jenis', options: [{ value: '', label: 'Semua jenis' }, ...opts(SPECIES)] },
    { id: 'gender', label: 'Kelamin', options: [{ value: '', label: 'Semua kelamin' }, ...opts(GENDER)] },
  ];
  if (isAdmin) {
    filters.push({ id: 'archive', label: 'Arsip', options: [
      { value: '', label: 'Tidak diarsipkan' }, { value: 'only', label: 'Diarsipkan' }] });
  }

  return listPage({
    title: isCustomer ? 'Hewan Saya' : 'Hewan',
    subtitle: isCustomer ? 'Kelola data hewan peliharaan Anda.' : 'Data hewan peliharaan semua pelanggan.',
    headerActions: '<button class="btn btn--primary" data-act="add"><i data-lucide="paw-print" class="ico" aria-hidden="true"></i><span>Tambah hewan</span></button>',
    searchPlaceholder: 'Cari nama atau ras hewan...',
    filters, columns,
    load: api.listPets,
    emptyTitle: 'Belum ada hewan',
    emptyText: 'Klik "Tambah hewan" untuk mencatat hewan pertama.',
    async onAction(act, row, { reload }) {
      if (act === 'add') {
        let ownerOptions = null;
        let myId = null;
        try {
          if (isCustomer) {
            myId = await api.getMyCustomerId();
            if (!myId) return toast.error('Data pelanggan untuk akun ini tidak ditemukan.');
          } else {
            ownerOptions = await api.getOwnerOptions();
            if (!ownerOptions.length) return toast.error('Belum ada pelanggan. Tambahkan pelanggan terlebih dahulu.');
          }
        } catch (e) {
          console.error(e);
          return toast.error(mapError(e));
        }
        return openFormModal({
          title: 'Tambah hewan', fields: buildFields({ ownerOptions }),
          values: { species: 'kucing', gender: 'tidak_diketahui' },
          onSubmit: (v) => api.createPet({ ...toPayload(v), customer_id: myId || v.customer_id }),
          onDone: () => { toast.success('Hewan berhasil ditambahkan.'); reload(); },
        });
      }
      if (!row) return;
      if (act === 'detail') return showDetail(row, !isCustomer);
      if (act === 'edit') {
        return openFormModal({
          title: 'Ubah hewan',
          fields: buildFields({
            ownerOptions: isCustomer ? null : [{ value: row.customer_id, label: row.customers?.full_name || '-' }],
            ownerLocked: true,
          }),
          values: row,
          note: isCustomer ? '' : 'Pemilik hewan tidak dapat diubah.',
          onSubmit: (v) => api.updatePet(row.id, toPayload(v)),
          onDone: () => { toast.success('Data hewan diperbarui.'); reload(); },
        });
      }
      const archive = act === 'archive';
      const ok = await confirmDialog({
        title: archive ? 'Arsipkan hewan?' : 'Pulihkan hewan?',
        message: archive
          ? `"${row.name}" akan diarsipkan. Hewan yang masih punya booking aktif akan ditolak.`
          : `"${row.name}" akan ditampilkan kembali.`,
        confirmText: archive ? 'Ya, arsipkan' : 'Ya, pulihkan',
        danger: archive,
      });
      if (!ok) return;
      try {
        await (archive ? api.archivePet(row.id) : api.restorePet(row.id));
        toast.success(archive ? 'Hewan diarsipkan.' : 'Hewan dipulihkan.');
        reload();
      } catch (e) {
        console.error(e);
        toast.error(mapError(e));
      }
    },
  });
}