import { supabase } from './supabaseClient.js';
import { cleanSearch, rangeOf, mutate } from '../utils/query.js';
import { todayRangeJakarta } from '../utils/formatters.js';

export const JOB_LABEL = {
  dokter_hewan: 'Dokter hewan',
  paramedis: 'Paramedis',
  groomer: 'Groomer',
  resepsionis: 'Resepsionis',
  lainnya: 'Lainnya',
};

const COLS =
  'id, booking_code, customer_id, pet_id, staff_id, scheduled_at, ends_at, status, complaint, cancel_reason, created_at, ' +
  'customers(full_name, phone), pets(name, species), ' +
  'booking_items(id, service_name, unit_price, duration_minutes, quantity)';

export async function listBookings({ page, pageSize, search, filters }) {
  let q = supabase.from('bookings').select(COLS, { count: 'exact' }).is('deleted_at', null);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.assign === 'none') q = q.is('staff_id', null);

  const nowIso = new Date().toISOString();
  if (filters.when === 'today') {
    const { start, end } = todayRangeJakarta();
    q = q.gte('scheduled_at', start).lt('scheduled_at', end);
  } else if (filters.when === 'upcoming') {
    q = q.gte('scheduled_at', nowIso);
  } else if (filters.when === 'past') {
    q = q.lt('scheduled_at', nowIso);
  }

  const s = cleanSearch(search);
  if (s) q = q.ilike('booking_code', `%${s}%`);

  const asc = filters.when === 'today' || filters.when === 'upcoming';
  const [from, to] = rangeOf(page, pageSize);
  const { data, error, count } = await q.order('scheduled_at', { ascending: asc }).range(from, to);
  if (error) throw error;
  return { rows: data, count: count || 0 };
}

// Admin: tabel staff (profil boleh dibaca Admin). Petugas: RPC direktori (kolom aman saja).
export async function getStaffOptions(role) {
  let list;
  if (role === 'admin') {
    const { data, error } = await supabase
      .from('staff')
      .select('id, job_title, is_active, profiles!inner(full_name)')
      .is('deleted_at', null);
    if (error) throw error;
    list = data.map((r) => ({
      id: r.id, name: r.profiles?.full_name || '-', job_title: r.job_title, is_active: Boolean(r.is_active),
    }));
  } else {
    const { data, error } = await supabase.rpc('rpc_staff_directory');
    if (error) throw error;
    list = (data || []).map((r) => ({
      id: r.id, name: r.full_name || '-', job_title: r.job_title, is_active: Boolean(r.is_active),
    }));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

export async function getActiveServices() {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, category, price, duration_minutes')
    .eq('is_active', true).is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return data;
}

export async function getCustomerPets(customerId) {
  const { data, error } = await supabase
    .from('pets').select('id, name, species')
    .eq('customer_id', customerId).is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return data;
}

// ends_at tidak dikirim: dihitung database. Petugas hanya dikirim jika dipilih.
export async function createBooking(v) {
  const args = {
    p_customer_id: v.customer_id,
    p_pet_id: v.pet_id,
    p_service_ids: v.service_ids,
    p_scheduled_at: v.scheduled_at,
  };
  if (v.staff_id) args.p_staff_id = v.staff_id;
  if (v.complaint) args.p_complaint = v.complaint;
  const { data, error } = await supabase.rpc('rpc_create_booking', args);
  if (error) throw error;
  return data;
}

export const assignStaff = (id, staffId) =>
  mutate(supabase.from('bookings').update({ staff_id: staffId }).eq('id', id));

export const setStatus = (id, status) =>
  mutate(supabase.from('bookings').update({ status }).eq('id', id));

export const cancelBooking = (id, reason) =>
  mutate(supabase.from('bookings').update({ status: 'cancelled', cancel_reason: reason }).eq('id', id));