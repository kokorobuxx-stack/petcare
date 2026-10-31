import { openModal } from './Modal.js';
import { escapeHtml } from '../utils/dom.js';
import { mapError } from '../utils/errors.js';

// field: { id, label, type: text|tel|email|number|textarea|select|checkbox,
//          options, placeholder, hint, step, min, disabled, validate(value, all) -> teks error }
function fieldHtml(f, v) {
  const id = 'f_' + f.id;
  const val = v ?? '';
  const dis = f.disabled ? 'disabled' : '';
  let control;
  if (f.type === 'textarea') {
    control = `<textarea class="input" id="${id}" placeholder="${escapeHtml(f.placeholder || '')}" ${dis}>${escapeHtml(val)}</textarea>`;
  } else if (f.type === 'select') {
    control = `<select class="input" id="${id}" ${dis}>${f.options
      .map((o) => `<option value="${escapeHtml(o.value)}" ${String(o.value) === String(val) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`)
      .join('')}</select>`;
  } else if (f.type === 'checkbox') {
    return `<div class="field"><label class="check"><input type="checkbox" id="${id}" ${v ? 'checked' : ''} ${dis}/><span>${escapeHtml(f.label)}</span></label></div>`;
  } else {
    control = `<input class="input" id="${id}" type="${f.type || 'text'}" value="${escapeHtml(val)}" placeholder="${escapeHtml(f.placeholder || '')}" ${f.step ? `step="${f.step}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${dis} />`;
  }
  return `<div class="field"><label for="${id}">${escapeHtml(f.label)}</label>${control}${f.hint ? `<span class="pw-hint">${escapeHtml(f.hint)}</span>` : ''}<span class="field__error" id="${id}Err"></span></div>`;
}

// onSubmit(values) boleh melempar error (akan ditampilkan). Jika sukses: modal tutup, onDone dipanggil.
export function openFormModal({ title, fields, values = {}, submitText = 'Simpan', note = '', onSubmit, onDone }) {
  const form = document.createElement('form');
  form.noValidate = true;
  form.className = 'auth-form';
  form.innerHTML = `
    <div class="alert alert--danger" data-msg hidden></div>
    ${note ? `<p class="muted">${escapeHtml(note)}</p>` : ''}
    ${fields.map((f) => fieldHtml(f, values[f.id])).join('')}
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" data-cancel>Batal</button>
      <button type="submit" class="btn btn--primary" data-submit></button>
    </div>`;
  const submitBtn = form.querySelector('[data-submit]');
  submitBtn.textContent = submitText;
  const msg = form.querySelector('[data-msg]');
  const m = openModal({ title, body: form });
  form.querySelector('[data-cancel]').addEventListener('click', () => m.close());

  const read = () => {
    const out = {};
    for (const f of fields) {
      if (f.disabled) continue;
      const node = form.querySelector('#f_' + f.id);
      out[f.id] = f.type === 'checkbox' ? node.checked : node.value;
    }
    return out;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    msg.hidden = true;
    const vals = read();
    let ok = true;
    for (const f of fields) {
      if (f.disabled || !f.validate) continue;
      const text = f.validate(vals[f.id], vals) || '';
      const errEl = form.querySelector('#f_' + f.id + 'Err');
      const input = form.querySelector('#f_' + f.id);
      if (errEl) errEl.textContent = text;
      input.classList.toggle('is-invalid', Boolean(text));
      if (text) ok = false;
    }
    if (!ok) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
      await onSubmit(vals);
    } catch (err) {
      console.error(err);
      msg.textContent = mapError(err);
      msg.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;
      return;
    }
    m.close();
    onDone?.();
  });
  return m;
}