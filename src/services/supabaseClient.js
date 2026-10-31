import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Jika env belum terbaca, aplikasi menampilkan pesan jelas (tidak layar kosong).
export const configError =
  !url || !key
    ? 'Konfigurasi Supabase belum lengkap. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di file .env, lalu restart npm run dev.'
    : null;

export const supabase = configError
  ? null
  : createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // PKCE dipilih agar link reset password tidak bentrok dengan hash routing (#/...)
        flowType: 'pkce',
      },
    });