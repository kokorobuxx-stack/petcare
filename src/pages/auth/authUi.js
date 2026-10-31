import { icon, renderIcons } from '../../components/icons.js';

// Kerangka kartu auth yang dipakai bersama. title/subtitle/body harus teks statis (bukan input pengguna).
export function authCard(app, { title, subtitle = '', body, center = false }) {
  app.innerHTML = `
    <div class="auth">
      <div class="auth-card${center ? ' auth-card--center' : ''}">
        <div class="brand brand--lg">
          <span class="brand__logo">${icon('paw-print')}</span>
          <span class="brand__name">Pet<b>Care</b></span>
        </div>
        <div><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ''}</div>
        <div class="alert" id="msg" hidden></div>
        ${body}
      </div>
    </div>`;
  renderIcons();
  const msg = app.querySelector('#msg');
  return {
    showMsg(text, type = 'danger') {
      msg.textContent = text;
      msg.className = `alert alert--${type}`;
      msg.hidden = !text;
    },
    // Mengembalikan true jika TIDAK ada error.
    setErr(id, text) {
      app.querySelector(`#${id}Err`).textContent = text;
      app.querySelector(`#${id}`).classList.toggle('is-invalid', Boolean(text));
      return !text;
    },
  };
}

export function field({ id, label, type = 'text', placeholder = '', autocomplete = 'off', hint = '' }) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input class="input" id="${id}" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" />
      ${hint ? `<span class="pw-hint">${hint}</span>` : ''}
      <span class="field__error" id="${id}Err"></span>
    </div>`;
}