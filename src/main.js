import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { initAuth, getState } from './services/authService.js';
import { registerRoutes, startRouter } from './router/router.js';
import { ROLES, NAV_ITEMS, homePathFor } from './utils/constants.js';
import { mountApp, resetShell } from './layouts/AppLayout.js';
import { renderLogin } from './pages/auth/LoginPage.js';
import { renderRegister } from './pages/auth/RegisterPage.js';
import { renderForgot } from './pages/auth/ForgotPasswordPage.js';
import { renderReset } from './pages/auth/ResetPasswordPage.js';
import { renderErrorPage } from './pages/errors/ErrorPages.js';
import { placeholderPage } from './pages/PlaceholderPage.js';
import { adminDashboard } from './pages/dashboard/AdminDashboard.js';
import { staffDashboard } from './pages/dashboard/StaffDashboard.js';
import { customerDashboard } from './pages/dashboard/CustomerDashboard.js';
import { servicesPage } from './pages/master/ServicesPage.js';
import { customersPage } from './pages/master/CustomersPage.js';
import { petsPage } from './pages/master/PetsPage.js';
import { staffAdminPage, staffDirectoryPage } from './pages/master/StaffPages.js';
import { destroyCharts } from './components/charts.js';

const app = document.getElementById('app');

// Semua menu sidebar didaftarkan otomatis dari NAV_ITEMS, terkunci per role.
const appRoutes = Object.values(ROLES).flatMap((role) =>
  (NAV_ITEMS[role] || []).map((i) => ({ path: i.path, title: i.label, roles: [role] }))
);

registerRoutes([
  { path: '/login', title: 'Masuk', publicOnly: true },
  { path: '/register', title: 'Daftar', publicOnly: true },
  { path: '/forgot-password', title: 'Lupa Password', publicOnly: true },
  { path: '/reset-password', title: 'Password Baru' },
  { path: '/akses-ditolak', title: 'Akses Ditolak' },
  ...appRoutes,
]);

// Halaman publik (tanpa shell sidebar)
const PUBLIC_PAGES = {
  '/login': () => renderLogin(app, getState().notice),
  '/register': () => renderRegister(app),
  '/forgot-password': () => renderForgot(app),
  '/reset-password': () => renderReset(app),
};

// Dashboard di halaman utama tiap role
const HOME_PAGES = {
  [ROLES.ADMIN]: adminDashboard,
  [ROLES.STAFF]: staffDashboard,
  [ROLES.CUSTOMER]: customerDashboard,
};

// Halaman data master yang sudah nyata. Menu lain masih placeholder.
const PAGES = {
  '/admin/services': () => servicesPage('admin'),
  '/staff/services': () => servicesPage('staff'),
  '/customer/services': () => servicesPage('customer'),
  '/admin/customers': () => customersPage('admin'),
  '/staff/customers': () => customersPage('staff'),
  '/admin/pets': () => petsPage('admin'),
  '/staff/pets': () => petsPage('staff'),
  '/customer/pets': () => petsPage('customer'),
  '/admin/staff': () => staffAdminPage(),
  '/staff/directory': () => staffDirectoryPage(),
};

function render(r) {
  destroyCharts();

  if (r.type === 'loading') {
    resetShell();
    app.innerHTML = '<div class="splash"><div class="spinner" role="status" aria-label="Memuat"></div></div>';
    return;
  }
  if (r.type === 'config-error') {
    resetShell();
    return renderErrorPage(app, { iconName: 'triangle-alert', title: 'Konfigurasi bermasalah', text: r.message });
  }
  if (r.type === 'notfound') {
    resetShell();
    return renderErrorPage(app, {
      iconName: 'search-x', code: '404', title: 'Halaman tidak ditemukan',
      text: 'Alamat yang Anda buka tidak tersedia.', href: '#/', action: 'Kembali ke beranda',
    });
  }

  const p = r.route.path;
  if (PUBLIC_PAGES[p]) {
    resetShell();
    return PUBLIC_PAGES[p]();
  }
  if (p === '/akses-ditolak') {
    resetShell();
    return renderErrorPage(app, {
      iconName: 'shield-alert', code: '403', title: 'Akses ditolak',
      text: 'Anda tidak memiliki izin untuk membuka halaman ini.', href: '#/', action: 'Kembali ke beranda',
    });
  }

  const { profile } = getState();
  const isHome = r.path.replace(/\/$/, '') === homePathFor(profile.role);
  const pageNode = isHome
    ? HOME_PAGES[profile.role]()
    : PAGES[p] ? PAGES[p]() : placeholderPage(r.route.title);
  mountApp(app, { route: r.route, path: r.path, pageNode });
}

initAuth();
startRouter(render);