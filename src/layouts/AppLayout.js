import { getState, signOut } from '../services/authService.js';
import { ROLE_LABEL, homePathFor } from '../utils/constants.js';
import { sidebarHtml, setActiveNav } from '../components/Sidebar.js';
import { topbarHtml, fillTopbar, setTitle } from '../components/Topbar.js';
import { renderIcons } from '../components/icons.js';
import { toast } from '../components/Toast.js';
import { mountEditorialMotion } from '../utils/editorialMotion.js';

let ac = null;
let sig = '';
let disposeMotion = null;

// Panggil saat meninggalkan layout (login, error, loading).
export function resetShell() {
  ac?.abort();
  ac = null;
  disposeMotion?.();
  disposeMotion = null;
  sig = '';
}

function build(app, profile) {
  resetShell();
  ac = new AbortController();
  const { signal } = ac;
  sig = [profile.id, profile.role, profile.full_name].join('|');

  app.innerHTML = `
    <div class="app-shell app-shell--editorial">
      ${sidebarHtml(profile)}
      <div class="main">
        ${topbarHtml()}
        <main class="content" id="content" tabindex="-1"></main>
      </div>
    </div>`;

  const shell = app.querySelector('.app-shell');
  const userBtn = shell.querySelector('#userBtn');
  const panel = shell.querySelector('#userPanel');
  const closeNav = () => shell.classList.remove('is-nav-open');
  const closePanel = () => { panel.hidden = true; userBtn.setAttribute('aria-expanded', 'false'); };

  shell.querySelector('#menuBtn').addEventListener('click', () => shell.classList.toggle('is-nav-open'), { signal });
  shell.querySelector('#sidebarOverlay').addEventListener('click', closeNav, { signal });
  shell.querySelector('.sidebar__nav').addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); }, { signal });

  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    userBtn.setAttribute('aria-expanded', String(willOpen));
  }, { signal });
  document.addEventListener('click', (e) => { if (!e.target.closest('.usermenu')) closePanel(); }, { signal });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePanel(); closeNav(); } }, { signal });

  const logoutBtn = shell.querySelector('#logoutBtn');
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    const { error } = await signOut();
    if (error) { toast.error(error); logoutBtn.disabled = false; }
  }, { signal });

  fillTopbar(shell, { name: profile.full_name, roleLabel: ROLE_LABEL[profile.role] });
}

// Shell hanya dibangun sekali; saat pindah halaman hanya isi konten yang diganti.
export function mountApp(app, { route, path, pageNode }) {
  const { profile } = getState();
  const currentSig = [profile.id, profile.role, profile.full_name].join('|');
  if (!app.querySelector('.app-shell') || sig !== currentSig) build(app, profile);

  const shell = app.querySelector('.app-shell');
  shell.classList.toggle('app-shell--admin-home', path === '/admin');
  shell.classList.remove('is-nav-open');
  setActiveNav(shell, path, homePathFor(profile.role));
  setTitle(shell, `PETCARE / ${ROLE_LABEL[profile.role]}`, route.title);
  shell.querySelector('#content').replaceChildren(pageNode);
  disposeMotion?.();
  disposeMotion = mountEditorialMotion(pageNode);
  window.scrollTo(0, 0);
  renderIcons();
}
