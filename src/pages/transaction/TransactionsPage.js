import { escapeHtml } from '../../utils/dom.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { listPage } from '../../components/ListPage.js';
import { dataTable } from '../../components/DataTable.js';
import { openFormModal } from '../../components/FormModal.js';
import { openModal, confirmDialog } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { formatDateTime, formatRupiah } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import * as api from '../../services/transactionService.js';
import { openTransactionForm } from './TransactionForm.js';

const METHOD = api.PAYMENT_METHOD;

const discountCheck = (subtotal) => (v) => {
  const s = String(v ?? '').trim();
  if (s === '') return '';
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 'Diskon tidak boleh negatif.';
  if (n > Number(subtotal)) return 'Diskon tidak boleh melebihi subtotal.';
  return '';
};
const notesCheck = (v) => (String(v || '').trim().length > 300 ? 'Maksimal 300 karakter.' : '');

export function transactionsPage(role) {
  const isAdmin = role === 'admin';
  const isCustomer = role === 'customer';

  const actionsFor = (r) => {
    const a = [{ act: 'detail', label: 'Detail' }];
    if (isCustomer) return a;
    if (r.payment_status === 'belum_bayar') {
      a.push({ act: 'edit', label: 'Ubah' },
        { act: 'pay', label: 'Tandai lunas', primary: true },
        { act: 'cancel', label: 'Batalkan' });
    } else if (r.payment_status === 'lunas' && isAdmin) {
      a.push({ act: 'notes', label: 'Ubah catatan' }, { act: 'cancel', label: 'Batalkan' });
    } else if (r.payment_status === 'dibatalkan') {
      a.push({ act: 'replace', label: 'Buat pengganti' });
    }
    return a;
  };

  const columns = [
    { label: 'Kode', html: (r) => `<span class="mono">${escapeHtml(r.transaction_code)}</span>` },
    { label: 'Booking', text: (r) => r.bookings?.booking_code || '-' },
    !isCustomer && { label: 'Pelanggan', text: (r) => r.bookings?.customers?.full_name || '-' },
    { label: 'Subtotal', text: (r) => formatRupiah(r.subtotal) },
    { label: 'Diskon', text: (r) => formatRupiah(r.discount) },
    { label: 'Total', html: (r) => `<strong>${escapeHtml(formatRupiah(r.total_amount))}</strong>` },
    { label: 'Metode', text: (r) => METHOD[r.payment_method] || r.payment_method },
    { label: 'Status', html: (r) => statusBadge(r.payment_status) },
    { label: 'Dibayar', text: (r) => formatDateTime(r.paid_at) },
    {
      label: 'Aksi',
      html: (r) => `<div class="row-actions">${actionsFor(r).map((a) =>
        `<button class="btn ${a.primary ? 'btn--primary' : 'btn--ghost'} btn--sm" type="button" data-act="${a.act}" data-id="${escapeHtml(r.id)}">${escapeHtml(a.label)}</button>`).join('')}</div>`,
    },
  ].filter(Boolean);

  const filters = [
    { id: 'status', label: 'Status pembayaran', options: [
      { value: '', label: 'Semua status' }, { value: 'belum_bayar', label: 'Belum bayar' },
      { value: 'lunas', label: 'Lunas' }, { value: 'dibatalkan', label: 'Dibatalkan' }] },
    { id: 'method', label: 'Metode', options: [
      { value: '', label: 'Semua metode' },
      ...Object.entries(METHOD).map(([value, label]) => ({ value, label }))] },
  ];

  async function showDetail(r) {
    const m = openModal({ title: 'Detail transaksi', body: '<div class="skeleton sk-block"></div>' });
    m.el.querySelector('.modal').classList.add('modal--wide');
    try {
      const { items, replaces, replacedBy } = await api.getTransactionDetail(r);
      if (!m.el.isConnected) return;
      m.body.innerHTML = `
        <dl class="info-list">
          <dt>Kode</dt><dd>${escapeHtml(r.transaction_code)}</dd>
          <dt>Status</dt><dd>${statusBadge(r.payment_status)}</dd>
          <dt>Booking</dt><dd>${escapeHtml(r.bookings?.booking_code || '-')}</dd>
          ${isCustomer ? '' : `<dt>Pelanggan</dt><dd>${escapeHtml(r.bookings?.customers?.full_name || '-')}</dd>`}
          <dt>Hewan</dt><dd>${escapeHtml(r.bookings?.pets?.name || '-')}</dd>
          <dt>Subtotal</dt><dd>${escapeHtml(formatRupiah(r.subtotal))}</dd>
          <dt>Diskon</dt><dd>${escapeHtml(formatRupiah(r.discount))}</dd>
          <dt>Total</dt><dd><strong>${escapeHtml(formatRupiah(r.total_amount))}</strong></dd>
          <dt>Metode</dt><dd>${escapeHtml(METHOD[r.payment_method] || r.payment_method)}</dd>
          <dt>Dibuat</dt><dd>${escapeHtml(formatDateTime(r.created_at))}</dd>
          <dt>Dibayar</dt><dd>${escapeHtml(formatDateTime(r.paid_at))}</dd>
          <dt>Catatan</dt><dd>${escapeHtml(r.notes || '-')}</dd>
          ${r.payment_status === 'dibatalkan' ? `
            <dt>Dibatalkan</dt><dd>${escapeHtml(formatDateTime(r.cancelled_at))}</dd>
            <dt>Alasan batal</dt><dd>${escapeHtml(r.cancel_reason || '-')}</dd>` : ''}
          ${replaces ? `<dt>Menggantikan</dt><dd>${escapeHtml(replaces)}</dd>` : ''}
          ${replacedBy ? `<dt>Digantikan oleh</dt><dd>${escapeHtml(replacedBy)}</dd>` : ''}
        </dl>
        <h3 class="card__title detail-h">Layanan (harga saat booking)</h3>
        ${dataTable({
          columns: [
            { label: 'Layanan', text: (i) => i.service_name },
            { label: 'Harga', text: (i) => formatRupiah(i.unit_price) },
            { label: 'Jumlah', text: (i) => String(i.quantity || 1) },
            { label: 'Subtotal', text: (i) => formatRupiah(Number(i.unit_price) * Number(i.quantity || 1)) },
          ],
          rows: items, emptyTitle: 'Tidak ada layanan',
        })}`;
    } catch (e) {
      console.error(e);
      m.body.innerHTML = '<p class="muted" data-err></p>';
      m.body.querySelector('[data-err]').textContent = mapError(e);
    }
  }

  return listPage({
    title: isCustomer ? 'Transaksi Saya' : 'Transaksi',
    subtitle: isCustomer
      ? 'Riwayat pembayaran untuk booking Anda.'
      : 'Catat pembayaran booking yang sudah selesai. Subtotal dihitung sistem dari layanan.',
    headerActions: isCustomer ? '' : '<button class="btn btn--primary" data-act="add"><span>Buat transaksi</span></button>',
    searchPlaceholder: 'Cari kode transaksi...',
    filters, columns,
    load: api.listTransactions,
    emptyTitle: 'Belum ada transaksi',
    emptyText: isCustomer
      ? 'Transaksi akan tampil di sini setelah booking Anda selesai dan dicatat klinik.'
      : 'Selesaikan booking lalu klik "Buat transaksi".',
    async onAction(act, row, { reload }) {
      if (act === 'add') return openTransactionForm({ onDone: reload });
      if (!row) return;
      if (act === 'detail') return showDetail(row);
      if (act === 'replace') return openTransactionForm({ replaceOf: row, onDone: reload });

      if (act === 'edit') {
        return openFormModal({
          title: 'Ubah transaksi',
          note: `Subtotal ${formatRupiah(row.subtotal)} (dihitung sistem, tidak dapat diubah).`,
          values: row,
          fields: [
            { id: 'discount', label: 'Diskon (Rp)', type: 'number', min: 0, step: '1', validate: discountCheck(row.subtotal) },
            { id: 'payment_method', label: 'Metode pembayaran', type: 'select',
              options: Object.entries(METHOD).map(([value, label]) => ({ value, label })) },
            { id: 'notes', label: 'Catatan (opsional)', type: 'textarea', validate: notesCheck },
          ],
          onSubmit: (v) => api.updateTransaction(row.id, {
            discount: Number(String(v.discount).trim() || 0),
            payment_method: v.payment_method,
            notes: v.notes.trim() || null,
          }),
          onDone: () => { toast.success('Transaksi diperbarui.'); reload(); },
        });
      }

      if (act === 'notes') {
        return openFormModal({
          title: 'Ubah catatan',
          note: 'Nominal transaksi lunas tidak dapat diubah.',
          values: row,
          fields: [{ id: 'notes', label: 'Catatan', type: 'textarea', validate: notesCheck }],
          onSubmit: (v) => api.updateNotes(row.id, v.notes.trim() || null),
          onDone: () => { toast.success('Catatan diperbarui.'); reload(); },
        });
      }

      if (act === 'pay') {
        const ok = await confirmDialog({
          title: 'Tandai lunas?',
          message: `${row.transaction_code}: ${formatRupiah(row.total_amount)} via ${METHOD[row.payment_method] || row.payment_method}. Setelah lunas, transaksi tidak dapat diubah oleh Petugas.`,
          confirmText: 'Ya, tandai lunas',
        });
        if (!ok) return;
        try {
          await api.markPaid(row.id);
          toast.success('Transaksi ditandai lunas.');
          reload();
        } catch (e) {
          console.error(e);
          toast.error(mapError(e));
        }
        return;
      }

      if (act === 'cancel') {
        return openFormModal({
          title: 'Batalkan transaksi',
          note: `${row.transaction_code} yang dibatalkan bersifat final. Untuk koreksi, buat transaksi pengganti.`,
          submitText: 'Batalkan transaksi',
          fields: [{
            id: 'reason', label: 'Alasan pembatalan', type: 'textarea', placeholder: 'Tulis alasan pembatalan',
            validate: (v) => (!v.trim() ? 'Alasan wajib diisi.' : v.trim().length > 300 ? 'Maksimal 300 karakter.' : ''),
          }],
          onSubmit: (v) => api.cancelTransaction(row.id, v.reason.trim()),
          onDone: () => { toast.success('Transaksi dibatalkan.'); reload(); },
        });
      }
    },
  });
}