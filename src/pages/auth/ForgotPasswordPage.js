import { resetPassword } from '../../services/authService.js';
import { checkEmail } from '../../utils/validators.js';
import { authCard, field } from './authUi.js';

export function renderForgot(app) {
  const ui = authCard(app, {
    title: 'Lupa password',
    subtitle: 'Masukkan email akun Anda. Kami kirim link untuk membuat password baru.',
    body: `
      <form id="forgotForm" class="auth-form" novalidate>
        ${field({ id: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com', autocomplete: 'email' })}
        <button class="btn btn--primary btn--block" id="submitBtn" type="submit">Kirim link reset</button>
      </form>
      <div class="auth-links"><a href="#/login">Kembali ke halaman masuk</a></div>`,
  });

  const email = app.querySelector('#email');
  const btn = app.querySelector('#submitBtn');

  app.querySelector('#forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    ui.showMsg('');
    if (!ui.setErr('email', checkEmail(email.value))) return;

    btn.disabled = true;
    btn.textContent = 'Mengirim...';
    const { error } = await resetPassword(email.value.trim());
    if (error) {
      ui.showMsg(error);
      btn.disabled = false;
      btn.textContent = 'Kirim link reset';
      return;
    }
    // Pesan sengaja sama untuk email terdaftar maupun tidak (privasi).
    ui.showMsg('Jika email terdaftar, link reset password sudah dikirim. Cek kotak masuk dan folder spam.', 'success');
    // Jeda 30 detik agar tidak kena batas pengiriman email.
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Kirim ulang link';
    }, 30000);
  });
}