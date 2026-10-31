import { NAV_ITEMS } from '../utils/constants.js';
import { icon } from './icons.js';
import { escapeHtml } from '../utils/dom.js';

const SECTION = [
  { title: 'Workspace', match: (p) => /\/(admin|staff|customer)$/.test(p) },
  { title: 'Klinik', match: (p) => /\/(bookings|transactions)$/.test(p) },
  { title: 'Direktori', match: (p) => /\/(customers|pets|staff|directory|services)$/.test(p) },
  { title: 'Insights', match: (p) => /\/reports$/.test(p) },
  { title: 'Akun', match: (p) => /\/profile$/.test(p) },
];

export function sidebarHtml(profile) {
  const links = NAV_ITEMS[profile.role] || [];
  const groups = SECTION.map(({ title, match }) => {
    const items = links.filter((item) => match(item.path));
    if (!items.length) return '';
    return `<section class="sidebar__group" aria-label="${title}">
      <p class="sidebar__label">${title}</p>
      ${items.map((i) => `<a class="nav-link" href="#${i.path}" data-path="${i.path}">${icon(i.icon)}<span>${i.label}</span></a>`).join('')}
    </section>`;
  }).join('');
  const name = escapeHtml(profile.full_name || 'Pengguna PetCare');
  const role = escapeHtml(profile.role || '');
  return `
    <aside class="sidebar" aria-label="Navigasi utama">
      <div class="brand">
        <span class="brand__logo">${icon('paw-print')}</span>
        <span class="brand__identity"><span class="brand__name">Pet<b>Care</b></span><small>CARE, THOUGHTFULLY.</small></span>
      </div>
      <nav class="sidebar__nav">${groups}</nav>
      <div class="sidebar__account"><span class="avatar">${name.trim().charAt(0).toUpperCase()}</span><span><strong>${name}</strong><small>${role}</small></span></div>
      <div class="sidebar__foot"><span>PetCare Management System</span><small>EST. WITH CARE</small></div>
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
