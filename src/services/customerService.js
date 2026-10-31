import { supabase } from './supabaseClient.js';
import { cleanSearch, rangeOf, mutate } from '../utils/query.js';

const COLS = 'id, profile_id, full_name, phone, email, address, notes, created_at, deleted_at';
const BOOKING_SELECT =
  'id, booking_code, scheduled_at, status, staff_id, pets(name), booking_items(service_name)';

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listCustomers({ page, pageSize, search, filters }) {
  let q = supabase.from('customers').select(COLS, { count: 'exact' });
  q = filters.archive === 'only' ? q.not('deleted_at', 'is', null) : q.is('deleted_at', null);
  if (filters.type === 'akun') q = q.not('profile_id', 'is', null);
  if (filters.type === 'walkin') q = q.is('profile_id', null);
  const s = cleanSearch(search);
  if (s) q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`);
  const [from, to] = rangeOf(page, pageSize);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: data, count: count || 0 };
}

// Walk-in: profile_id sengaja tidak dikirim (NULL). created_by diisi otomatis oleh database.
export async function createWalkin(v) {
  const { error } = await supabase.from('customers').insert({
    full_name: v.full_name, phone: v.phone, email: v.email,
    address: v.address, notes: v.notes,
  });
  if (error) throw error;
}

// Pelanggan ber-akun: nama dan telepon dikunci database, jadi hanya email, alamat, catatan yang dikirim.
export function updateCustomer(row, v) {
  const payload = row.profile_id
    ? { email: v.email, address: v.address, notes: v.notes }
    : { full_name: v.full_name, phone: v.phone, email: v.email, address: v.address, notes: v.notes };
  return mutate(supabase.from('customers').update(payload).eq('id', row.id));
}

export const archiveCustomer = (id) =>
  mutate(supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id));

export const restoreCustomer = (id) =>
  mutate(supabase.from('customers').update({ deleted_at: null }).eq('id', id));

export async function getCustomerDetail(id) {
  const [pets, bookings] = await Promise.all([
    run(supabase.from('pets').select('id, name, species, breed, gender').eq('customer_id', id).is('deleted_at', null).order('name')),
    run(supabase.from('bookings').select(BOOKING_SELECT).eq('customer_id', id).is('deleted_at', null)
      .order('scheduled_at', { ascending: false }).limit(10)),
  ]);
  return { pets, bookings };
}