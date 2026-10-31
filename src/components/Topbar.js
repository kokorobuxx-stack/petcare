import { icon } from './icons.js';

export function topbarHtml() {
  return `
    <header class="topbar">
      <button class="icon-btn topbar__menu" id="menuBtn" aria-label="Buka menu">${icon('menu')}</button>
      <div class="topbar__title">
        <span class="crumb" id="crumb"></span>
        <h1 id="pageTitle"></h1>
      </div>
      <div class="usermenu">
        <button class="usermenu__btn" id="userBtn" aria-haspopup="true" aria-expanded="false">
          <span class="avatar" data-avatar></span>
          <span class="usermenu__text"><strong data-user-name></strong><small data-user-role></small></span>
          ${icon('chevron-down')}
        </button>
        <div class="usermenu__panel" id="userPanel" hidden>
          <div class="usermenu__info"><strong data-user-name></strong><small data-user-role></small></div>
          <button class="menu-item" id="logoutBtn">${icon('log-out')}<span>Keluar</span></button>
        </div>
      </div>
    </header>`;
}

// Mengisi teks lewat textContent (aman dari HTML berbahaya).
export function fillTopbar(root, { name, roleLabel }) {
  root.querySelectorAll('[data-user-name]').forEach((n) => (n.textContent = name));
  root.querySelectorAll('[data-user-role]').forEach((n) => (n.textContent = roleLabel));
  root.querySelector('[data-avatar]').textContent = (name || '?').trim().charAt(0).toUpperCase();
}

export function setTitle(root, crumb, title) {
  root.querySelector('#crumb').textContent = crumb;
  root.querySelector('#pageTitle').textContent = title;
}