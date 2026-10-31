import { icon, renderIcons } from '../../components/icons.js';

export function renderErrorPage(app, { iconName, title, text, code, href, action }) {
  app.innerHTML = `
    <div class="auth">
      <div class="auth-card auth-card--center">
        <span class="state-icon">${icon(iconName)}</span>
        ${code ? `<p class="err-code">${code}</p>` : ''}
        <h1></h1>
        <p class="muted" data-text></p>
        ${href ? '<a class="btn btn--primary" data-action></a>' : ''}
      </div>
    </div>`;
  app.querySelector('h1').textContent = title;
  app.querySelector('[data-text]').textContent = text;
  if (href) {
    const a = app.querySelector('[data-action]');
    a.setAttribute('href', href);
    a.textContent = action || 'Kembali';
  }
  renderIcons();
}