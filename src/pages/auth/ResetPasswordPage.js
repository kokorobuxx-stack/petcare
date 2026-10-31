import { getState, updatePassword } from '../../services/authService.js';
import { checkPassword } from '../../utils/validators.js';
import { authCard, field } from './authUi.js';
import { icon } from '../../components/icons.js';
import { toast } from '../../components/Toast.js';

export function renderReset(app) {
  // Halaman ini hanya berlaku jika datang dari link reset di email.
  if (!getState().recovery) {
    authCard(app, {
      title: 'Link tidak valid',
      center: true,
      body: `
        <span class="state-icon">${icon('triangle-alert')}</span>
        <p class="muted">Link reset password tidak valid atau sudah kedaluwarsa. Buka link dari email di browser yang sama dengan saat Anda memintanya.</p>
        <a class="btn btn--primary" href="#/forgot-password">Minta link baru</a>`,
    });
    return;
  }

  const ui = authCard(app, {
    title: 'Buat password baru',
    subtitle: 'Masukkan password baru untuk akun Anda.',
    body: `
      <form id="resetForm" class="auth-form" novalidate>
        ${field({ id: 'password', label: 'Password baru', type: 'password', placeholder: 'Minimal 8 karakter', autocomplete: 'new-password', hint: 'Minimal 8 karakter, kombinasi huruf dan angka.' })}
        ${field({ id: 'confirm', label: 'Ulangi password baru', type: 'password', placeholder: 'Ketik ulang password', autocomplete: 'new-password' })}
        <button class="btn btn--primary btn--block" id="submitBtn" type="submit">Simpan password</button>
      </form>`,
  });

  const $ = (id) => app.querySelector('#' + id);
  const btn = $('submitBtn');

  $('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    ui.showMsg('');
    const ok = [
      ui.setErr('password', checkPassword($('password').value)),
      ui.setErr('confirm', $('confirm').value === $('password').value ? '' : 'Konfirmasi password tidak sama.'),
    ].every(Boolean);
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
    const { error } = await updatePassword($('password').value);
    if (error) {
      ui.showMsg(error);
      btn.disabled = false;
      btn.textContent = 'Simpan password';
      return;
    }
    toast.success('Password berhasil diubah.'); // router otomatis ke dashboard
  });
}