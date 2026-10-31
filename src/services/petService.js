import { supabase } from './supabaseClient.js';
import { getState } from './authService.js';
import { cleanSearch, rangeOf, mutate } from '../utils/query.js';

const COLS =
  'id, customer_id, name, species, breed, birth_date, gender, notes, created_at, deleted_at, customers(full_name)';
const BOOKING_SELECT =
  'id, booking_code, scheduled_at, status, staff_id, pets(name), booking_items(service_name)';

export async function listPets({ page, pageSize, search, filters }) {
  let q = supabase.from('pets').select(COLS, { count: 'exact' });
  q = filters.archive === 'only' ? q.not('deleted_at', 'is', null) : q.is('deleted_at', null);
  if (filters.species) q = q.eq('species', filters.species);
  if (filters.gender) q = q.eq('gender', filters.gender);
  const s = cleanSearch(search);
  if (s) q = q.or(`name.ilike.%${s}%,breed.ilike.%${s}%`);
  const [from, to] = rangeOf(page, pageSize);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: data, count: count || 0 };
}

// Daftar pemilik untuk Admin/Petugas saat menambah hewan (maksimal 500 pelanggan aktif).
export async function getOwnerOptions() {
  const { data, error } = await supabase
    .from('customers').select('id, full_name, phone').is('deleted_at', null)
    .order('full_name').limit(500);
  if (error) throw error;
  return data.map((c) => ({ value: c.id, label: `${c.full_name}${c.phone ? ' (' + c.phone + ')' : ''}` }));
}

// Untuk pelanggan: id data pelanggan milik akunnya sendiri.
export async function getMyCustomerId() {
  const { data, error } = await supabase
    .from('customers').select('id').eq('profile_id', getState().user.id)
    .is('deleted_at', null).maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function createPet(v) {
  const { error } = await supabase.from('pets').insert({
    customer_id: v.customer_id, name: v.name, species: v.species, breed: v.breed,
    birth_date: v.birth_date, gender: v.gender, notes: v.notes,
  });
  if (error) throw error;
}

// customer_id sengaja tidak dikirim: pemilik tidak boleh diubah.
export const updatePet = (id, v) =>
  mutate(supabase.from('pets').update({
    name: v.name, species: v.species, breed: v.breed,
    birth_date: v.birth_date, gender: v.gender, notes: v.notes,
  }).eq('id', id));

export const archivePet = (id) =>
  mutate(supabase.from('pets').update({ deleted_at: new Date().toISOString() }).eq('id', id));

export const restorePet = (id) =>
  mutate(supabase.from('pets').update({ deleted_at: null }).eq('id', id));

export async function getPetBookings(id) {
  const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT)
    .eq('pet_id', id).is('deleted_at', null)
    .order('scheduled_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data;
}