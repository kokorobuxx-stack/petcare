// Mengubah error Supabase/PostgreSQL menjadi pesan yang mudah dipahami.
export function mapError(err) {
  if (!err) return '';
  const msg = String(err.message || err || '');
  const code = String(err.code || '');

  // Jadwal bentrok (exclusion constraint)
  if (code === '23P01' || /bookings_no_staff_overlap/.test(msg)) {
    return 'Jadwal petugas berbenturan dengan booking lain. Silakan pilih waktu atau petugas berbeda.';
  }

  // Jaringan
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
    return 'Koneksi ke server gagal. Periksa internet Anda lalu coba lagi.';
  }

  // Autentikasi
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
    return 'Email atau password salah.';
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
    return 'Email belum dikonfirmasi. Periksa kotak masuk email Anda.';
  }
  if (code === 'user_already_exists' || /already registered/i.test(msg)) {
    return 'Email ini sudah terdaftar. Silakan masuk.';
  }
  if (code === 'weak_password' || /password should be at least/i.test(msg)) {
    return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
  }
  if (/rate limit|too many requests/i.test(msg) || code === 'over_request_rate_limit') {
    return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
  }
  if (/jwt expired/i.test(msg) || code === 'PGRST301') {
    return 'Sesi Anda berakhir. Silakan masuk kembali.';
  }

  // Izin database (RLS / GRANT) vs pesan buatan trigger
  if (code === '42501' || /row-level security|permission denied/i.test(msg)) {
    if (/row-level security|permission denied/i.test(msg)) {
      return 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.';
    }
    return msg; // pesan Indonesia dari trigger database
  }

  // Constraint
  if (code === '23505') return 'Data sudah ada (duplikat).';
  if (code === '23503') return 'Data ini masih terhubung dengan data lain.';
  if (code === '23502') return 'Ada isian wajib yang masih kosong.';
  if (code === '23514') return 'Data tidak memenuhi aturan yang berlaku.';
  if (code === 'PGRST116') return 'Data tidak ditemukan.';

  // Pesan buatan (RAISE EXCEPTION) dari trigger/RPC kita sudah berbahasa Indonesia
  if (code === 'P0001') return msg;

  return 'Terjadi kesalahan. Silakan coba lagi.';
}