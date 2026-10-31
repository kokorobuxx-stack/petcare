import { supabase } from './supabaseClient.js';
import { cleanSearch, rangeOf, mutate } from '../utils/query.js';

export const PAYMENT_METHOD = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS', kartu: 'Kartu' };

const COLS =
  'id, transaction_code, booking_id, replaces_transaction_id, subtotal, discount, total_amount, payment_method, ' +
  'payment_status, paid_at, cancelled_at, cancel_reason, notes, created_at, ' +
  'bookings(booking_code, scheduled_at, customers(full_name), pets(name))';

async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

const sumItems = (items) =>
  (items || []).reduce((n, i) => n + Number(i.unit_price) * Number(i.quantity || 1), 0);

export async function listTransactions({ page, pageSize, search, filters }) {
  let q = supabase.from('transactions').select(COLS, { count: 'exact' }).is('deleted_at', null);
  if (filters.status) q = q.eq('payment_status', filters.status);
  if (filters.method) q = q.eq('payment_method', filters.method);
  const s = cleanSearch(search);
  if (s) q = q.ilike('transaction_code', `%${s}%`);
  const [from, to] = rangeOf(page, pageSize);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: data, count: count || 0 };
}

export const getBookingItems = (bookingId) =>
  run(supabase.from('booking_items')
    .select('id, service_name, unit_price, duration_minutes, quantity')
    .eq('booking_id', bookingId).order('created_at'));

export async function getTransactionDetail(row) {
  const [items, replaced, replacers] = await Promise.all([
    getBookingItems(row.booking_id),
    row.replaces_transaction_id
      ? run(supabase.from('transactions').select('transaction_code').eq('id', row.replaces_transaction_id).maybeSingle())
      : Promise.resolve(null),
    run(supabase.from('transactions').select('transaction_code')
      .eq('replaces_transaction_id', row.id).is('deleted_at', null).limit(1)),
  ]);
  return {
    items,
    replaces: replaced?.transaction_code || null,
    replacedBy: replacers?.[0]?.transaction_code || null,
  };
}

// Booking selesai yang belum punya transaksi sama sekali (maksimal 200 terbaru).
// Booking yang transaksinya sudah dibatalkan diproses lewat tombol "Buat pengganti".
export async function getBillableBookings() {
  const data = await run(supabase.from('bookings')
    .select('id, booking_code, scheduled_at, customers(full_name), pets(name), booking_items(unit_price, quantity), transactions(id, deleted_at)')
    .eq('status', 'completed').is('deleted_at', null)
    .order('scheduled_at', { ascending: false }).limit(200));
  return data
    .filter((b) => !(b.transactions || []).some((t) => !t.deleted_at))
    .map((b) => ({
      id: b.id,
      code: b.booking_code,
      who: [b.customers?.full_name, b.pets?.name].filter(Boolean).join(' · '),
      scheduled_at: b.scheduled_at,
      subtotal: sumItems(b.booking_items),
    }));
}

export const subtotalOf = sumItems;

// subtotal, total, kode, dan pencatat diisi database.
export async function createTransaction(v) {
  const active = await run(supabase.from('transactions').select('id')
    .eq('booking_id', v.booking_id).is('deleted_at', null)
    .in('payment_status', ['belum_bayar', 'lunas']).limit(1));
  if (active?.length) {
    throw Object.assign(new Error('Booking ini sudah memiliki transaksi aktif.'), { code: 'P0001' });
  }
  const payload = {
    booking_id: v.booking_id,
    discount: v.discount,
    payment_method: v.payment_method,
    payment_status: v.payment_status,
    notes: v.notes,
  };
  if (v.replaces_transaction_id) payload.replaces_transaction_id = v.replaces_transaction_id;
  const { error } = await supabase.from('transactions').insert(payload);
  if (error) throw error;
}

export const updateTransaction = (id, v) =>
  mutate(supabase.from('transactions').update({
    discount: v.discount, payment_method: v.payment_method, notes: v.notes,
  }).eq('id', id));

export const updateNotes = (id, notes) =>
  mutate(supabase.from('transactions').update({ notes }).eq('id', id));

export const markPaid = (id) =>
  mutate(supabase.from('transactions').update({ payment_status: 'lunas' }).eq('id', id));

export const cancelTransaction = (id, reason) =>
  mutate(supabase.from('transactions').update({ payment_status: 'dibatalkan', cancel_reason: reason }).eq('id', id));