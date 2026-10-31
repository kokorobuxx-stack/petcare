import { signUp } from '../../services/authService.js';
import { checkEmail, checkName, checkPhone, checkPassword, normalizePhone } from '../../utils/validators.js';
import { authCard, field } from './authUi.js';
import { icon } from '../../components/icons.js';

function showConfirm(app, email) {
  authCard(app, {
    title: 'Periksa email Anda',
    center: true,
    body: `
      <span class="state-icon">${icon('circle-check')}</span>
      <p class="muted" id="to"></p>
      <p class="muted">Klik link di email untuk mengaktifkan akun. Cek folder spam jika belum ada.</p>
      <a class="btn btn--primary" href="#/login">Ke halaman masuk</a>`,
  });
  app.querySelector('#to').textContent = `Kami mengirim link konfirmasi ke ${email}.`;
}

export function renderRegister(app) {
  const ui = authCard(app, {
    title: 'Buat akun pelanggan',
    subtitle: 'Daftar untuk mengelola hewan dan booking Anda.',
    body: `
      <form id="regForm" class="auth-form" novalidate>
        ${field({ id: 'fullName', label: 'Nama lengkap', placeholder: 'Nama Anda', autocomplete: 'name' })}
        ${field({ id: 'phone', label: 'Nomor telepon', type: 'tel', placeholder: '081234567890', autocomplete: 'tel' })}
        ${field({ id: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com', autocomplete: 'email' })}
        ${field({ id: 'password', label: 'Password', type: 'password', placeholder: 'Minimal 8 karakter', autocomplete: 'new-password', hint: 'Minimal 8 karakter, kombinasi huruf dan angka.' })}
        ${field({ id: 'confirm', label: 'Ulangi password', type: 'password', placeholder: 'Ketik ulang password', autocomplete: 'new-password' })}
        <button class="btn btn--primary btn--block" id="submitBtn" type="submit">Daftar</button>
      </form>
      <div class="auth-links"><span class="muted">Sudah punya akun? <a href="#/login">Masuk</a></span></div>`,
  });

  const $ = (id) => app.querySelector('#' + id);
  const btn = $('submitBtn');

  $('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    ui.showMsg('');
    const ok = [
      ui.setErr('fullName', checkName($('fullName').value)),
      ui.setErr('phone', checkPhone($('phone').value)),
      ui.setErr('email', checkEmail($('email').value)),
      ui.setErr('password', checkPassword($('password').value)),
      ui.setErr('confirm', $('confirm').value === $('password').value ? '' : 'Konfirmasi password tidak sama.'),
    ].every(Boolean);
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = 'Memproses...';
    const email = $('email').value.trim();
    const { error, needsConfirmation } = await signUp({
      email,
      password: $('password').value,
      fullName: $('fullName').value.trim(),
      phone: normalizePhone($('phone').value),
    });
    if (error) {
      ui.showMsg(error);
      btn.disabled = false;
      btn.textContent = 'Daftar';
      return;
    }
    if (needsConfirmation) return showConfirm(app, email);
    // Confirm email mati: sesi langsung aktif, router otomatis ke dashboard pelanggan.
  });
}