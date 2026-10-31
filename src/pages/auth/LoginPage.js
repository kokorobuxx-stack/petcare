import { signIn } from '../../services/authService.js';
import { checkEmail } from '../../utils/validators.js';
import { authCard, field } from './authUi.js';

export function renderLogin(app, notice) {
  const ui = authCard(app, {
    title: 'Selamat datang',
    subtitle: 'Masuk untuk mengelola klinik hewan Anda.',
    body: `
      <form id="loginForm" class="auth-form" novalidate>
        ${field({ id: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com', autocomplete: 'username' })}
        ${field({ id: 'password', label: 'Password', type: 'password', placeholder: 'Masukkan password', autocomplete: 'current-password' })}
        <button class="btn btn--primary btn--block" id="submitBtn" type="submit">Masuk</button>
      </form>
      <div class="auth-links">
        <a href="#/forgot-password">Lupa password?</a>
        <span class="muted">Belum punya akun? <a href="#/register">Daftar</a></span>
      </div>`,
  });
  if (notice) ui.showMsg(notice, 'warning');

  const email = app.querySelector('#email');
  const password = app.querySelector('#password');
  const btn = app.querySelector('#submitBtn');

  app.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn.disabled) return; // cegah double submit
    ui.showMsg('');
    const ok = [
      ui.setErr('email', checkEmail(email.value)),
      ui.setErr('password', password.value ? '' : 'Password wajib diisi.'),
    ].every(Boolean);
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = 'Memproses...';
    const { error } = await signIn(email.value.trim(), password.value);
    if (error) {
      ui.showMsg(error);
      btn.disabled = false;
      btn.textContent = 'Masuk';
    } // jika berhasil, router otomatis memindahkan ke dashboard sesuai role
  });
}