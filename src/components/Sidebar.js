import { NAV_ITEMS } from '../utils/constants.js';
import { icon } from './icons.js';

export function sidebarHtml(role) {
  const links = (NAV_ITEMS[role] || [])
    .map((i) => `<a class="nav-link" href="#${i.path}" data-path="${i.path}">${icon(i.icon)}<span>${i.label}</span></a>`)
    .join('');
  return `
    <aside class="sidebar" aria-label="Navigasi utama">
      <div class="brand">
        <span class="brand__logo">${icon('paw-print')}</span>
        <span class="brand__name">Pet<b>Care</b></span>
      </div>
      <nav class="sidebar__nav">${links}</nav>
      <div class="sidebar__foot">PetCare Management System</div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;
}

export function setActiveNav(root, path, home) {
  root.querySelectorAll('.nav-link').forEach((a) => {
    const p = a.dataset.path;
    const active = p === path || (p !== home && path.startsWith(p + '/'));
    a.classList.toggle('is-active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}