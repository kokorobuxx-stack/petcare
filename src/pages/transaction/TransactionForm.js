import { openModal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { escapeHtml } from '../../utils/dom.js';
import { formatRupiah, formatDateTime } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import * as api from '../../services/transactionService.js';

export async function openTransactionForm({ replaceOf = null, onDone } = {}) {
  const m = openModal({
    title: replaceOf ? 'Buat transaksi pengganti' : 'Buat transaksi',
    body: '<div class="skeleton sk-block"></div>',
  });
  m.el.querySelector('.modal').classList.add('modal--wide');

  const stop = (text) => {
    m.body.innerHTML = '<p class="muted" data-err></p>';
    m.body.querySelector('[data-err]').textContent = text;
  };

  let options;
  try {
    if (replaceOf) {
      const items = await api.getBookingItems(replaceOf.booking_id);
      options = [{
        id: replaceOf.booking_id,
        code: replaceOf.bookings?.booking_code || '-',
        who: replaceOf.bookings?.customers?.full_name || '',
        scheduled_at: replaceOf.bookings?.scheduled_at,
        subtotal: api.subtotalOf(items),
      }];
    } else {
      options = await api.getBillableBookings();
    }
  } catch (e) {
    console.error(e);
    if (m.el.isConnected) stop(mapError(e));
    return;
  }
  if (!m.el.isConnected) return;
  if (!options.length) {
    return stop('Belum ada booking selesai yang siap ditagih. Selesaikan booking terlebih dahulu di menu Booking.');
  }

  const methodOpts = Object.entries(api.PAYMENT_METHOD)
    .map(([v, l]) => `<option value="${v}" ${replaceOf?.payment_method === v ? 'selected' : ''}>${l}</option>`).join('');

  const form = document.createElement('form');
  form.noValidate = true;
  form.className = 'auth-form';
  form.innerHTML = `
    <div class="alert alert--danger" data-msg hidden></div>
    <p class="muted">${replaceOf
      ? `Transaksi ini menggantikan ${escapeHtml(replaceOf.transaction_code)} yang sudah dibatalkan.`
      : 'Subtotal dihitung sistem dari layanan pada booking.'}</p>
    <div class="field"><label for="tx_booking">Booking</label>
      ${replaceOf
        ? `<input class="input" id="tx_booking" value="${escapeHtml(options[0].code)} — ${escapeHtml(options[0].who)}" disabled />`
        : `<select class="input" id="tx_booking">
            <option value="">Pilih booking selesai...</option>
            ${options.map((o) => `<option value="${escapeHtml(o.id)}">${escapeHtml(o.code)} — ${escapeHtml(o.who)} (${escapeHtml(formatDateTime(o.scheduled_at))})</option>`).join('')}
          </select>`}
      <span class="field__error" id="tx_bookingErr"></span></div>
    <div class="field"><label for="tx_discount">Diskon (Rp)</label>
      <input class="input" id="tx_discount" type="number" min="0" step="1" value="0" />
      <span class="pw-hint" data-sum>Pilih booking untuk melihat subtotal.</span>
      <span class="field__error" id="tx_discountErr"></span></div>
    <div class="field"><label for="tx_method">Metode pembayaran</label>
      <select class="input" id="tx_method">${methodOpts}</select></div>
    <div class="field"><label for="tx_status">Status pembayaran</label>
      <select class="input" id="tx_status">
        <option value="belum_bayar">Belum bayar</option>
        <option value="lunas">Lunas (pembayaran sudah diterima)</option>
      </select></div>
    <div class="field"><label for="tx_notes">Catatan (opsional)</label>
      <textarea class="input" id="tx_notes" placeholder="Catatan pembayaran"></textarea>
      <span class="field__error" id="tx_notesErr"></span></div>
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" data-cancel>Batal</button>
      <button type="submit" class="btn btn--primary" data-submit>Simpan transaksi</button>
    </div>`;
  m.body.replaceChildren(form);

  const $ = (id) => form.querySelector('#' + id);
  const sum = form.querySelector('[data-sum]');
  const msg = form.querySelector('[data-msg]');
  const submitBtn = form.querySelector('[data-submit]');
  const setErr = (id, text) => { $(id + 'Err').textContent = text || ''; return Boolean(text); };
  form.querySelector('[data-cancel]').addEventListener('click', () => m.close());

  const selected = () => options.find((o) => o.id === (replaceOf ? replaceOf.booking_id : $('tx_booking').value));
  const discountValue = () => {
    const s = $('tx_discount').value.trim();
    return s === '' ? 0 : Number(s);
  };
  const updateSum = () => {
    const o = selected();
    if (!o) { sum.textContent = 'Pilih booking untuk melihat subtotal.'; return; }
    const d = Number.isFinite(discountValue()) ? discountValue() : 0;
    sum.textContent = `Subtotal ${formatRupiah(o.subtotal)} − Diskon ${formatRupiah(d)} = Total ${formatRupiah(o.subtotal - d)}`;
  };
  $('tx_discount').addEventListener('input', updateSum);
  if (!replaceOf) $('tx_booking').addEventListener('change', updateSum);
  updateSum();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    msg.hidden = true;

    const o = selected();
    const d = discountValue();
    const notes = $('tx_notes').value.trim();
    let bad = false;
    bad = setErr('tx_booking', o ? '' : 'Pilih booking.') || bad;
    bad = setErr('tx_discount',
      !Number.isFinite(d) || d < 0 ? 'Diskon tidak boleh negatif.'
        : o && d > o.subtotal ? 'Diskon tidak boleh melebihi subtotal.' : '') || bad;
    bad = setErr('tx_notes', notes.length > 300 ? 'Maksimal 300 karakter.' : '') || bad;
    if (bad) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
      await api.createTransaction({
        booking_id: o.id,
        discount: d,
        payment_method: $('tx_method').value,
        payment_status: $('tx_status').value,
        notes: notes || null,
        replaces_transaction_id: replaceOf?.id || null,
      });
    } catch (err) {
      console.error(err);
      msg.textContent = mapError(err);
      msg.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan transaksi';
      return;
    }
    m.close();
    toast.success('Transaksi berhasil dicatat.');
    onDone?.();
  });
}