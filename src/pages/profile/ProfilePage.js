import { el } from '../../utils/dom.js';
import { getState, signIn, updatePassword } from '../../services/authService.js';
import { updateMyProfile } from '../../services/profileService.js';
import { ROLE_LABEL } from '../../utils/constants.js';
import { statusBadge } from '../../components/StatusBadge.js';
import { fillTopbar } from '../../components/Topbar.js';
import { toast } from '../../components/Toast.js';
import { mapError } from '../../utils/errors.js';
import { checkName, checkPhone, checkPassword, normalizePhone } from '../../utils/validators.js';

export function profilePage() {
  const { user, profile } = getState();

  const node = el(`
    <div class="page profile-page">
      <div class="page-header"><div>
        <h2>Profil Saya</h2>
        <p class="muted">Kelola data akun dan keamanan password Anda.</p>
      </div></div>
      <div class="page-body profile-page__body">
        <div class="card">
          <h3 class="card__title">Data akun</h3>
          <form class="auth-form" id="pf" novalidate>
            <div class="alert alert--danger" data-msg hidden></div>
            <div class="field"><label for="pf_email">Email akun</label>
              <input class="input" id="pf_email" disabled /></div>
            <div class="field"><label for="pf_role">Peran</label>
              <input class="input" id="pf_role" disabled /></div>
            <div class="field"><label>Status akun</label><div data-status></div></div>
            <div class="field"><label for="pf_name">Nama lengkap</label>
              <input class="input" id="pf_name" autocomplete="name" />
              <span class="field__error" id="pf_nameErr"></span></div>
            <div class="field"><label for="pf_phone">Nomor telepon</label>
              <input class="input" id="pf_phone" type="tel" autocomplete="tel" placeholder="081234567890" />
              <span class="field__error" id="pf_phoneErr"></span></div>
            <div class="modal__actions">
              <button class="btn btn--primary" type="submit" data-submit>Simpan perubahan</button>
            </div>
          </form>
        </div>
        <div class="card">
          <h3 class="card__title">Ganti password</h3>
          <form class="auth-form" id="pw" novalidate>
            <div class="alert alert--danger" data-msg hidden></div>
            <div class="field"><label for="pw_old">Password saat ini</label>
              <input class="input" id="pw_old" type="password" autocomplete="current-password" />
              <span class="field__error" id="pw_oldErr"></span></div>
            <div class="field"><label for="pw_new">Password baru</label>
              <input class="input" id="pw_new" type="password" autocomplete="new-password" />
              <span class="pw-hint">Minimal 8 karakter, mengandung huruf dan angka.</span>
              <span class="field__error" id="pw_newErr"></span></div>
            <div class="field"><label for="pw_new2">Ulangi password baru</label>
              <input class="input" id="pw_new2" type="password" autocomplete="new-password" />
              <span class="field__error" id="pw_new2Err"></span></div>
            <div class="modal__actions">
              <button class="btn btn--primary" type="submit" data-submit>Ganti password</button>
            </div>
          </form>
        </div>
      </div>
    </div>`);

  // Nilai diisi lewat .value / textContent agar aman dari HTML berbahaya.
  node.querySelector('#pf_email').value = user.email || '-';
  node.querySelector('#pf_role').value = ROLE_LABEL[profile.role] || profile.role;
  node.querySelector('#pf_name').value = profile.full_name || '';
  node.querySelector('#pf_phone').value = profile.phone || '';
  node.querySelector('[data-status]').innerHTML = statusBadge(profile.is_active ? 'active' : 'inactive');

  const $ = (id) => node.querySelector('#' + id);
  const setErr = (id, text) => { $(id + 'Err').textContent = text || ''; return Boolean(text); };

  // ---- Simpan data akun ----
  const pf = node.querySelector('#pf');
  const pfMsg = pf.querySelector('[data-msg]');
  const pfBtn = pf.querySelector('[data-submit]');
  pf.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pfBtn.disabled) return;
    pfMsg.hidden = true;
    const name = $('pf_name').value.trim();
    const phone = $('pf_phone').value;
    let bad = setErr('pf_name', checkName(name));
    bad = setErr('pf_phone', checkPhone(phone)) || bad;
    if (bad) return;

    pfBtn.disabled = true;
    pfBtn.textContent = 'Menyimpan...';
    try {
      await updateMyProfile({ full_name: name, phone: normalizePhone(phone) });
      $('pf_name').value = name;
      $('pf_phone').value = normalizePhone(phone);
      const shell = document.querySelector('.app-shell');
      if (shell) fillTopbar(shell, { name, roleLabel: ROLE_LABEL[profile.role] });
      toast.success('Profil berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      pfMsg.textContent = mapError(err);
      pfMsg.hidden = false;
    }
    pfBtn.disabled = false;
    pfBtn.textContent = 'Simpan perubahan';
  });

  // ---- Ganti password ----
  const pw = node.querySelector('#pw');
  const pwMsg = pw.querySelector('[data-msg]');
  const pwBtn = pw.querySelector('[data-submit]');
  pw.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pwBtn.disabled) return;
    pwMsg.hidden = true;
    const oldPw = $('pw_old').value;
    const newPw = $('pw_new').value;
    const newPw2 = $('pw_new2').value;
    let bad = setErr('pw_old', oldPw ? '' : 'Password saat ini wajib diisi.');
    bad = setErr('pw_new', checkPassword(newPw)) || bad;
    bad = setErr('pw_new2', newPw2 === newPw ? '' : 'Konfirmasi password tidak sama.') || bad;
    if (bad) return;

    pwBtn.disabled = true;
    pwBtn.textContent = 'Memproses...';
    try {
      // Verifikasi password lama agar sesi yang terbuka tidak bisa langsung mengganti password.
      const check = await signIn(user.email, oldPw);
      if (check.error) {
        setErr('pw_old', 'Password saat ini salah.');
      } else {
        const res = await updatePassword(newPw);
        if (res.error) {
          pwMsg.textContent = res.error;
          pwMsg.hidden = false;
        } else {
          pw.reset();
          toast.success('Password berhasil diganti.');
        }
      }
    } catch (err) {
      console.error(err);
      pwMsg.textContent = mapError(err);
      pwMsg.hidden = false;
    }
    pwBtn.disabled = false;
    pwBtn.textContent = 'Ganti password';
  });

  return node;
}
