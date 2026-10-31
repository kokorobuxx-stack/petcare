import { supabase } from './supabaseClient.js';
import { cleanSearch, rangeOf, mutate } from '../utils/query.js';

const COLS =
  'id, profile_id, job_title, specialization, is_active, deleted_at, created_at, profiles!inner(full_name, phone, is_active)';
const BOOKING_SELECT =
  'id, booking_code, scheduled_at, status, staff_id, customers(full_name), pets(name), booking_items(service_name)';

export async function listStaff({ page, pageSize, search, filters }) {
  let q = supabase.from('staff').select(COLS, { count: 'exact' });
  q = filters.archive === 'only' ? q.not('deleted_at', 'is', null) : q.is('deleted_at', null);
  if (filters.job_title) q = q.eq('job_title', filters.job_title);
  if (filters.status === 'active') q = q.eq('is_active', true);
  if (filters.status === 'inactive') q = q.eq('is_active', false);
  const s = cleanSearch(search);
  if (s) q = q.ilike('profiles.full_name', `%${s}%`);
  const [from, to] = rangeOf(page, pageSize);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: data, count: count || 0 };
}

export async function getStaffBookings(id) {
  const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT)
    .eq('staff_id', id).is('deleted_at', null)
    .order('scheduled_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data;
}

export const updateStaff = (id, v) =>
  mutate(supabase.from('staff').update({
    job_title: v.job_title, specialization: v.specialization,
  }).eq('id', id));

// Mengubah status petugas DAN akun login-nya. Jika langkah kedua gagal, langkah pertama dikembalikan.
export async function setStaffActive(row, active) {
  await mutate(supabase.from('staff').update({ is_active: active }).eq('id', row.id));
  try {
    await mutate(supabase.from('profiles').update({ is_active: active }).eq('id', row.profile_id));
  } catch (e) {
    try {
      await mutate(supabase.from('staff').update({ is_active: !active }).eq('id', row.id));
    } catch (_) { /* abaikan: akan terlihat di daftar saat dimuat ulang */ }
    throw e;
  }
}

export const archiveStaff = (id) =>
  mutate(supabase.from('staff').update({ deleted_at: new Date().toISOString() }).eq('id', id));

export async function restoreStaff(id) {
  const { error } = await supabase.rpc('rpc_restore_staff', { p_staff_id: id });
  if (error) throw error;
}

// Direktori untuk Petugas (hanya kolom aman). Filter dan halaman dikerjakan di browser.
export async function listDirectory({ page, pageSize, search, filters }) {
  const { data, error } = await supabase.rpc('rpc_staff_directory');
  if (error) throw error;
  const s = cleanSearch(search).toLowerCase();
  let rows = (data || []).filter((r) =>
    (!s || (r.full_name || '').toLowerCase().includes(s)) &&
    (!filters.job_title || r.job_title === filters.job_title) &&
    (!filters.status || (filters.status === 'active') === Boolean(r.is_active))
  );
  rows.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'id'));
  const [from, to] = rangeOf(page, pageSize);
  return { rows: rows.slice(from, to + 1), count: rows.length };
}