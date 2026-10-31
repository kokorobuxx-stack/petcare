export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkEmail(v) {
  const s = (v || '').trim();
  if (!s) return 'Email wajib diisi.';
  if (!EMAIL_RE.test(s)) return 'Format email tidak valid.';
  return '';
}

export function checkName(v) {
  const s = (v || '').trim();
  if (!s) return 'Nama lengkap wajib diisi.';
  if (s.length < 2) return 'Nama terlalu pendek.';
  if (s.length > 100) return 'Nama terlalu panjang (maksimal 100 karakter).';
  return '';
}

export function cleanPhone(v) {
  return (v || '').replace(/[\s\-().]/g, '');
}

// Disimpan dalam format 08xxxxxxxxxx
export function normalizePhone(v) {
  const p = cleanPhone(v);
  if (p.startsWith('+62')) return '0' + p.slice(3);
  if (p.startsWith('62')) return '0' + p.slice(2);
  return p;
}

export function checkPhone(v) {
  const p = cleanPhone(v);
  if (!p) return 'Nomor telepon wajib diisi.';
  if (!/^(\+62|62|0)8\d{8,11}$/.test(p)) return 'Gunakan nomor ponsel Indonesia, contoh 081234567890.';
  return '';
}

export function checkPassword(v) {
  if (!v) return 'Password wajib diisi.';
  if (v.length < 8) return 'Password minimal 8 karakter.';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Password harus mengandung huruf dan angka.';
  return '';
}