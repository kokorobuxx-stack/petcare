import { supabase, configError } from './supabaseClient.js';
import { mapError } from '../utils/errors.js';

const state = {
  status: 'loading', // 'loading' | 'ready'
  session: null,
  user: null,
  profile: null, // { id, role, full_name, phone, is_active }
  notice: null, // pesan untuk halaman login (akun nonaktif, link kedaluwarsa, dll.)
  recovery: false, // true saat pengguna datang dari link reset password
  configError,
};

const listeners = new Set();
let lastSig = '';

export const getState = () => state;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Hanya memberi tahu pendengar jika hal PENTING berubah (bukan sekadar token diperbarui),
// supaya halaman tidak ter-render ulang dan form yang sedang diisi tidak hilang.
function emit() {
  const sig = [
    state.status,
    state.user?.id,
    state.profile?.role,
    state.profile?.is_active,
    state.notice,
    state.recovery,
  ].join('|');
  if (sig === lastSig) return;
  lastSig = sig;
  listeners.forEach((fn) => fn(state));
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, is_active')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function clearAuth() {
  state.session = null;
  state.user = null;
  state.profile = null;
  state.recovery = false;
}

async function applySession(session) {
  if (!session) {
    clearAuth();
    state.status = 'ready';
    emit();
    return;
  }
  try {
    const profile = await loadProfile(session.user.id);
    if (!profile) {
      state.notice = 'Profil akun tidak ditemukan. Hubungi admin klinik.';
      await supabase.auth.signOut();
      return;
    }
    if (!profile.is_active) {
      state.notice = 'Akun Anda nonaktif. Hubungi admin klinik.';
      await supabase.auth.signOut();
      return;
    }
    state.notice = null;
    state.session = session;
    state.user = session.user;
    state.profile = profile;
    state.status = 'ready';
    emit();
  } catch (e) {
    // Gagal ambil profil (misalnya jaringan): jangan anggap sudah login.
    clearAuth();
    state.notice = mapError(e);
    state.status = 'ready';
    emit();
  }
}

// Link email yang kedaluwarsa/sudah dipakai datang sebagai ?error=... atau #error=...
// Hash tanpa "/" itu akan dianggap 404 oleh router, jadi diubah menjadi pesan di halaman login.
function consumeUrlError() {
  const hash = window.location.hash;
  const hp = new URLSearchParams(hash.startsWith('#/') ? '' : hash.replace(/^#/, ''));
  const qp = new URLSearchParams(window.location.search);
  const err = qp.get('error') || hp.get('error');
  if (!err) return;
  const code = qp.get('error_code') || hp.get('error_code');
  state.notice =
    code === 'otp_expired'
      ? 'Link sudah kedaluwarsa atau sudah dipakai. Silakan minta link baru.'
      : 'Link tidak valid. Silakan coba lagi.';
  history.replaceState(null, '', window.location.pathname + '#/login');
}

export async function initAuth() {
  if (!supabase) {
    state.status = 'ready';
    emit();
    return;
  }
  consumeUrlError();
  // Catatan: jangan memanggil Supabase langsung di dalam callback ini (bisa macet).
  // Karena itu dibungkus setTimeout.
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') state.recovery = true;
    // Bersihkan ?code=... dari address bar setelah ditukar menjadi sesi.
    if (window.location.search && (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY')) {
      history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
    if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && state.profile && session) {
      state.session = session;
      state.user = session.user;
      return;
    }
    setTimeout(() => applySession(session), 0);
  });
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? mapError(error) : null };
}

// Role TIDAK dikirim dari sini. Trigger database selalu membuat role "customer".
export async function signUp({ email, password, fullName, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) return { error: mapError(error), needsConfirmation: false };
  // Email sudah terdaftar + Confirm email nyala: Supabase tidak memberi error, tapi identities kosong.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: 'Email ini sudah terdaftar. Silakan masuk, atau gunakan "Lupa password".', needsConfirmation: false };
  }
  return { error: null, needsConfirmation: !data.session };
}

export async function signOut() {
  state.notice = null;
  const { error } = await supabase.auth.signOut();
  return { error: error ? mapError(error) : null };
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { error: error ? mapError(error) : null };
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (error.code === 'same_password') return { error: 'Password baru harus berbeda dari password lama.' };
    return { error: mapError(error) };
  }
  state.recovery = false;
  emit(); // router otomatis memindahkan ke dashboard sesuai role
  return { error: null };
}