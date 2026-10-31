import { openModal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { escapeHtml } from '../../utils/dom.js';
import { formatRupiah } from '../../utils/formatters.js';
import { mapError } from '../../utils/errors.js';
import { getOwnerOptions, getMyCustomerId } from '../../services/petService.js';
import * as api from '../../services/bookingService.js';

const SPECIES = { kucing: 'Kucing', anjing: 'Anjing', kelinci: 'Kelinci', burung: 'Burung', lainnya: 'Lainnya' };

// "YYYY-MM-DDTHH:mm" menurut jam Jakarta, untuk atribut min pada input waktu.
function nowLocalJakarta() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date()).replace(' ', 'T');
}

export async function openBookingForm({ role, onDone }) {
  const isCustomer = role === 'customer';
  const m = openModal({ title: 'Buat booking', body: '<div class="skeleton sk-block"></div>' });
  m.el.querySelector('.modal').classList.add('modal--wide');

  let services; let owners; let staff; let myId;
  try {
    [services, owners, staff, myId] = await Promise.all([
      api.getActiveServices(),
      isCustomer ? [] : getOwnerOptions(),
      isCustomer ? [] : api.getStaffOptions(role),
      isCustomer ? getMyCustomerId() : null,
    ]);
  } catch (e) {
    console.error(e);
    if (m.el.isConnected) m.body.innerHTML = '<p class="muted" data-err></p>';
    m.body.querySelector('[data-err]').textContent = mapError(e);
    return;
  }
  if (!m.el.isConnected) return;

  const stop = (text) => { m.body.innerHTML = '<p class="muted" data-err></p>'; m.body.querySelector('[data-err]').textContent = text; };
  if (isCustomer && !myId) return stop('Data pelanggan untuk akun ini tidak ditemukan.');
  if (!isCustomer && !owners.length) return stop('Belum ada pelanggan. Tambahkan pelanggan terlebih dahulu.');
  if (!services.length) return stop('Belum ada layanan aktif.');

  const activeStaff = staff.filter((s) => s.is_active);
  const svcHtml = services.map((s) => `
    <label class="check">
      <input type="checkbox" name="svc" value="${escapeHtml(s.id)}" data-price="${Number(s.price) || 0}" data-dur="${Number(s.duration_minutes) || 0}" />
      <span>${escapeHtml(s.name)} — ${formatRupiah(s.price)} · ${Number(s.duration_minutes)} menit</span>
    </label>`).join('');

  const form = document.createElement('form');
  form.noValidate = true;
  form.className = 'auth-form';
  form.innerHTML = `
    <div class="alert alert--danger" data-msg hidden></div>
    <p class="muted">${isCustomer
      ? 'Booking Anda berupa permintaan sampai dikonfirmasi petugas klinik.'
      : 'Booking dibuat berstatus menunggu. Petugas dapat ditetapkan sekarang atau nanti.'}</p>
    ${isCustomer ? '' : `
    <div class="field"><label for="bk_customer">Pelanggan</label>
      <select class="input" id="bk_customer">
        <option value="">Pilih pelanggan...</option>
        ${owners.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}
      </select><span class="field__error" id="bk_customerErr"></span></div>`}
    <div class="field"><label for="bk_pet">Hewan</label>
      <select class="input" id="bk_pet"></select><span class="field__error" id="bk_petErr"></span></div>
    <div class="field"><label>Layanan</label>
      <div class="check-list">${svcHtml}</div>
      <span class="pw-hint" data-summary>Belum ada layanan dipilih.</span>
      <span class="field__error" id="bk_svcErr"></span></div>
    <div class="field"><label for="bk_when">Tanggal dan jam (WIB)</label>
      <input class="input" id="bk_when" type="datetime-local" min="${nowLocalJakarta()}" />
      <span class="field__error" id="bk_whenErr"></span></div>
    ${isCustomer ? '' : `
    <div class="field"><label for="bk_staff">Petugas (opsional)</label>
      <select class="input" id="bk_staff">
        <option value="">Tetapkan nanti</option>
        ${activeStaff.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(api.JOB_LABEL[s.job_title] || s.job_title || '-')})</option>`).join('')}
      </select>
      <span class="pw-hint">Sistem memeriksa bentrok jadwal petugas saat disimpan.</span></div>`}
    <div class="field"><label for="bk_complaint">Keluhan (opsional)</label>
      <textarea class="input" id="bk_complaint" placeholder="Ceritakan keluhan atau keperluan hewan Anda"></textarea>
      <span class="field__error" id="bk_complaintErr"></span></div>
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" data-cancel>Batal</button>
      <button type="submit" class="btn btn--primary" data-submit>${isCustomer ? 'Kirim permintaan' : 'Buat booking'}</button>
    </div>`;
  m.body.replaceChildren(form);

  const $ = (id) => form.querySelector('#' + id);
  const petSel = $('bk_pet');
  const summary = form.querySelector('[data-summary]');
  const msg = form.querySelector('[data-msg]');
  const submitBtn = form.querySelector('[data-submit]');
  const setErr = (id, text) => {
    $(id + 'Err').textContent = text || '';
    return Boolean(text);
  };

  form.querySelector('[data-cancel]').addEventListener('click', () => m.close());

  const updateSummary = () => {
    let price = 0; let dur = 0; let n = 0;
    form.querySelectorAll('[name="svc"]:checked').forEach((c) => {
      price += Number(c.dataset.price); dur += Number(c.dataset.dur); n++;
    });
    summary.textContent = n
      ? `${n} layanan · Estimasi ${formatRupiah(price)} · Durasi ${dur} menit`
      : 'Belum ada layanan dipilih.';
  };
  form.querySelectorAll('[name="svc"]').forEach((c) => c.addEventListener('change', updateSummary));

  let petSeq = 0;
  async function loadPets(customerId) {
    const my = ++petSeq;
    if (!customerId) {
      petSel.innerHTML = '<option value="">Pilih pelanggan terlebih dahulu</option>';
      return;
    }
    petSel.innerHTML = '<option value="">Memuat...</option>';
    try {
      const pets = await api.getCustomerPets(customerId);
      if (my !== petSeq) return;
      petSel.innerHTML = pets.length
        ? '<option value="">Pilih hewan...</option>' + pets
          .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(SPECIES[p.species] || p.species)})</option>`)
          .join('')
        : '<option value="">Belum ada hewan. Tambahkan di menu Hewan.</option>';
    } catch (e) {
      if (my !== petSeq) return;
      console.error(e);
      petSel.innerHTML = '<option value="">Gagal memuat hewan</option>';
      toast.error(mapError(e));
    }
  }
  if (isCustomer) loadPets(myId);
  else {
    loadPets('');
    $('bk_customer').addEventListener('change', (e) => loadPets(e.target.value));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    msg.hidden = true;

    const customerId = isCustomer ? myId : $('bk_customer').value;
    const petId = petSel.value;
    const serviceIds = [...form.querySelectorAll('[name="svc"]:checked')].map((c) => c.value);
    const when = $('bk_when').value;
    const complaint = $('bk_complaint').value.trim();
    const scheduled = when ? new Date(`${when}:00+07:00`) : null;

    let bad = false;
    if (!isCustomer) bad = setErr('bk_customer', customerId ? '' : 'Pilih pelanggan.') || bad;
    bad = setErr('bk_pet', petId ? '' : 'Pilih hewan.') || bad;
    bad = setErr('bk_svc', serviceIds.length ? '' : 'Pilih minimal satu layanan.') || bad;
    bad = setErr('bk_when',
      !when ? 'Tanggal dan jam wajib diisi.'
        : (Number.isNaN(scheduled.getTime()) || scheduled.getTime() <= Date.now()) ? 'Waktu booking harus di masa depan.' : '') || bad;
    bad = setErr('bk_complaint', complaint.length > 500 ? 'Maksimal 500 karakter.' : '') || bad;
    if (bad) return;

    submitBtn.disabled = true;
    const label = submitBtn.textContent;
    submitBtn.textContent = 'Menyimpan...';
    try {
      await api.createBooking({
        customer_id: customerId,
        pet_id: petId,
        service_ids: serviceIds,
        scheduled_at: scheduled.toISOString(),
        staff_id: isCustomer ? null : ($('bk_staff')?.value || null),
        complaint: complaint || null,
      });
    } catch (err) {
      console.error(err);
      msg.textContent = mapError(err);
      msg.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = label;
      return;
    }
    m.close();
    toast.success(isCustomer
      ? 'Permintaan booking terkirim. Menunggu konfirmasi petugas.'
      : 'Booking berhasil dibuat.');
    onDone?.();
  });
}