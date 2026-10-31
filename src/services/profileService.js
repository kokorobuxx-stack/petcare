import { supabase } from './supabaseClient.js';
import { getState } from './authService.js';
import { mutate } from '../utils/query.js';

// Pelanggan: trigger database otomatis menyalin nama dan telepon ke data pelanggan.
export async function updateMyProfile({ full_name, phone }) {
  const { user, profile } = getState();
  await mutate(supabase.from('profiles').update({ full_name, phone }).eq('id', user.id));
  profile.full_name = full_name; // perbarui tampilan tanpa muat ulang
  profile.phone = phone;
}