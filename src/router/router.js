import { getState, subscribe } from '../services/authService.js';
import { homePathFor } from '../utils/constants.js';

const routes = [];
let onRender = () => {};

// route: { path, title, roles?: [..], publicOnly?: true, ...data lain }
// - roles ada     -> halaman terlindungi, hanya role tersebut
// - publicOnly    -> hanya untuk yang belum login (login, register)
// - tanpa keduanya -> halaman publik biasa
export function registerRoutes(list) {
  for (const r of list) {
    const keys = [];
    const re = new RegExp(
      '^' +
        r.path.replace(/:([A-Za-z]+)/g, (_, k) => {
          keys.push(k);
          return '([^/]+)';
        }) +
        '/?$'
    );
    routes.push({ ...r, re, keys });
  }
}

export function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(queryString)) };
}

function match(path) {
  for (const route of routes) {
    const m = path.match(route.re);
    if (m) {
      const params = {};
      route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { route, params };
    }
  }
  return null;
}

export function navigate(path, { replace = false } = {}) {
  const target = '#' + path;
  if (replace) {
    history.replaceState(null, '', target);
    resolve();
  } else if (window.location.hash === target) {
    resolve();
  } else {
    window.location.hash = target; // memicu 'hashchange' -> resolve()
  }
}

// Setelah login, kembali ke halaman tujuan semula jika memang boleh diakses.
function safeNext(next, role) {
  if (!next || !next.startsWith('/')) return null;
  const m = match(next.split('?')[0]);
  if (m && m.route.roles && m.route.roles.includes(role)) return next;
  return null;
}

export function resolve() {
  const auth = getState();

  if (auth.configError) return onRender({ type: 'config-error', message: auth.configError });
  if (auth.status === 'loading') return onRender({ type: 'loading' });

  const { path, query } = parseHash();
  const loggedIn = Boolean(auth.session && auth.profile);
  const home = loggedIn ? homePathFor(auth.profile.role) : '/login';

  // BARU: datang dari link reset password -> wajib ke form password baru dulu
  if (auth.recovery && loggedIn && path !== '/reset-password') {
    return navigate('/reset-password', { replace: true });
  }

  if (path === '/' && loggedIn) return navigate(home, { replace: true });

  const found = match(path);
  if (!found) return onRender({ type: 'notfound', path });
  const { route, params } = found;

  // BARU: halaman reset tanpa mode recovery tapi sudah login -> tidak ada gunanya, ke dashboard
  if (path === '/reset-password' && !auth.recovery && loggedIn) {
    return navigate(home, { replace: true });
  }

  if (route.publicOnly && loggedIn) {
    return navigate(safeNext(query.next, auth.profile.role) || home, { replace: true });
  }

  if (route.roles) {
    if (!loggedIn) {
      return navigate('/login?next=' + encodeURIComponent(path), { replace: true });
    }
    if (!route.roles.includes(auth.profile.role)) {
      return navigate('/akses-ditolak', { replace: true });
    }
  }

  document.title = (route.title ? route.title + ' | ' : '') + 'PetCare';
  onRender({ type: 'page', route, params, query, path });
}

export function startRouter(renderFn) {
  onRender = renderFn;
  window.addEventListener('hashchange', resolve);
  subscribe(() => resolve());
  resolve();
}
